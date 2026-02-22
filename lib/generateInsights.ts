/**
 * Sends economic data points and news items to OpenAI (GPT-4o-mini) and returns
 * structured insights: { item, value, insight }[].
 * System prompt: concise financial analyst, 2–3 sentences, plain English.
 */

import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a concise financial analyst. For each economic data point or news item provided, write exactly 2-3 sentences explaining what this means for everyday investors and the broader economy. Use plain English, no jargon.`;

export type InsightInput = {
  item: string;
  value: string;
};

export type InsightItem = {
  item: string;
  value: string;
  insight: string;
};

export async function generateInsights(
  inputs: InsightInput[]
): Promise<InsightItem[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment.");
  }

  if (inputs.length === 0) {
    return [];
  }

  try {
    const openai = new OpenAI({ apiKey });

    const userContent = inputs
      .map((i) => `Item: ${i.item}\nValue: ${i.value}`)
      .join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `For each of the following, provide a short insight (2-3 sentences) in plain English for everyday investors.\n\n${userContent}\n\nRespond with a single JSON object with one key "insights" whose value is an array of objects. Each object must have keys "item", "value", "insight". No other text.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("OpenAI returned empty content.");
    }

    const parsed = JSON.parse(raw) as { insights?: unknown[] };
    const list = Array.isArray(parsed?.insights) ? parsed.insights : [];

    const results: InsightItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      if (entry && typeof entry === "object" && "insight" in entry) {
        const obj = entry as Record<string, unknown>;
        results.push({
          item: typeof obj.item === "string" ? obj.item : inputs[i]?.item ?? "Unknown",
          value: typeof obj.value === "string" ? obj.value : inputs[i]?.value ?? "",
          insight: typeof obj.insight === "string" ? obj.insight : "",
        });
      }
    }

    return results;
  } catch (err) {
    console.error("[generateInsights] Error:", err);
    throw err;
  }
}

// Test: call from a route with sample inputs; result can be console.log'd
