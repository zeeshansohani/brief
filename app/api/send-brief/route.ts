import { NextRequest, NextResponse } from "next/server";
import { fetchEconomicData } from "@/lib/fetchEconomicData";
import { fetchNews } from "@/lib/fetchNews";
import { generateInsights } from "@/lib/generateInsights";
import { buildReportHtml } from "@/templates/reportTemplate";
import { generatePDF } from "@/lib/generatePDF";
import { supabase } from "@/lib/supabase";
import { sendBriefToSubscribers } from "@/lib/sendEmail";

/**
 * Cron-triggered pipeline: fetch data → insights → PDF → email all active subscribers.
 * Protected by CRON_SECRET: Authorization must be "Bearer <CRON_SECRET>".
 * GET /api/send-brief
 */
export async function GET(request: NextRequest) {
  const startMs = Date.now();

  const auth = request.headers.get("Authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email")
      .eq("active", true);

    if (subError) {
      console.error("[send-brief] Supabase subscribers error:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers", details: subError.message },
        { status: 500 }
      );
    }

    const emails = (subscribers ?? [])
      .map((r) => (r as { email: string }).email)
      .filter(Boolean);

    const { sent, failed } = await sendBriefToSubscribers(
      pdfBuffer,
      emails,
      now
    );

    const durationMs = Date.now() - startMs;

    return NextResponse.json({
      success: true,
      subscriberCount: emails.length,
      sent: sent.length,
      failed: failed.length,
      failedDetails: failed,
      durationMs,
    });
  } catch (err) {
    console.error("[send-brief] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Pipeline failed",
        durationMs: Date.now() - startMs,
      },
      { status: 500 }
    );
  }
}
