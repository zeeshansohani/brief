/**
 * Full AI analysis (single batched GPT-4o-mini call).
 * Accepts full EconomicSeries (with trend history + change calculations) and news;
 * returns executiveSummary, economicInsights, marketImpact, newsInsights.
 */

import OpenAI from "openai";
import type { EconomicSeries } from "@/lib/fetchEconomicData";

const SYSTEM_PROMPT = `You are a senior financial analyst writing a morning briefing for sophisticated investors. Be precise, data-driven, and actionable. Reference specific values. No filler, no generic statements. Every insight must be grounded in the actual data provided.`;

export type EconomicInsight = {
  item: string;
  currentValue: string;
  insight: string;
  trendAnalysis: string;
  marketImplication: string;
};

export type SectorToWatch = {
  sector: string;
  reasoning: string;
  direction: "positive" | "negative" | "neutral";
};

export type StockToWatch = {
  ticker: string;
  company: string;
  reasoning: string;
  direction: "positive" | "negative" | "neutral";
};

export type MarketImpact = {
  overallOutlook: string;
  sectorsToWatch: SectorToWatch[];
  stocksToWatch: StockToWatch[];
};

export type NewsInsight = {
  headline: string;
  source: string;
  url: string;
  insight: string;
};

export type FullInsights = {
  executiveSummary: string;
  economicInsights: EconomicInsight[];
  marketImpact: MarketImpact;
  newsInsights: NewsInsight[];
};

export type NewsInput = {
  headline: string;
  source: string;
  url: string;
  publishedAt?: string;
};

function buildEconomicContext(series: EconomicSeries[]): string {
  return series
    .map(
      (s) =>
        `[${s.item}]
  Series ID: ${s.seriesId}
  Current value: ${s.currentValue} (as of ${s.date})
  Previous value: ${s.previousValue}
  Change: ${s.change} (${s.changePct}) — direction: ${s.direction}
  Unit: ${s.unit} | Frequency: ${s.frequency}
  Trend (last ${s.trend.length} periods, oldest to newest):
  ${s.trend.map((t) => `    ${t.date}: ${t.value}`).join("\n")}`
    )
    .join("\n\n");
}

function buildNewsContext(news: NewsInput[]): string {
  return news
    .map(
      (n) =>
        `- Headline: ${n.headline}\n  Source: ${n.source}\n  URL: ${n.url}${n.publishedAt ? `\n  Published: ${n.publishedAt}` : ""}`
    )
    .join("\n\n");
}

const OUTPUT_SCHEMA = `
Respond with a single JSON object (no markdown, no extra text) with exactly these keys:

1. "executiveSummary": string — 4-5 sentence macro overview of today's economic picture based on the data.

2. "economicInsights": array of objects, one per economic indicator, each with:
   - "item": string (indicator name)
   - "currentValue": string (same value from data)
   - "insight": string — 2-3 sentences: what this number means
   - "trendAnalysis": string — 1-2 sentences: what the trend (last 10 periods) shows
   - "marketImplication": string — 1-2 sentences: direct market impact

3. "marketImpact": object with:
   - "overallOutlook": string — 3-4 sentences: combined effect of all data on markets
   - "sectorsToWatch": array of 4-5 objects: { "sector": string, "reasoning": string, "direction": "positive"|"negative"|"neutral" }
   - "stocksToWatch": array of 5-6 objects: { "ticker": string, "company": string, "reasoning": string, "direction": "positive"|"negative"|"neutral" }

4. "newsInsights": array of objects, one per news article, each with:
   - "headline": string (same as provided)
   - "source": string (same as provided)
   - "url": string (same as provided)
   - "insight": string — 2-3 sentences on what this means for investors
`;

export async function generateInsights(
  economicSeries: EconomicSeries[],
  news: NewsInput[]
): Promise<FullInsights> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment.");
  }

  const economicContext = buildEconomicContext(economicSeries);
  const newsContext = buildNewsContext(news);

  const userContent = `Use the following economic data and news to produce the structured briefing.

=== ECONOMIC DATA ===
${economicContext || "(No economic data provided)"}

=== NEWS HEADLINES ===
${newsContext || "(No news provided)"}

${OUTPUT_SCHEMA}`;

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("OpenAI returned empty content.");
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const executiveSummary =
      typeof parsed.executiveSummary === "string"
        ? parsed.executiveSummary
        : "";

    const economicInsights: EconomicInsight[] = Array.isArray(parsed.economicInsights)
      ? (parsed.economicInsights as Record<string, unknown>[]).map((e) => ({
          item: typeof e.item === "string" ? e.item : "",
          currentValue: typeof e.currentValue === "string" ? e.currentValue : "",
          insight: typeof e.insight === "string" ? e.insight : "",
          trendAnalysis: typeof e.trendAnalysis === "string" ? e.trendAnalysis : "",
          marketImplication: typeof e.marketImplication === "string" ? e.marketImplication : "",
        }))
      : [];

    const marketImpactRaw = parsed.marketImpact;
    const marketImpact: MarketImpact = {
      overallOutlook: "",
      sectorsToWatch: [],
      stocksToWatch: [],
    };
    if (marketImpactRaw && typeof marketImpactRaw === "object") {
      const m = marketImpactRaw as Record<string, unknown>;
      marketImpact.overallOutlook =
        typeof m.overallOutlook === "string" ? m.overallOutlook : "";
      if (Array.isArray(m.sectorsToWatch)) {
        marketImpact.sectorsToWatch = (m.sectorsToWatch as Record<string, unknown>[]).map(
          (s) => ({
            sector: typeof s.sector === "string" ? s.sector : "",
            reasoning: typeof s.reasoning === "string" ? s.reasoning : "",
            direction:
              s.direction === "positive" || s.direction === "negative" || s.direction === "neutral"
                ? s.direction
                : "neutral",
          })
        );
      }
      if (Array.isArray(m.stocksToWatch)) {
        marketImpact.stocksToWatch = (m.stocksToWatch as Record<string, unknown>[]).map(
          (s) => ({
            ticker: typeof s.ticker === "string" ? s.ticker : "",
            company: typeof s.company === "string" ? s.company : "",
            reasoning: typeof s.reasoning === "string" ? s.reasoning : "",
            direction:
              s.direction === "positive" || s.direction === "negative" || s.direction === "neutral"
                ? s.direction
                : "neutral",
          })
        );
      }
    }

    const newsInsights: NewsInsight[] = Array.isArray(parsed.newsInsights)
      ? (parsed.newsInsights as Record<string, unknown>[]).map((n) => ({
          headline: typeof n.headline === "string" ? n.headline : "",
          source: typeof n.source === "string" ? n.source : "",
          url: typeof n.url === "string" ? n.url : "",
          insight: typeof n.insight === "string" ? n.insight : "",
        }))
      : [];

    return {
      executiveSummary,
      economicInsights,
      marketImpact,
      newsInsights,
    };
  } catch (err) {
    console.error("[generateInsights] Error:", err);
    throw err;
  }
}
