# Brief — Cursor Project Brief v2
## AI-Powered Daily Economic Intelligence, Delivered as a Multi-Page PDF to Your Inbox

---

## What We're Building

**Brief** is a web app where users subscribe with their email and receive a beautifully designed, multi-page PDF report every morning. The report reads like a professional financial intelligence briefing — with executive summary, deep economic data analysis with historical trends, market impact analysis, top stocks to watch, and curated news — all powered by real Federal Reserve data and AI-generated insights.

The goal: a Bloomberg-lite morning briefing that makes institutional-grade economic intelligence accessible to everyday investors.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS |
| PDF Generation | Puppeteer (renders HTML/CSS → PDF, inline CSS only) |
| Email Delivery | Resend (resend.com) |
| AI Insights | OpenAI API (GPT-4o-mini) |
| Economic Data | FRED API (Federal Reserve) |
| Historical Trends | FRED API (10 observations per series) |
| News | NewsAPI.org |
| Scheduling | Vercel Cron Jobs (7AM ET daily) |
| Database | Supabase (Postgres, subscriber emails) |
| Deployment | Vercel |

---

## API Keys (.env.local)

```
OPENAI_API_KEY=
FRED_API_KEY=
RESEND_API_KEY=
RESEND_FROM=Brief <hello@yourdomain.com>   # verified sender in Resend
NEWS_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
CRON_SECRET=
```

---

## Updated Project Structure

```
brief/
├── app/
│   ├── page.tsx
│   ├── api/
│   │   ├── subscribe/route.ts
│   │   ├── send-brief/route.ts
│   │   └── test-pdf/route.ts         # dev only
├── lib/
│   ├── fetchEconomicData.ts          # Latest + 10-month history per series
│   ├── fetchNews.ts                  # Top 5 financial headlines
│   ├── generateInsights.ts           # Full AI analysis (all sections)
│   ├── generatePDF.ts                # Puppeteer PDF renderer
│   ├── sendEmail.ts                  # Resend email with PDF attachment
│   └── supabase.ts
├── templates/
│   └── reportTemplate.ts            # Multi-page HTML/CSS template
├── vercel.json
└── .env.local
```

---

## Data Pipeline (What Happens Every Morning at 7AM ET)

### Step 1 — Fetch Economic Data + History (FRED API)

For each of these 6 series, fetch:
- **Latest observation** (current value)
- **Previous observation** (1 period ago, for change calculation)
- **Last 10 observations** (for trend table)

Target series:
- GDP (`GDP`) — quarterly
- CPI Inflation (`CPIAUCSL`) — monthly
- Unemployment Rate (`UNRATE`) — monthly
- Federal Funds Rate (`FEDFUNDS`) — monthly
- Retail Sales (`RSAFS`) — monthly
- Consumer Confidence (`UMCSENT`) — monthly

For each series, compute:
- `currentValue` — latest observation
- `previousValue` — one period prior
- `change` — absolute difference
- `changePct` — percentage change
- `trend` — array of `{ date, value }` for last 10 periods
- `direction` — "up" | "down" | "flat"

### Step 2 — Fetch News (NewsAPI.org)

- Top 5 headlines: query `economy OR "Federal Reserve" OR inflation OR "stock market" OR GDP`
- Past 24 hours, English, sorted by publishedAt
- Extract: `headline`, `source`, `url`, `publishedAt`

### Step 3 — Generate Full AI Analysis (OpenAI, single batched call)

Send ALL data in one GPT-4o-mini call. Request structured JSON with these sections:

```typescript
{
  executiveSummary: string,          // 4-5 sentence macro overview of today's economic picture
  economicInsights: {
    item: string,
    currentValue: string,
    insight: string,                 // 2-3 sentences: what this number means
    trendAnalysis: string,           // 1-2 sentences: what the 10-month trend shows
    marketImplication: string        // 1-2 sentences: direct market impact
  }[],
  marketImpact: {
    overallOutlook: string,          // 3-4 sentences: combined effect of all data on markets
    sectorsToWatch: {
      sector: string,                // e.g. "Financial Services", "Real Estate"
      reasoning: string,             // 1-2 sentences why this sector is affected
      direction: "positive" | "negative" | "neutral"
    }[],                             // 4-5 sectors
    stocksToWatch: {
      ticker: string,                // e.g. "JPM", "WMT"
      company: string,               // full name
      reasoning: string,             // 1-2 sentences
      direction: "positive" | "negative" | "neutral"
    }[]                              // 5-6 stocks
  },
  newsInsights: {
    headline: string,
    source: string,
    url: string,
    insight: string                  // 2-3 sentences
  }[]
}
```

