/**
 * Fetches U.S. economic data from FRED API.
 * For each series: latest + previous observation, last 10 observations (history),
 * change, changePct, direction, unit, frequency.
 */

const FRED_BASE = "https://api.stlouisfed.org/fred";

const TARGET_SERIES: {
  id: string;
  name: string;
  unit: string;
  frequency: string;
}[] = [
  { id: "GDP", name: "GDP", unit: "Billions of Dollars", frequency: "Quarterly" },
  {
    id: "CPIAUCSL",
    name: "CPI — Inflation",
    unit: "Index",
    frequency: "Monthly",
  },
  {
    id: "UNRATE",
    name: "Unemployment Rate",
    unit: "Percent",
    frequency: "Monthly",
  },
  {
    id: "FEDFUNDS",
    name: "Federal Funds Rate",
    unit: "Percent",
    frequency: "Monthly",
  },
  {
    id: "RSAFS",
    name: "Retail Sales",
    unit: "Millions of Dollars",
    frequency: "Monthly",
  },
  {
    id: "UMCSENT",
    name: "Consumer Confidence",
    unit: "Index 1966=100",
    frequency: "Monthly",
  },
];

export type EconomicSeries = {
  seriesId: string;
  item: string;
  currentValue: string;
  previousValue: string;
  change: string;
  changePct: string;
  direction: "up" | "down" | "flat";
  date: string;
  trend: { date: string; value: string }[];
  unit: string;
  frequency: string;
  source: string;
};

/** For backwards compatibility where a flat list of points is expected. */
export type EconomicDataPoint = {
  item: string;
  value: string;
  date: string;
};

function parseNum(s: string): number | null {
  if (s === "." || s === "" || s == null) return null;
  const n = parseFloat(String(s).replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function formatChange(absDiff: number): string {
  const sign = absDiff > 0 ? "+" : absDiff < 0 ? "" : "";
  return `${sign}${absDiff.toFixed(2)}`;
}

function formatChangePct(pct: number): string {
  const sign = pct > 0 ? "+" : pct < 0 ? "" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export async function fetchEconomicData(): Promise<EconomicSeries[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY is not set in environment.");
  }

  const results: EconomicSeries[] = [];

  for (const series of TARGET_SERIES) {
    try {
      const url = new URL(`${FRED_BASE}/series/observations`);
      url.searchParams.set("series_id", series.id);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("sort_order", "desc");
      url.searchParams.set("limit", "10");

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`[fetchEconomicData] FRED ${series.id} failed: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        observations?: Array<{ date: string; value: string }>;
      };
      const rawObs = data?.observations ?? [];
      const validObs = rawObs.filter((o) => o.value !== "." && o.value != null && o.value !== "");

      if (validObs.length === 0) continue;

      const currentValue = validObs[0].value;
      const date = validObs[0].date;
      const previousValue = validObs.length >= 2 ? validObs[1].value : currentValue;

      const currNum = parseNum(currentValue);
      const prevNum = parseNum(previousValue);

      let change = "";
      let changePct = "";
      let direction: "up" | "down" | "flat" = "flat";

      if (currNum != null && prevNum != null && prevNum !== 0) {
        const absDiff = currNum - prevNum;
        const pct = (absDiff / prevNum) * 100;
        change = formatChange(absDiff);
        changePct = formatChangePct(pct);
        direction = absDiff > 0 ? "up" : absDiff < 0 ? "down" : "flat";
      } else if (currNum != null && prevNum != null && prevNum === 0 && currNum !== 0) {
        change = formatChange(currNum);
        changePct = "+100%";
        direction = "up";
      }

      const trend = [...validObs]
        .reverse()
        .slice(0, 10)
        .map((o) => ({ date: o.date, value: o.value }));

      results.push({
        seriesId: series.id,
        item: series.name,
        currentValue,
        previousValue,
        change,
        changePct,
        direction,
        date,
        trend,
        unit: series.unit,
        frequency: series.frequency,
        source: "Federal Reserve FRED",
      });
    } catch (err) {
      console.warn(`[fetchEconomicData] Error fetching ${series.id}:`, err);
    }
  }

  return results;
}

/**
 * Returns a flat list of { item, value, date } for consumers that expect the old shape
 * (e.g. generateInsights input or simple templates).
 */
export function toDataPoints(series: EconomicSeries[]): EconomicDataPoint[] {
  return series.map((s) => ({
    item: s.item,
    value: s.currentValue,
    date: s.date,
  }));
}
