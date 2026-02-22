/**
 * Renders HTML report to PDF via Puppeteer.
 * Local: uses full puppeteer. Vercel: uses puppeteer-core + @sparticuz/chromium.
 * Paper: Letter (8.5" x 11"), margins 1 inch.
 */

export async function generatePDF(html: string): Promise<Buffer> {
  const isVercel = process.env.VERCEL === "1";
  let browser: Awaited<ReturnType<import("puppeteer").default["launch"]>> | null = null;

  try {
    if (isVercel) {
      const chromium = await import("@sparticuz/chromium");
      const puppeteer = await import("puppeteer-core");
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: "shell",
      });
    } else {
      const puppeteer = await import("puppeteer");
      browser = await puppeteer.default.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      margin: { top: "1in", right: "1in", bottom: "1in", left: "1in" },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