System prompt:
*"You are a senior financial analyst writing a morning briefing for sophisticated investors. Be precise, data-driven, and actionable. Reference specific values. No filler, no generic statements. Every insight must be grounded in the actual data provided."*

### Step 4 — Generate Multi-Page PDF (Puppeteer)

See PDF Template Design section below.

### Step 5 — Send Email (Resend)

- Fetch all active subscribers from Supabase
- Subject: `"Your Brief — [Day, Month Date, Year]"`
- Body: "Good morning. Your daily economic intelligence briefing is attached."
- Attachment: PDF buffer, filename `brief-[YYYY-MM-DD].pdf`

---

## PDF Template Design — 5 Pages

**ALL CSS must be inline. No external stylesheets. No web fonts (use Georgia, Arial, serif, sans-serif system fonts only). Puppeteer cannot load external resources.**

Color palette:
- Background: `#ffffff`
- Primary text: `#1a1a1a`
- Secondary text: `#6b7280`
- Accent blue: `#2563eb`
- Success green: `#16a34a`
- Warning amber: `#d97706`
- Danger red: `#dc2626`
- Border: `#e5e7eb`
- Header bg: `#0f172a`

---

### PAGE 1 — Cover & Executive Summary

**Header (dark navy background #0f172a):**
- "BRIEF" wordmark left-aligned, white, bold, Georgia serif, 36px
- Tagline: "Daily Economic Intelligence" right-aligned, white, 12px, letter-spacing
- Full-width, padding 24px

**Date bar:**
- Full-width light grey bar (#f8fafc)
- Left: "MORNING EDITION" in small caps, grey
- Right: Full date e.g. "Sunday, February 22, 2026"
- Border bottom

**Executive Summary section:**
- Section label: "TODAY'S MACRO PICTURE" — small caps, blue, 11px, letter-spacing 2px
- Horizontal rule below label
- AI-generated `executiveSummary` text — 16px, line-height 1.8, comfortable reading width
- Well-padded, generous whitespace

**Key Numbers Bar:**
- 3-column grid showing most important metrics at a glance:
  - CPI (inflation) with value and up/down arrow
  - Unemployment Rate with value and direction
  - Federal Funds Rate with value and direction
- Each cell: label small grey, value large bold colored (green=good, red=bad, amber=neutral)
- Border between cells

**Page footer (all pages):**
- Left: "Brief — Daily Economic Intelligence"
- Right: "Data: Federal Reserve FRED | AI: GPT-4o-mini | [date]"
- Small grey, border top, 10px font

---

### PAGE 2 — Economic Data Deep Dive

**Section header:** "ECONOMIC DATA" — full-width dark bar, white text

**For each of the 6 indicators, a card-style row:**

```
[INDICATOR NAME — bold, 14px]          [CURRENT VALUE — 28px, bold, colored]
[Date of reading — grey, 11px]         [▲ +X.X% from previous — green/red, 12px]

[AI Insight — 13px, #374151, 2-3 sentences]
[Trend Analysis — 13px, grey italic]
[Market Implication — 13px, #2563eb]

[10-MONTH TREND TABLE]
Date     | Value  | Change
---------|--------|-------
Jan 2026 | 326.6  | +0.3%
Dec 2025 | 326.3  | +0.2%
... (10 rows)

[Source: Federal Reserve FRED, Series: CPIAUCSL]
```

Divider line between each indicator. Alternate very light grey background (#fafafa) on every other card for readability.

---

### PAGE 3 — Market Impact Analysis

**Section header:** "MARKET IMPACT" — full-width dark bar, white text

**Overall Market Outlook:**
- Label: "OUTLOOK" small caps blue
- `marketImpact.overallOutlook` — paragraph, 14px, generous line height

**Sectors to Watch:**
- Label: "SECTORS TO WATCH" small caps blue, rule below
- 2-column grid of sector cards:
  - Sector name bold
  - Direction indicator: ▲ Positive / ▼ Negative / → Neutral (colored)
  - Reasoning text grey

**Stocks to Watch:**
- Label: "STOCKS TO WATCH" small caps blue, rule below
- Table layout:
```
TICKER  | COMPANY          | OUTLOOK   | REASONING
--------|------------------|-----------|----------
JPM     | JPMorgan Chase   | ▲ Positive | Higher rates...
WMT     | Walmart          | ▲ Positive | Strong retail...
```
- Ticker bold blue, alternating row backgrounds

**Disclaimer (small, grey, bottom of page):**
- "This is not financial advice. Stock mentions are AI-generated based on economic data patterns and are for informational purposes only. Always conduct your own research."

---

### PAGE 4 — Market News

**Section header:** "MARKET NEWS" — full-width dark bar, white text

**For each of 5 headlines:**
```
[SOURCE — small caps grey]    [DATE — grey right-aligned]
[HEADLINE — bold, 15px, #1a1a1a]
[AI INSIGHT — 13px, #374151, 2-3 sentences]
[Read more: URL — small blue, underline]

[thin divider]
```

Generous spacing between articles. Clean newspaper-editorial feel.

---

### PAGE 5 — Appendix & Citations

**Section header:** "DATA SOURCES & METHODOLOGY" — full-width dark bar, white text

**Data Sources table:**
```
INDICATOR          | SERIES ID  | SOURCE                        | FREQUENCY | RETRIEVED
-------------------|------------|-------------------------------|-----------|----------
GDP                | GDP        | Federal Reserve Bank St. Louis | Quarterly | [date]
CPI — Inflation    | CPIAUCSL   | Federal Reserve Bank St. Louis | Monthly   | [date]
Unemployment Rate  | UNRATE     | Federal Reserve Bank St. Louis | Monthly   | [date]
Federal Funds Rate | FEDFUNDS   | Federal Reserve Bank St. Louis | Monthly   | [date]
Retail Sales       | RSAFS      | Federal Reserve Bank St. Louis | Monthly   | [date]
Consumer Confidence| UMCSENT    | U. of Michigan                | Monthly   | [date]
```

**Methodology note:**
- "Economic data is retrieved directly from the Federal Reserve Economic Data (FRED) API maintained by the Federal Reserve Bank of St. Louis. AI insights are generated using OpenAI's GPT-4o-mini model. News headlines are sourced from NewsAPI.org. This report is generated automatically at 7:00 AM ET each trading day."

**AI Disclosure:**
- "Insights and market analysis in this report are generated by artificial intelligence and should not be construed as financial advice. Past economic trends are not indicative of future market performance."

**Brief branding:**
- Brief logo/wordmark centered
- "brief.zeeshansohani.com" (or your deployed URL)
- "© 2026 Brief. For informational purposes only."

---

## Updated fetchEconomicData.ts

Fetch 10 observations per series (not just 1):

```typescript
// For each series, fetch 10 observations sorted desc
GET /fred/series/observations?series_id=CPIAUCSL&sort_order=desc&limit=10&api_key=...

// Return type:
interface EconomicSeries {
  seriesId: string
  item: string              // human name
  currentValue: string
  previousValue: string
  change: string            // formatted e.g. "+0.3"
  changePct: string         // formatted e.g. "+0.09%"
  direction: 'up' | 'down' | 'flat'
  date: string              // date of latest reading
  trend: { date: string; value: string }[]  // 10 items, oldest first
  unit: string              // e.g. "Billions of Dollars", "Percent", "Index"
  frequency: string         // "Monthly", "Quarterly"
  source: string            // "Federal Reserve FRED"
}
```

---

## Number Formatting

Format all FRED values properly before display:
- GDP `31490.07` → `$31,490.1B`
- CPI `326.588` → `326.6 (Index)`
- Unemployment `4.3` → `4.3%`
- Fed Funds `3.64` → `3.64%`
- Retail Sales `734967.0` → `$734,967M`
- Consumer Confidence `56.4` → `56.4 / 100`

---

## Puppeteer Critical Notes

- **Inline CSS ONLY** — no `<link>` tags, no `@import`, no external fonts
- Use `page.setContent(html, { waitUntil: 'networkidle0' })` not `page.goto()`
- PDF options: `{ format: 'Letter', margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' }, printBackground: true }`
- Page breaks: use `style="page-break-before: always"` on each new page div
- Local dev: `puppeteer` full package
- Vercel production: `puppeteer-core` + `@sparticuz/chromium`

---

## What's Already Built (Do Not Rebuild)

The following are already working — only update/extend them, do not rewrite from scratch:

- ✅ `lib/supabase.ts` — working
- ✅ `app/api/subscribe/route.ts` — working, tested
- ✅ `app/page.tsx` — landing page working
- ✅ `lib/fetchEconomicData.ts` — working but needs history (10 obs)
- ✅ `lib/fetchNews.ts` — working
- ✅ `lib/generateInsights.ts` — working but needs expanded output schema
- ✅ `lib/generatePDF.ts` — working
- ✅ `templates/reportTemplate.ts` — EXISTS but needs full redesign to 5-page spec

**Priority order:**
1. Update `fetchEconomicData.ts` to return 10-month history + change calculations
2. Update `generateInsights.ts` to return the full expanded JSON schema
3. Rebuild `templates/reportTemplate.ts` to the full 5-page design
4. Test PDF at `/api/test-pdf`
5. Build `lib/sendEmail.ts`
6. Build `app/api/send-brief/route.ts` (full pipeline)
7. Add `vercel.json` cron config
8. Deploy to Vercel