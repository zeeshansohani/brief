import { NextResponse } from "next/server";
import { fetchEconomicData } from "@/lib/fetchEconomicData";
import { fetchNews } from "@/lib/fetchNews";
import { generateInsights } from "@/lib/generateInsights";
import { buildReportHtml } from "@/templates/reportTemplate";
import { generatePDF } from "@/lib/generatePDF";

/**
 * Test route: run full pipeline and return PDF for download.
 * GET /api/test-pdf — save the response as brief-test.pdf to verify locally.
 */
export async function GET() {
  try {
    const [economicData, news] = await Promise.all([
      fetchEconomicData(),
      fetchNews(),
    ]);

    const insightInputs = [
      ...economicData.map((d) => ({ item: d.item, value: d.currentValue })),
      ...news.map((n) => ({ item: n.headline, value: n.source })),
    ];
    const insights = await generateInsights(insightInputs);

    const economicRows = economicData.map((d, i) => ({
      item: d.item,
      value: d.currentValue,
      insight: insights[i]?.insight ?? "",
    }));
    const newsRows = news.map((n, i) => ({
      headline: n.headline,
      source: n.source,
      insight: insights[economicData.length + i]?.insight ?? "",
    }));

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const html = buildReportHtml(dateFormatted, economicRows, newsRows);
    const pdfBuffer = await generatePDF(html);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="brief-test.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[api/test-pdf] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
