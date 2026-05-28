import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

// List of fallback models to ensure extremely high availability
const MODEL_FALLBACK_POOL = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview"
];

// Robust JSON extraction and parsing utility
function extractJson(text: string): any {
  let cleaned = text.trim();
  console.log("[GEMINI PROCESSOR] Raw text block lengths:", cleaned.length);

  // 1. Try to extract from custom markdown JSON block
  const jsonBlockStart = cleaned.indexOf("```json");
  if (jsonBlockStart !== -1) {
    const fromJson = cleaned.substring(jsonBlockStart + 7);
    const jsonBlockEnd = fromJson.indexOf("```");
    if (jsonBlockEnd !== -1) {
      cleaned = fromJson.substring(0, jsonBlockEnd).trim();
    } else {
      cleaned = fromJson.trim();
    }
  } else {
    // 2. Try to extract from standard markdown code block
    const codeBlockStart = cleaned.indexOf("```");
    if (codeBlockStart !== -1) {
      const fromCode = cleaned.substring(codeBlockStart + 3);
      const codeBlockEnd = fromCode.indexOf("```");
      if (codeBlockEnd !== -1) {
        cleaned = fromCode.substring(0, codeBlockEnd).trim();
      } else {
        cleaned = fromCode.trim();
      }
    }
  }

  // 3. Find exact boundaries of the outer JSON object to filter any conversational wrapper sentences
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 4. Strip duplicate trailing commas inside objects/arrays which violate standard JSON specs
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  console.log("[GEMINI PROCESSOR] Extracted text length after cleaning:", cleaned.length);
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  if (!apiKey) {
    console.error("[GEMINI PROCESSOR] Missing GEMINI_API_KEY environment variable.");
    return NextResponse.json({
      error: "GEMINI_API_KEY environment variable is not defined yet."
    }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid request payload JSON body" }, { status: 400 });
  }

  const { title, category, condition, image } = body;
  const isMultimodal = !!(image && image.startsWith("data:image/"));

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  // Prompt detailing requirements
  const prompt = `You are an expert luxury, consumer electronics, and retail product appraiser.
Your job is to thoroughly inspect and analyze the given product image, then compile a highly professional resale listing.

Please capture and estimate:
1. "title": A descriptive, premium, SEO-optimized title incorporating any visual brands, materials, colors, or structural highlights.
2. "category": Choose the single closest value from: ["Bags & Accessories", "Electronics", "Clothing", "Home & Garden", "Other"] based on visual representation.
3. "condition": Choose the single closest value from: ["New (Never Used)", "Like New", "Good", "Fair (Signs of use)", "Salvage / Parts"] based on visual state.
4. "description": A highly engaging, rich Markdown product description highlighting key features, materials, aesthetics, and general quality indicators.
5. "priceSweet": Recommended realistic "sweet spot" sales price target in USD (integer).
6. "priceLow": A lower floor benchmark to accept quick offers or liquidation speed (integer).
7. "priceHigh": An premium list price targeting maximum value but allowing haggling room (integer).
8. "priceReasoning": Detailed comps rationale. Explain which retail items this matches or why its condition guides these pricing boundaries.
9. "tags": Array of 4-6 lowercase search keys.
10. "tips": Object with guidelines:
    - "ebay": Suggested SEO title/keyword patterns.
    - "facebookMarketplace": Safe meetups or communication guides.
    - "offerup": Counter-offering tips or quick cash handoffs.
    - "nextdoor": Neighbors pickup or local ease guidelines.

You MUST respond strictly with a valid JSON document conforming to this exact structure:
{
  "title": "SEO Optimized Product Title",
  "category": "Electronics",
  "condition": "Like New",
  "description": "# Product Title\\n- Features\\n- Material quality reviews",
  "priceSweet": 149,
  "priceLow": 120,
  "priceHigh": 185,
  "priceReasoning": "Pricing based on average comps on marketplaces.",
  "tags": ["brand", "model", "premium"],
  "tips": {
    "ebay": "Optimize listings with detailed sizes.",
    "facebookMarketplace": "Offer local public delivery options.",
    "offerup": "List above sweet spot due to bids.",
    "nextdoor": "Promote secure front-porch handoffs."
  }
}`;

  // Multi-tiered Model and Payload config execution pool
  for (const modelName of MODEL_FALLBACK_POOL) {
    // Try both JSON Mode enabled and disabled to prevent mime exceptions
    for (const jsonConfig of [true, false]) {
      try {
        console.log(`[GEMINI PROCESSOR] Querying ${modelName} | JSON Mode: ${jsonConfig} | Multimodal: ${isMultimodal}`);

        const config: any = {};
        if (jsonConfig) {
          config.responseMimeType = "application/json";
        }

        let response;
        if (isMultimodal) {
          const match = image.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            throw new Error("Base64 image match failed or corrupt URI payload.");
          }
          const mimeType = match[1];
          const base64Data = match[2];

          const imagePart = {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Data
            }
          };

          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, { text: prompt }] },
            config
          });
        } else {
          // Fallback text-guided evaluation
          const textGuidedPrompt = `Evaluate the following product metadata details and complete the requested resale details:
Title input: "${title || "Anonymous item"}"
Category: "${category || "Other"}"
Condition: "${condition || "Good"}"

${prompt}`;

          response = await ai.models.generateContent({
            model: modelName,
            contents: textGuidedPrompt,
            config
          });
        }

        const rawText = response.text;
        if (!rawText) {
          throw new Error("Returned content body was empty.");
        }

        const parsedResult = extractJson(rawText);

        // Normalize property values to guarantee absolute safety on client side
        const output = {
          title: parsedResult.title || title || "Analyzed Premium Resale Item",
          category: parsedResult.category || category || "Other",
          condition: parsedResult.condition || condition || "Good",
          description: parsedResult.description || "Decisive retail listing curated automatically via visual appraisal.",
          priceSweet: Number(parsedResult.priceSweet) || 50,
          priceLow: Number(parsedResult.priceLow) || 40,
          priceHigh: Number(parsedResult.priceHigh) || 65,
          priceReasoning: parsedResult.priceReasoning || "Estimated pricing bounds matched based on product condition metadata indexes.",
          tags: Array.isArray(parsedResult.tags) ? parsedResult.tags : ["resell", "appraisal"],
          tips: {
            ebay: parsedResult.tips?.ebay || parsedResult.platformTips?.ebay || "Optimize keywords.",
            facebookMarketplace: parsedResult.tips?.facebookMarketplace || parsedResult.platformTips?.facebookMarketplace || "Local pickup exchange.",
            offerup: parsedResult.tips?.offerup || parsedResult.platformTips?.offerup || "Allow negotiations.",
            nextdoor: parsedResult.tips?.nextdoor || parsedResult.platformTips?.nextdoor || "Immediate porch trades."
          }
        };

        console.log("[GEMINI PROCESSOR] Listing parsed and normalized successfully! Returning output.");
        return NextResponse.json(output);

      } catch (innerError: any) {
        console.warn(`[GEMINI PROCESSOR] Configuration attempt failed with ${modelName} | JSON Mode: ${jsonConfig}:`, innerError?.message || innerError);
        // Continue iterating to next config option
      }
    }
  }

  // Absolute fallback in case all models and options fail (extremely unlikely, but keeps the app operational without errors)
  console.error("[GEMINI PROCESSOR] All model configurations in the pool failed.");
  return NextResponse.json({
    error: "Failed to read the image properly via vision models.",
    details: "Your API key or visual inputs might be rate-limited. Falling back gracefully."
  }, { status: 503 });
}
