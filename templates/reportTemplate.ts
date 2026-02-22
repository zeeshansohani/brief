/**
 * 5-page PDF report template. Inline CSS only. System fonts: Georgia, Arial.
 * Professional financial briefing layout; page breaks between pages; Letter size.
 */

import type { EconomicSeries } from "@/lib/fetchEconomicData";
import type { FullInsights } from "@/lib/generateInsights";

const COLORS = {
  bg: "#ffffff",
  text: "#1a1a1a",
  secondary: "#6b7280",
  accent: "#2563eb",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  border: "#e5e7eb",
  headerBg: "#0f172a",
  dateBarBg: "#f8fafc",
  cardAlt: "#fafafa",
  bodyMuted: "#374151",
} as const;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function directionColor(direction: string): string {
  if (direction === "up" || direction === "positive") return COLORS.green;
  if (direction === "down" || direction === "negative") return COLORS.red;
  return COLORS.amber;
}

/** For CPI/Unemployment/Fed Funds in Key Numbers: up/down meaning good/bad by indicator. */
function keyMetricColor(seriesId: string, direction: string): string {
  if (direction === "flat") return COLORS.amber;
  if (seriesId === "CPIAUCSL") return direction === "up" ? COLORS.red : COLORS.green;
  if (seriesId === "UNRATE") return direction === "up" ? COLORS.red : COLORS.green;
  return direction === "up" ? COLORS.amber : COLORS.green;
}

function directionArrow(direction: string): string {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "→";
}

