/**
 * Fetches U.S. economic data from FRED API.
 * Target series: GDP, CPI, Unemployment, Fed Funds, Retail Sales, Consumer Confidence.
 * Returns latest observation for each (or most recent if not released today).
 */

const FRED_BASE = "https://api.stlouisfed.org/fred";

const TARGET_SERIES: { id: string; name: string }[] = [
  { id: "GDP", name: "GDP" },
  { id: "CPIAUCSL", name: "CPI — Inflation" },
  { id: "UNRATE", name: "Unemployment Rate" },
  { id: "FEDFUNDS", name: "Federal Funds Rate" },
  { id: "RSAFS", name: "Retail Sales" },
  { id: "UMCSENT", name: "Consumer Confidence" },
];

export type EconomicDataPoint = {
  item: string;
  value: string;
  date: string;
};

export async function fetchEconomicData(): Promise<EconomicDataPoint[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY is not set in environment.");
  }

  const results: EconomicDataPoint[] = [];

  for (const { id, name } of TARGET_SERIES) {
    try {
      const url = new URL(`${FRED_BASE}/series/observations`);
      url.searchParams.set("series_id", id);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("sort_order", "desc");
      url.searchParams.set("limit", "1");

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`[fetchEconomicData] FRED ${id} failed: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        observations?: Array< { date: string; value: string } >;
      };
      const observations = data?.observations ?? [];
      const latest = observations[0];
      if (latest && latest.value && latest.value !== ".") {
        results.push({
          item: name,
          value: latest.value,
          date: latest.date,
        });
      }
    } catch (err) {
      console.warn(`[fetchEconomicData] Error fetching ${id}:`, err);
    }
  }

  return results;
}

// Test: call from a route or run: npx tsx -e "import('./lib/fetchEconomicData').then(m=>m.fetchEconomicData().then(d=>console.log(JSON.stringify(d,null,2))).catch(console.error))"
