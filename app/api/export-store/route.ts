import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeType, config, product } = body;

    if (!storeType || !config) {
      return NextResponse.json({ error: "Missing storeType or configuration credentials." }, { status: 400 });
    }

    if (storeType === "shopify") {
      const { shopDomain, accessToken } = config;
      if (!shopDomain || !accessToken) {
        return NextResponse.json({ error: "Missing Shopify Shop Domain or Admin Access Token." }, { status: 400 });
      }

      // Sanitize shop domain
      let sanitizedDomain = shopDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!sanitizedDomain.includes("myshopify.com") && !sanitizedDomain.includes(".")) {
        sanitizedDomain = `${sanitizedDomain}.myshopify.com`;
      }

      const shopifyUrl = `https://${sanitizedDomain}/admin/api/2023-10/products.json`;

      // Extract base64 representation if image is localized upload
      let imageAttachment: string | undefined;
      const targetImage = product.imageProcessed || product.imageOriginal;
      if (targetImage && targetImage.startsWith("data:image/")) {
        const parts = targetImage.split(";base64,");
        if (parts.length === 2) {
          imageAttachment = parts[1];
        }
      }

      // Build Shopify product representation
      const shopifyPayload = {
        product: {
          title: product.title,
          body_html: product.description,
          vendor: "Marketeer Premium CRM",
          product_type: product.category,
          status: "draft",
          tags: product.tags?.join(", ") || "",
          variants: [
            {
              price: String(product.priceSweet),
              sku: `MKTR-${product.id}`,
              inventory_management: null,
            }
          ],
          images: imageAttachment 
            ? [ { attachment: imageAttachment, filename: `mktr_${product.id}.png` } ]
            : targetImage && !targetImage.includes("picsum.photos") && !targetImage.includes("placeholder")
              ? [ { src: targetImage } ]
              : []
        }
      };

      const response = await fetch(shopifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify(shopifyPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return NextResponse.json({
          error: "Shopify API returned an error.",
          details: responseData.errors || responseData,
          success: false
        }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        message: "Successfully created product Draft in Shopify!",
        productId: responseData.product?.id,
        adminUrl: `https://${sanitizedDomain}/admin/products/${responseData.product?.id}`,
        data: responseData.product
      });

    } else if (storeType === "woocommerce") {
      const { siteUrl, consumerKey, consumerSecret } = config;
      if (!siteUrl || !consumerKey || !consumerSecret) {
        return NextResponse.json({ error: "Missing WooCommerce Site URL, Key or Secret." }, { status: 400 });
      }

      const sanitizedSite = siteUrl.trim().replace(/\/$/, "");
      const wcUrl = `${sanitizedSite}/wp-json/wc/v3/products`;

      const wcPayload = {
        name: product.title,
        type: "simple",
        regular_price: String(product.priceSweet),
        description: product.description,
        status: "draft",
        sku: `MKTR-${product.id}`,
        categories: [{ name: product.category }],
        tags: product.tags?.map((t: string) => ({ name: t })) || [],
        images: product.imageProcessed && !product.imageProcessed.startsWith("data:image/")
          ? [{ src: product.imageProcessed }]
          : []
      };

      const base64Auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

      const response = await fetch(wcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${base64Auth}`,
        },
        body: JSON.stringify(wcPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return NextResponse.json({
          error: "WooCommerce API returned an error.",
          details: responseData || "Standard Connection Error",
          success: false
        }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        message: "Successfully created product Draft in WooCommerce!",
        productId: responseData.id,
        adminUrl: `${sanitizedSite}/wp-admin/post.php?post=${responseData.id}&action=edit`,
        data: responseData
      });
    }

    return NextResponse.json({ error: "Unsupported integration storeType values" }, { status: 400 });

  } catch (error: any) {
    console.error("Export API handler error: ", error);
    return NextResponse.json({
      error: "Failed to communicate with external e-commerce server.",
      details: error.message
    }, { status: 500 });
  }
}
