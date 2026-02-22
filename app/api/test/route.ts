import { NextResponse } from "next/server";
import { fetchEconomicData } from "@/lib/fetchEconomicData";
import { fetchNews } from "@/lib/fetchNews";
import { generateInsights } from "@/lib/generateInsights";

/**
 * Temporary test route: runs fetchEconomicData → fetchNews → generateInsights
 * in sequence, logs results, and returns them as JSON.
 * GET /api/test
 */
export async function GET() {
  try {
    const economicData = await fetchEconomicData();
    console.log("[api/test] fetchEconomicData result:", JSON.stringify(economicData, null, 2));

    const news = await fetchNews();
    console.log("[api/test] fetchNews result:", JSON.stringify(news, null, 2));

    const insightInputs = [
      ...economicData.map((d) => ({ item: d.item, value: d.currentValue })),
      ...news.map((n) => ({ item: n.headline, value: n.source })),
    ];
    const insights = await generateInsights(insightInputs);
    console.log("[api/test] generateInsights result:", JSON.stringify(insights, null, 2));

    return NextResponse.json({
      economicData,
      news,
      insights,
    });
  } catch (err) {
    console.error("[api/test] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
