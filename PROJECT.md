# Brief — Cursor Project Brief
## AI-Powered Daily Economic Intelligence, Delivered as a PDF to Your Inbox

---

## What We're Building

**Brief** is a web app where users subscribe with their email and receive a beautifully designed PDF report every morning. The report contains the day's most important U.S. economic data releases, top financial news headlines, and concise 2–3 line AI-generated insights for each item — all formatted as a branded, professional PDF attached to an email.

The goal: make economic data digestible for everyday investors and professionals.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| PDF Generation | Puppeteer (renders HTML/CSS → PDF) |
| Email Delivery | Resend (resend.com — free tier, easy API) |
| AI Insights | OpenAI API (GPT-4o-mini for cost efficiency) |
| Economic Data | FRED API (Federal Reserve — free, official U.S. data) |
| News | NewsAPI.org (free tier) |
| Scheduling | Vercel Cron Jobs (runs the pipeline every morning at 7AM ET) |
| Database | Supabase (Postgres — free tier, store subscriber emails) |
| Deployment | Vercel |

---

## API Keys Needed (set up before starting)

1. **OpenAI** — platform.openai.com
2. **FRED API** — fred.stlouisfed.org/docs/api/api_key.html (free, instant)
3. **Resend** — resend.com (free tier: 3,000 emails/month)
4. **NewsAPI** — newsapi.org (free tier)
5. **Supabase** — supabase.com (free tier, for email storage)

All keys go in `.env.local`:
```
OPENAI_API_KEY=
FRED_API_KEY=
RESEND_API_KEY=
NEWS_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
CRON_SECRET=
```

---

## Project Structure

```
brief/
├── app/
│   ├── page.tsx                  # Landing page with email signup form
│   ├── api/
│   │   ├── subscribe/route.ts    # POST: save email to Supabase
│   │   └── send-brief/route.ts   # GET: cron-triggered pipeline endpoint
├── lib/
│   ├── fetchEconomicData.ts      # Fetches FRED data releases for today
│   ├── fetchNews.ts              # Fetches top financial news from NewsAPI
│   ├── generateInsights.ts       # Sends data to OpenAI, returns AI insights
│   ├── generatePDF.ts            # Renders HTML report → PDF buffer via Puppeteer
│   ├── sendEmail.ts              # Sends PDF as attachment via Resend
│   └── supabase.ts               # Supabase client setup
├── templates/
│   └── reportTemplate.ts         # HTML/CSS template for the PDF report
├── vercel.json                   # Cron job config
└── .env.local
```

---

## Full Pipeline (What Happens Every Morning at 7AM ET)

The Vercel Cron job hits `GET /api/send-brief` which executes this sequence:

### Step 1 — Fetch Economic Data (FRED API)
- Query FRED for **releases scheduled today** using the `/releases/dates` endpoint
- For each release, fetch the **latest observation value** (e.g., GDP = 2.8%, CPI = 3.1%)
- Target series to always include if released today:
  - GDP (series: `GDP`)
  - CPI — Inflation (`CPIAUCSL`)
  - Unemployment Rate (`UNRATE`)
  - Federal Funds Rate (`FEDFUNDS`)
  - Retail Sales (`RSAFS`)
  - Consumer Confidence (`UMCSENT`)
- If none of these released today, fetch their **most recent values** as context

### Step 2 — Fetch Financial News (NewsAPI)
- Query NewsAPI for top 5 financial/economic headlines from the past 24 hours
- Search query: `"economy" OR "Federal Reserve" OR "inflation" OR "stock market" OR "GDP"`
- Extract: headline, source, and URL

### Step 3 — Generate AI Insights (OpenAI)
- For each FRED data point and each news headline, send to GPT-4o-mini
- System prompt: *"You are a concise financial analyst. For each economic data point or news item provided, write exactly 2-3 sentences explaining what this means for everyday investors and the broader economy. Use plain English, no jargon."*
- Return structured JSON: `{ item: string, value: string, insight: string }[]`

### Step 4 — Generate PDF (Puppeteer)
- Build an HTML string using the report template (see Template section below)
- Launch Puppeteer headless browser, load the HTML, export as PDF buffer
- Paper size: Letter (8.5" x 11"), margins: 1 inch

