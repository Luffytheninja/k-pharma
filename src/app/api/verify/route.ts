import { NextResponse } from "next/server";

// NAFDAC Verification API route
// This is the ONLY place the API key exists — never on the client
const NAFDAC_API_KEY = process.env.NAFDAC_API_KEY;
const CHECKR_URL_BASE = "https://api.9jacheckr.xyz/api/verify";

// Mock database cache for MVP (replace with Supabase calls in production)
const mockKnownDrugs: Record<string, { name: string; manufacturer: string; status: string; composition?: string; drug_class?: string; oncology_notes?: string }> = {
  "A4-1234": { name: "Paracetamol 500mg", manufacturer: "Emzor Pharmaceuticals Ltd", status: "verified", composition: "Paracetamol 500mg per tablet", drug_class: "Analgesic / Antipyretic" },
  "A4-0001": { name: "Amoxicillin 250mg", manufacturer: "May & Baker Nigeria Ltd", status: "verified", composition: "Amoxicillin trihydrate equivalent to Amoxicillin 250mg", drug_class: "Beta-lactam Antibiotic" },
  "B2-5678": { name: "Amalar Forte", manufacturer: "Unregistered Source", status: "caution" },
  "C1-9999": { name: "Diazepam 5mg", manufacturer: "Sigma Pharmaceuticals", status: "verified", composition: "Diazepam 5mg", drug_class: "Benzodiazepine / Anxiolytic", oncology_notes: "Use with extreme caution in oncology patients on opioids — risk of respiratory depression" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nafdac_number } = body;

    if (!nafdac_number || typeof nafdac_number !== "string") {
      return NextResponse.json({ error: "nafdac_number is required" }, { status: 400 });
    }

    const normalized = nafdac_number.trim().toUpperCase();

    // 1. Check local mock cache (simulates Supabase cache check)
    const cached = mockKnownDrugs[normalized] ?? mockKnownDrugs[nafdac_number.trim()];
    if (cached) {
      return NextResponse.json({
        status: cached.status,
        source: "cache",
        drug: {
          nafdac_number: normalized,
          name: cached.name,
          manufacturer: cached.manufacturer,
          status: cached.status,
          composition: cached.composition,
          drug_class: cached.drug_class,
          oncology_notes: (cached as any).oncology_notes,
          cached_at: new Date().toISOString(),
        },
      });
    }

    // 2. Call the live 9ja Checkr NAFDAC API
    if (NAFDAC_API_KEY) {
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
        }
      } catch (scraperError) {
        console.error("Scraper call failed:", scraperError);
        // Fall through to not_found
      }
    }

    // 3. Not found
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
  } catch (error) {
    console.error("Verify route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
