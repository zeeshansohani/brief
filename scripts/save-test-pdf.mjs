/**
 * Fetches GET /api/test-pdf and saves the PDF to brief-output.pdf.
 * Run with dev server up: npm run dev (then in another terminal: npm run save-test-pdf)
 */
const port = process.env.PORT || 3001;
const url = `http://localhost:${port}/api/test-pdf`;

const res = await fetch(url);
if (!res.ok) {
  console.error("Failed to generate PDF:", res.status, await res.text());
  process.exit(1);
}
const buffer = Buffer.from(await res.arrayBuffer());
await import("fs").then((fs) =>
  fs.promises.writeFile("brief-output.pdf", buffer)
);
console.log("Saved brief-output.pdf");
