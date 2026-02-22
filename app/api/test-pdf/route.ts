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

    const insights = await generateInsights(economicData, news);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const html = buildReportHtml(dateFormatted, economicData, insights);
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
