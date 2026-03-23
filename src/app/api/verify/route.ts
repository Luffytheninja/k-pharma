import { NextResponse } from "next/server";

// NAFDAC Verification API route
// This is the ONLY place the API key exists — never on the client
const NAFDAC_API_KEY = process.env.NAFDAC_API_KEY;
const CHECKR_URL_BASE = "https://api.9jacheckr.xyz/api/verify";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nafdac_number } = body;

    if (!nafdac_number || typeof nafdac_number !== "string") {
      return NextResponse.json({ error: "nafdac_number is required" }, { status: 400 });
    }

    const normalized = nafdac_number.trim().toUpperCase();

    // No mock data - all requests now bypass to the live API natively

    // 2. Call the live 9ja Checkr NAFDAC API
    if (!NAFDAC_API_KEY) {
      return NextResponse.json({
        status: "config_error",
        error: "CRITICAL ERROR: NAFDAC KEY MISSING ON VERCEL. Add NAFDAC_API_KEY to your Vercel Dashboard and REDEPLOY.",
      }, { status: 500 });
    }

    try {
      const scraperResponse = await fetch(`${CHECKR_URL_BASE}/${normalized}`, {
        method: "GET",
        headers: {
          "x-api-key": NAFDAC_API_KEY,
        },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      if (scraperResponse.ok) {
        const scraperData = await scraperResponse.json();
        const data = scraperData.data || scraperData.product || scraperData;

        // 9ja Checkr returns 'ingredients' as an array for some codes, or 'active_ingredient' for others
        const parsedComposition = data.active_ingredient ?? data["Active Ingredient"] ?? 
          (Array.isArray(data.ingredients) ? data.ingredients.join(", ") : undefined);

        return NextResponse.json({
          status: "verified",
          source: "live",
          drug: {
            nafdac_number: data.nafdac || normalized,
            name: data.name ?? data["Product name"] ?? "Verified Drug",
            manufacturer: data.manufacturer ?? data["Product Manufacturer"] ?? "Verified Manufacturer",
            status: "verified",
            composition: parsedComposition,
            drug_class: data.category ?? data["Product Category"],
          },
        });
      } else {
        // If 9ja checkr legitimately returned 404 or something else
        return NextResponse.json({
          status: "not_found",
          source: "miss",
          drug: {
            nafdac_number: normalized,
            name: "Not Found",
            manufacturer: "Not in NAFDAC registry",
            status: "not_found",
          },
        });
      }
    } catch (scraperError: any) {
      console.error("Scraper call failed:", scraperError);
      return NextResponse.json({
        status: "api_timeout_error",
        error: scraperError.message || "Timeout or Network Error contacting 9ja Checkr from Vercel servers.",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Verify route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
