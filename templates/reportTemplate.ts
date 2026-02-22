/**
 * HTML/CSS template for the Brief PDF report. Inline CSS only.
 * Design: white background, #1a1a1a text, #2563eb accent; newspaper-style.
 */

export type EconomicRow = {
  item: string;
  value: string;
  insight: string;
};

export type NewsRow = {
  headline: string;
  source: string;
  insight: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Green for positive/expected, amber for negative/miss, else blue. */
function valueColor(value: string): string {
  const n = parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(n)) return "#2563eb";
  if (n < 0) return "#d97706"; // amber
  return "#15803d"; // green
}

export function buildReportHtml(
  dateFormatted: string,
  economicData: EconomicRow[],
  news: NewsRow[]
): string {
  const accent = "#2563eb";
  const text = "#1a1a1a";
  const grey = "#6b7280";

  const economicSection =
    economicData.length === 0
      ? ""
      : `
    <section style="margin-bottom: 24px;">
      <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${accent}; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;">Today's Economic Data</h2>
      ${economicData
        .map(
          (row) => `
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 700; color: ${text}; font-size: 14px;">${escapeHtml(row.item)}</div>
          <div style="font-size: 20px; font-weight: 600; color: ${valueColor(row.value)}; margin: 4px 0;">${escapeHtml(row.value)}</div>
          <div style="font-size: 12px; color: ${grey}; line-height: 1.5; font-weight: 400;">${escapeHtml(row.insight)}</div>
        </div>`
        )
        .join("")}
    </section>`;

  const newsSection =
    news.length === 0
      ? ""
      : `
    <section style="margin-bottom: 24px;">
      <h2 style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${accent}; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;">Market Headlines</h2>
      ${news
        .map(
          (row) => `
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 700; color: ${text}; font-size: 14px;">${escapeHtml(row.headline)}</div>
          <div style="font-size: 11px; color: ${grey}; margin: 2px 0;">${escapeHtml(row.source)}</div>
          <div style="font-size: 12px; color: ${grey}; line-height: 1.5; font-weight: 400;">${escapeHtml(row.insight)}</div>
        </div>`
        )
        .join("")}
    </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Brief — ${escapeHtml(dateFormatted)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: ${text}; background: #ffffff;">
  <header style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
      <div>
        <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: ${text};">Brief</h1>
        <p style="font-size: 12px; color: ${grey}; font-style: italic; margin: 4px 0 0 0;">Your daily economic intelligence</p>
      </div>
      <div style="font-size: 12px; color: ${grey}; text-align: right;">${escapeHtml(dateFormatted)}</div>
    </div>
  </header>

  ${economicSection}
  ${newsSection}

  <footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: ${grey};">
    <p style="margin: 0 0 4px 0;">Brief — Unsubscribe</p>
    <p style="margin: 0;">Data sourced from Federal Reserve (FRED) and NewsAPI</p>
  </footer>
</body>
</html>`;
}
