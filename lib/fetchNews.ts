/**
 * Fetches top financial/economic headlines from NewsAPI (past 24 hours).
 * Query: economy OR Federal Reserve OR inflation OR stock market OR GDP.
 * Returns headline, source, and URL for up to 5 articles.
 */

const NEWS_API_BASE = "https://newsapi.org/v2";

export type NewsItem = {
  headline: string;
  source: string;
  url: string;
};

export async function fetchNews(): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is not set in environment.");
  }

  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fromStr = from.toISOString().slice(0, 19);

    const params = new URLSearchParams({
      q: 'economy OR "Federal Reserve" OR inflation OR "stock market" OR GDP',
      from: fromStr,
      sortBy: "publishedAt",
      pageSize: "5",
      language: "en",
      apiKey,
    });

    const url = `${NEWS_API_BASE}/everything?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NewsAPI error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      status?: string;
      articles?: Array<{
        title?: string;
        source?: { name?: string };
        url?: string;
      }>;
    };

    if (data?.status !== "ok" || !Array.isArray(data.articles)) {
      return [];
    }

    const items: NewsItem[] = [];
    for (const a of data.articles) {
      const headline = a?.title?.trim();
      const url = a?.url?.trim();
      if (headline && url) {
        items.push({
          headline,
          source: a?.source?.name ?? "Unknown",
          url,
        });
      }
    }

    return items;
  } catch (err) {
    console.error("[fetchNews] Error:", err);
    throw err;
  }
}

// Test: call from a route or run with npx tsx and dynamic import; result can be console.log'd