/** Format FRED date (YYYY-MM-DD) to "Jan 2026" style. */
function formatTrendDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${month} ${year}`;
}

/** Compute period-over-period % change for trend table rows. */
function trendWithChanges(trend: { date: string; value: string }[]): { date: string; value: string; changePct: string }[] {
  return trend.map((row, i) => {
    const curr = parseFloat(row.value);
    const prev = i > 0 ? parseFloat(trend[i - 1].value) : null;
    let changePct = "—";
    if (prev != null && !Number.isNaN(curr) && !Number.isNaN(prev) && prev !== 0) {
      const pct = ((curr - prev) / prev) * 100;
      changePct = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
    }
    return { date: row.date, value: row.value, changePct };
  });
}

function pageFooter(dateFormatted: string): string {
  return `
  <div style="position: relative; margin-top: 24px; padding-top: 10px; border-top: 1px solid ${COLORS.border}; font-size: 10px; color: ${COLORS.secondary}; font-family: Arial, sans-serif;">
    <span>Brief — Daily Economic Intelligence</span>
    <span style="position: absolute; right: 0;">Data: Federal Reserve FRED | AI: GPT-4o-mini | ${escapeHtml(dateFormatted)}</span>
  </div>`;
}

export type BuildReportOptions = {
  baseUrl?: string;
};

/**
 * Build full 5-page report HTML. Uses EconomicSeries + FullInsights.
 * economicSeries and insights.economicInsights must be in the same order (one-to-one).
 */
export function buildReportHtml(
  dateFormatted: string,
  economicSeries: EconomicSeries[],
  insights: FullInsights,
  options?: BuildReportOptions
): string {
  const baseUrl = options?.baseUrl ?? "brief.zeeshansohani.com";

  const keyMetrics = economicSeries.filter((s) =>
    ["CPIAUCSL", "UNRATE", "FEDFUNDS"].includes(s.seriesId)
  );

  const keyNumbersBar = keyMetrics.length
    ? `
    <div style="display: table; width: 100%; border: 1px solid ${COLORS.border}; margin-top: 20px;">
      ${keyMetrics
        .map(
          (s) => `
        <div style="display: table-cell; width: 33.33%; padding: 16px; border-right: 1px solid ${COLORS.border}; vertical-align: top;">
          <div style="font-size: 11px; color: ${COLORS.secondary}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${escapeHtml(s.item)}</div>
          <div style="font-size: 22px; font-weight: 700; color: ${keyMetricColor(s.seriesId, s.direction)};">${escapeHtml(s.currentValue)} ${s.unit === "Percent" ? "%" : ""} <span style="font-size: 14px; font-weight: 600;">${directionArrow(s.direction)}</span></div>
        </div>`
        )
        .join("")}
    </div>`
    : "";

  const page1 = `
  <div class="page" style="font-family: Georgia, serif; padding: 0 48px 32px; box-sizing: border-box;">
    <header style="background: ${COLORS.headerBg}; color: ${COLORS.bg}; padding: 24px 48px; margin: -48px -48px 0 -48px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 36px; font-weight: 700;">BRIEF</span>
        <span style="font-size: 12px; letter-spacing: 2px;">Daily Economic Intelligence</span>
      </div>
    </header>
    <div style="background: ${COLORS.dateBarBg}; padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; margin: 0 -48px;">
      <div style="display: flex; justify-content: space-between; padding: 0 48px; font-size: 11px; color: ${COLORS.secondary}; text-transform: uppercase; letter-spacing: 1px;">
        <span>Morning Edition</span>
        <span>${escapeHtml(dateFormatted)}</span>
      </div>
    </div>
    <div style="margin-top: 28px;">
      <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.accent}; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid ${COLORS.border}; font-family: Arial, sans-serif;">Today's Macro Picture</h2>
      <p style="font-size: 16px; line-height: 1.8; color: ${COLORS.text}; margin: 0; max-width: 700px;">${escapeHtml(insights.executiveSummary || "No executive summary available.")}</p>
      ${keyNumbersBar}
    </div>
    ${pageFooter(dateFormatted)}
  </div>`;

  const economicCards = economicSeries
    .map((series, idx) => {
      const ei = insights.economicInsights[idx] ?? {
        item: series.item,
        currentValue: series.currentValue,
        insight: "",
        trendAnalysis: "",
        marketImplication: "",
      };
      const trendRows = trendWithChanges(series.trend);
      const bg = idx % 2 === 1 ? COLORS.cardAlt : COLORS.bg;
      const valueColor = series.direction === "up" ? COLORS.green : series.direction === "down" ? COLORS.red : COLORS.amber;
      return `
    <div style="padding: 20px; background: ${bg}; border-bottom: 1px solid ${COLORS.border};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
        <div>
          <div style="font-weight: 700; font-size: 14px; color: ${COLORS.text};">${escapeHtml(series.item)}</div>
          <div style="font-size: 11px; color: ${COLORS.secondary}; margin-top: 2px;">As of ${escapeHtml(series.date)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 28px; font-weight: 700; color: ${valueColor};">${escapeHtml(series.currentValue)}${series.unit === "Percent" ? "%" : ""}</div>
          <div style="font-size: 12px; color: ${valueColor};">${directionArrow(series.direction)} ${escapeHtml(series.changePct)} from previous</div>
        </div>
      </div>
      <p style="font-size: 13px; color: ${COLORS.bodyMuted}; line-height: 1.6; margin: 12px 0 0 0;">${escapeHtml(ei.insight)}</p>
      <p style="font-size: 13px; color: ${COLORS.secondary}; font-style: italic; line-height: 1.5; margin: 8px 0 0 0;">${escapeHtml(ei.trendAnalysis)}</p>
      <p style="font-size: 13px; color: ${COLORS.accent}; line-height: 1.5; margin: 8px 0 0 0;">${escapeHtml(ei.marketImplication)}</p>
      <div style="margin-top: 16px;">
        <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.secondary}; margin-bottom: 8px;">10-Period Trend</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif;">
          <thead>
            <tr style="border-bottom: 2px solid ${COLORS.border};">
              <th style="text-align: left; padding: 6px 8px; color: ${COLORS.secondary}; font-weight: 600;">Date</th>
              <th style="text-align: right; padding: 6px 8px; color: ${COLORS.secondary}; font-weight: 600;">Value</th>
              <th style="text-align: right; padding: 6px 8px; color: ${COLORS.secondary}; font-weight: 600;">Change</th>
            </tr>
          </thead>
          <tbody>
            ${trendRows
              .map(
                (r) => `
            <tr style="border-bottom: 1px solid ${COLORS.border};">
              <td style="padding: 6px 8px;">${escapeHtml(formatTrendDate(r.date))}</td>
              <td style="text-align: right; padding: 6px 8px;">${escapeHtml(r.value)}</td>
              <td style="text-align: right; padding: 6px 8px;">${escapeHtml(r.changePct)}</td>
            </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div style="font-size: 10px; color: ${COLORS.secondary}; margin-top: 8px;">Source: ${escapeHtml(series.source)}, Series: ${escapeHtml(series.seriesId)}</div>
    </div>`;
    })
    .join("");

  const page2 = `
  <div class="page" style="page-break-before: always; font-family: Georgia, serif; padding: 0 48px 32px; box-sizing: border-box;">
    <div style="background: ${COLORS.headerBg}; color: ${COLORS.bg}; padding: 14px 48px; margin: 0 -48px 20px -48px; font-size: 14px; font-weight: 600;">ECONOMIC DATA</div>
    ${economicCards}
    ${pageFooter(dateFormatted)}
  </div>`;

  const sectors = insights.marketImpact.sectorsToWatch || [];
  const stocks = insights.marketImpact.stocksToWatch || [];
  const dirLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);
  const sectorCards = sectors
    .map(
      (s) => `
    <div style="padding: 14px; border: 1px solid ${COLORS.border}; border-radius: 4px; background: ${COLORS.bg};">
      <div style="font-weight: 700; font-size: 13px; color: ${COLORS.text};">${escapeHtml(s.sector)}</div>
      <div style="font-size: 12px; color: ${directionColor(s.direction)}; margin: 4px 0;">${s.direction === "positive" ? "▲" : s.direction === "negative" ? "▼" : "→"} ${dirLabel(s.direction)}</div>
      <div style="font-size: 12px; color: ${COLORS.secondary}; line-height: 1.5; margin-top: 4px;">${escapeHtml(s.reasoning)}</div>
    </div>`
    )
    .join("");

  const stocksRows = stocks
    .map(
      (s, i) => `
    <tr style="background: ${i % 2 === 1 ? COLORS.cardAlt : COLORS.bg};">
      <td style="padding: 10px 12px; font-weight: 700; font-size: 13px; color: ${COLORS.accent};">${escapeHtml(s.ticker)}</td>
      <td style="padding: 10px 12px; font-size: 13px;">${escapeHtml(s.company)}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: ${directionColor(s.direction)};">${s.direction === "positive" ? "▲" : s.direction === "negative" ? "▼" : "→"} ${dirLabel(s.direction)}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: ${COLORS.secondary}; line-height: 1.4;">${escapeHtml(s.reasoning)}</td>
    </tr>`
    )
    .join("");

  const newsItems = (insights.newsInsights || [])
    .map(
      (n) => `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 11px; color: ${COLORS.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(n.source)}</div>
      <h3 style="font-size: 15px; font-weight: 700; color: ${COLORS.text}; margin: 4px 0 8px 0; line-height: 1.4;">${escapeHtml(n.headline)}</h3>
      <p style="font-size: 13px; color: ${COLORS.bodyMuted}; line-height: 1.6; margin: 0 0 8px 0;">${escapeHtml(n.insight)}</p>
      <a href="${escapeHtml(n.url)}" style="font-size: 12px; color: ${COLORS.accent}; text-decoration: underline;">Read more</a>
    </div>
    <div style="border-bottom: 1px solid ${COLORS.border};"></div>`
    )
    .join("");

  const page4 = `
  <div class="page" style="page-break-before: always; font-family: Georgia, serif; padding: 0 48px 32px; box-sizing: border-box;">
    <div style="background: ${COLORS.headerBg}; color: ${COLORS.bg}; padding: 14px 48px; margin: 0 -48px 20px -48px; font-size: 14px; font-weight: 600;">MARKET NEWS</div>
    ${newsItems || "<p style='color: #6b7280;'>No news items.</p>"}
    ${pageFooter(dateFormatted)}
  </div>`;

  const dataSourcesRows = economicSeries
    .map(
      (s) => `
    <tr style="border-bottom: 1px solid ${COLORS.border};">
      <td style="padding: 8px 12px;">${escapeHtml(s.item)}</td>
      <td style="padding: 8px 12px;">${escapeHtml(s.seriesId)}</td>
      <td style="padding: 8px 12px;">${escapeHtml(s.seriesId === "UMCSENT" ? "U. of Michigan" : "Federal Reserve Bank St. Louis")}</td>
      <td style="padding: 8px 12px;">${escapeHtml(s.frequency)}</td>
      <td style="padding: 8px 12px;">${escapeHtml(s.date)}</td>
    </tr>`
    )
    .join("");

  const page5 = `
  <div class="page" style="page-break-before: always; font-family: Georgia, serif; padding: 0 48px 32px; box-sizing: border-box;">
    <div style="background: ${COLORS.headerBg}; color: ${COLORS.bg}; padding: 14px 48px; margin: 0 -48px 20px -48px; font-size: 14px; font-weight: 600;">DATA SOURCES & METHODOLOGY</div>
    <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.accent}; margin: 24px 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid ${COLORS.border}; font-family: Arial, sans-serif;">Data Sources</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: Arial, sans-serif;">
      <thead>
        <tr style="border-bottom: 2px solid ${COLORS.border};">
          <th style="text-align: left; padding: 8px 12px; color: ${COLORS.secondary}; font-weight: 600;">Indicator</th>
          <th style="text-align: left; padding: 8px 12px; color: ${COLORS.secondary}; font-weight: 600;">Series ID</th>
          <th style="text-align: left; padding: 8px 12px; color: ${COLORS.secondary}; font-weight: 600;">Source</th>
          <th style="text-align: left; padding: 8px 12px; color: ${COLORS.secondary}; font-weight: 600;">Frequency</th>
          <th style="text-align: left; padding: 8px 12px; color: ${COLORS.secondary}; font-weight: 600;">Retrieved</th>
        </tr>
      </thead>
      <tbody>${dataSourcesRows}</tbody>
    </table>
    <p style="font-size: 12px; line-height: 1.6; color: ${COLORS.secondary}; margin: 20px 0 0 0;">Economic data is retrieved directly from the Federal Reserve Economic Data (FRED) API maintained by the Federal Reserve Bank of St. Louis. AI insights are generated using OpenAI's GPT-4o-mini model. News headlines are sourced from NewsAPI.org. This report is generated automatically at 7:00 AM ET each trading day.</p>
    <p style="font-size: 12px; line-height: 1.6; color: ${COLORS.secondary}; margin: 12px 0 0 0;">Insights and market analysis in this report are generated by artificial intelligence and should not be construed as financial advice. Past economic trends are not indicative of future market performance.</p>
    <div style="text-align: center; margin-top: 32px;">
      <div style="font-size: 24px; font-weight: 700; color: ${COLORS.text};">Brief</div>
      <div style="font-size: 12px; color: ${COLORS.accent}; margin-top: 4px;">${escapeHtml(baseUrl)}</div>
      <div style="font-size: 10px; color: ${COLORS.secondary}; margin-top: 8px;">© 2026 Brief. For informational purposes only.</div>
    </div>
    ${pageFooter(dateFormatted)}
  </div>`;

  const page3Fixed = `
  <div class="page" style="page-break-before: always; font-family: Georgia, serif; padding: 0 48px 32px; box-sizing: border-box;">
    <div style="background: ${COLORS.headerBg}; color: ${COLORS.bg}; padding: 14px 48px; margin: 0 -48px 20px -48px; font-size: 14px; font-weight: 600;">MARKET IMPACT</div>
    <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.accent}; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid ${COLORS.border}; font-family: Arial, sans-serif;">Outlook</h2>
    <p style="font-size: 14px; line-height: 1.7; color: ${COLORS.text}; margin: 0 0 20px 0;">${escapeHtml(insights.marketImpact.overallOutlook || "—")}</p>
    <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.accent}; margin: 24px 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid ${COLORS.border}; font-family: Arial, sans-serif;">Sectors to Watch</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">${sectorCards}</div>
    <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.accent}; margin: 24px 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid ${COLORS.border}; font-family: Arial, sans-serif;">Stocks to Watch</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif;">
      <thead>
        <tr style="border-bottom: 2px solid ${COLORS.border};">
          <th style="text-align: left; padding: 10px 12px; color: ${COLORS.secondary}; font-weight: 600;">Ticker</th>
          <th style="text-align: left; padding: 10px 12px; color: ${COLORS.secondary}; font-weight: 600;">Company</th>
          <th style="text-align: left; padding: 10px 12px; color: ${COLORS.secondary}; font-weight: 600;">Outlook</th>
          <th style="text-align: left; padding: 10px 12px; color: ${COLORS.secondary}; font-weight: 600;">Reasoning</th>
        </tr>
      </thead>
      <tbody>${stocksRows}</tbody>
    </table>
    <p style="font-size: 10px; color: ${COLORS.secondary}; margin-top: 20px; line-height: 1.5;">This is not financial advice. Stock mentions are AI-generated based on economic data patterns and are for informational purposes only. Always conduct your own research.</p>
    ${pageFooter(dateFormatted)}
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Brief — ${escapeHtml(dateFormatted)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; background: ${COLORS.bg};">
  ${page1}
  ${page2}
  ${page3Fixed}
  ${page4}
  ${page5}
</body>
</html>`;
}
