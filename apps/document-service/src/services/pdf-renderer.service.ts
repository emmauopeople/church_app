import puppeteer, { type PDFOptions } from "puppeteer";

import type { CertificateRenderOptions } from "./certificate-template.service.js";

function getStandardPdfFormat(size: CertificateRenderOptions["size"]): PDFOptions["format"] {
  if (size === "LETTER") {
    return "letter";
  }

  if (size === "A5") {
    return "a5";
  }

  return "a4";
}

export function getPdfOptions(renderOptions: CertificateRenderOptions): PDFOptions {
  const baseOptions: PDFOptions = {
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0"
    }
  };

  if (renderOptions.size === "CUSTOM" && renderOptions.width && renderOptions.height) {
    return {
      ...baseOptions,
      width: renderOptions.width,
      height: renderOptions.height
    };
  }

  if (renderOptions.size === "HALF_LETTER") {
    return {
      ...baseOptions,
      width: renderOptions.orientation === "landscape" ? "8.5in" : "5.5in",
      height: renderOptions.orientation === "landscape" ? "5.5in" : "8.5in"
    };
  }

  return {
    ...baseOptions,
    format: getStandardPdfFormat(renderOptions.size),
    landscape: renderOptions.orientation === "landscape"
  };
}

export async function renderPdfFromHtml(html: string, renderOptions: CertificateRenderOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf(getPdfOptions(renderOptions));

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
