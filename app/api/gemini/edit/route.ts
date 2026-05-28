import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({
      error: "GEMINI_API_KEY environment variable is not defined yet."
    }, { status: 400 });
  }

  try {
    const { image, prompt } = await req.json();

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Missing or invalid base64 image input" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Parse the base64 details
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format uploaded" }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const compositePrompt = `You are a professional retail and commercial product photographer.
Please edit this product photo. Place the product naturally inside a gorgeous, professional setting described as follows: "${prompt || "elegant minimalist studio backdrop"}". Ensure the product's original details, shape, and branding remain fully visible, sharp, and natural, maintaining high contrast and elegant photorealistic lighting. Do not add random animals or block the product.`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "image/jpeg"
            }
          },
          {
            text: compositePrompt
          }
        ]
      }
    });

    let returnImg = "";
    
    if (modelResponse.candidates?.[0]?.content?.parts) {
      for (const part of modelResponse.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const resultBase64 = part.inlineData.data;
          const resultMime = part.inlineData.mimeType || "image/png";
          returnImg = `data:${resultMime};base64,${resultBase64}`;
          break;
        }
      }
    }

    if (!returnImg) {
      // In case the image model output was text instruction or empty,
      // fallback to creating a stylized overlay / notification or return the original
      throw new Error("No inline image bytes generated back from the AI model.");
    }

    return NextResponse.json({ imageProcessed: returnImg });
  } catch (error: any) {
    console.error("Gemini Edit Studio API Error:", error);
    return NextResponse.json({
      error: "Failed to compile background scenery options.",
      details: error.message
    }, { status: 500 });
  }
}