### Step 5 — Send Email (Resend)
- Fetch all subscriber emails from Supabase
- For each subscriber, send via Resend:
  - Subject: `"Your Brief — [Day, Month Date]"`
  - Body: short plain text — "Good morning. Your daily economic brief is attached."
  - Attachment: the PDF buffer, filename `brief-[date].pdf`

---

## PDF Report Template Design

The HTML template should produce a clean, professional, newspaper-style PDF. Design spec:

**Header:**
- Logo/wordmark: "Brief" in bold serif font (Georgia or similar), large
- Tagline: "Your daily economic intelligence" in small grey italic
- Date: right-aligned, e.g., "Saturday, February 22, 2026"
- Thin horizontal rule below header

**Section 1: Economic Data Releases**
- Section title: "TODAY'S ECONOMIC DATA" in small caps, with rule below
- For each data point:
  - Indicator name (bold): e.g., "GDP Growth Rate"
  - Value (large, colored — green if positive/expected, amber if miss): e.g., "2.8%"
  - AI Insight (regular weight, grey): 2-3 sentences

**Section 2: Market News**
- Section title: "MARKET HEADLINES" in small caps
- For each headline:
  - Headline text (bold)
  - Source (small, grey)
  - AI Insight (regular, grey)

**Footer:**
- "Brief — Unsubscribe" (small, centered, grey)
- "Data sourced from Federal Reserve (FRED) and NewsAPI"

Use a clean color palette: white background, near-black text (#1a1a1a), accent color #2563eb (blue) for values and section headers.

---

## Landing Page (app/page.tsx)

Simple, minimal, high-quality. Single page with:

- Large centered headline: **"Markets move on data. Be ready."**
- Subheadline: "Brief delivers a daily AI-powered PDF digest of the most important economic data and market news — straight to your inbox, every morning."
- Email input + "Subscribe for free" button (calls `/api/subscribe`)
- On success: show "You're subscribed. Your first Brief arrives tomorrow morning."
- Below fold: 3 feature cards:
  - "Real Economic Data" — sourced directly from the Federal Reserve
  - "AI Insights" — plain-English explanations of what the numbers mean
  - "PDF Delivered Daily" — a clean report in your inbox every morning
- Very bottom: small sample/preview of what the PDF looks like (can be a static screenshot)

Styling: dark background (#0f172a), white text, blue accents. Minimal, confident, fintech aesthetic.

---

## Supabase Setup

Create one table:

```sql
CREATE TABLE subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);
```

The `/api/subscribe` route does a simple upsert into this table.

---

## Vercel Cron Configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/send-brief",
      "schedule": "0 11 * * *"
    }
  ]
}
```

`0 11 * * *` = 11:00 UTC = 7:00 AM ET. Protect this endpoint with a `CRON_SECRET` header check so only Vercel can trigger it.

---

## Build Order for Cursor

Build in this exact sequence to avoid dependency issues:

1. **Init project** — `npx create-next-app@latest brief --typescript --tailwind --app`
2. **Install dependencies** — `npm install @supabase/supabase-js resend openai puppeteer newsapi axios`
3. **Supabase setup** — create `lib/supabase.ts`, create the subscribers table
4. **Subscribe API** — build `app/api/subscribe/route.ts` and test with Postman
5. **Landing page** — build `app/page.tsx` with email form wired to subscribe API
6. **FRED fetcher** — build `lib/fetchEconomicData.ts`, test it logs real data
7. **News fetcher** — build `lib/fetchNews.ts`, test it returns headlines
8. **AI insights** — build `lib/generateInsights.ts`, test it returns structured JSON
9. **PDF template** — build `templates/reportTemplate.ts` with full HTML/CSS
10. **PDF generator** — build `lib/generatePDF.ts` using Puppeteer, test it saves a PDF locally
11. **Email sender** — build `lib/sendEmail.ts` with Resend, test with your own email
12. **Pipeline route** — wire everything together in `app/api/send-brief/route.ts`
13. **Cron config** — add `vercel.json`, deploy to Vercel, test cron manually
14. **Polish** — landing page design, PDF styling, error handling
