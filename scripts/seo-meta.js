"use strict";

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function trimDescription(text, max = 160) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function buildCanonical(siteUrl, pagePath) {
  const base = String(siteUrl ?? "").replace(/\/$/, "");
  const path = String(pagePath ?? "").startsWith("/") ? pagePath : `/${pagePath}`;
  return `${base}${path}`;
}

function renderSeoHead({
  title,
  description,
  keywords,
  canonical,
  robots,
  ogImage,
  siteName = "Ск-классик",
  ogType = "website",
}) {
  const lines = [];

  if (description) {
    lines.push(
      `    <meta name="description" content="${escapeAttr(trimDescription(description))}" />`,
    );
  }

  if (keywords) {
    lines.push(`    <meta name="keywords" content="${escapeAttr(keywords)}" />`);
  }

  if (robots) {
    lines.push(`    <meta name="robots" content="${escapeAttr(robots)}" />`);
  }

  if (canonical) {
    lines.push(`    <link rel="canonical" href="${escapeAttr(canonical)}" />`);
  }

  lines.push(`    <meta property="og:type" content="${escapeAttr(ogType)}" />`);
  lines.push(`    <meta property="og:site_name" content="${escapeAttr(siteName)}" />`);
  lines.push(`    <meta property="og:locale" content="ru_RU" />`);

  if (title) {
    lines.push(`    <meta property="og:title" content="${escapeAttr(title)}" />`);
  }

  if (description) {
    lines.push(
      `    <meta property="og:description" content="${escapeAttr(trimDescription(description))}" />`,
    );
  }

  if (canonical) {
    lines.push(`    <meta property="og:url" content="${escapeAttr(canonical)}" />`);
  }

  if (ogImage) {
    lines.push(`    <meta property="og:image" content="${escapeAttr(ogImage)}" />`);
  }

  lines.push(`    <meta name="twitter:card" content="summary_large_image" />`);

  if (title) {
    lines.push(`    <meta name="twitter:title" content="${escapeAttr(title)}" />`);
  }

  if (description) {
    lines.push(
      `    <meta name="twitter:description" content="${escapeAttr(trimDescription(description))}" />`,
    );
  }

  if (ogImage) {
    lines.push(`    <meta name="twitter:image" content="${escapeAttr(ogImage)}" />`);
  }

  return `${lines.join("\n")}\n`;
}

function renderFaviconLinks(siteUrl, assetPrefix = "") {
  const root = String(siteUrl ?? "").replace(/\/$/, "");
  const ico = `${root}/favicon.ico`;
  const prefix = assetPrefix;

  return [
    `    <link rel="icon" href="${escapeAttr(ico)}" type="image/x-icon" />`,
    `    <link rel="shortcut icon" href="${escapeAttr(ico)}" type="image/x-icon" />`,
    `    <link rel="icon" type="image/png" href="${escapeAttr(`${prefix}favicon/favicon-96x96.png`)}" sizes="96x96" />`,
    `    <link rel="icon" type="image/svg+xml" href="${escapeAttr(`${prefix}favicon/favicon.svg`)}" />`,
    `    <link rel="apple-touch-icon" sizes="180x180" href="${escapeAttr(`${prefix}favicon/apple-touch-icon.png`)}" />`,
    `    <link rel="manifest" href="${escapeAttr(`${prefix}favicon/site.webmanifest`)}" />`,
  ].join("\n");
}

module.exports = {
  escapeAttr,
  trimDescription,
  buildCanonical,
  renderSeoHead,
  renderFaviconLinks,
};
