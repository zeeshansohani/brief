/**
 * Send the daily Brief PDF to subscribers via Resend.
 * One failure per subscriber does not stop the rest; returns sent and failed lists.
 */

import { Resend } from "resend";

const BODY_TEXT =
  "Good morning. Your daily economic intelligence briefing is attached.";

export type SendResult = {
  sent: string[];
  failed: { email: string; error: string }[];
};

/**
 * Sends the PDF to each subscriber. Uses RESEND_API_KEY and RESEND_FROM from env.
 * RESEND_FROM must be a verified sender (e.g. "Brief <hello@yourdomain.com>").
 */
export async function sendBriefToSubscribers(
  pdfBuffer: Buffer,
  subscriberEmails: string[],
  date: Date = new Date()
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in environment.");
  }
  if (!from?.trim()) {
    throw new Error(
      "RESEND_FROM is not set. Use a verified sender e.g. Brief <hello@yourdomain.com>"
    );
  }

  const subject = `Your Brief — ${date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  const filename = `brief-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.pdf`;

  const resend = new Resend(apiKey);
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const email of subscriberEmails) {
    const to = email.trim();
    if (!to) continue;

    try {
      const { data, error } = await resend.emails.send({
        from: from.trim(),
        to,
        subject,
        text: BODY_TEXT,
        attachments: [
          {
            filename,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        failed.push({ email: to, error: error.message ?? String(error) });
        continue;
      }
      sent.push(to);
    } catch (err) {
      failed.push({
        email: to,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { sent, failed };
}
