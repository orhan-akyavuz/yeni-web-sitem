Icon generation and installation
================================

Place a high-resolution master logo in this path before running the generator:

  orhanakyavuz-v4/assets/images/logo-source.png

Preferred input: square PNG (2048×2048) or SVG (vector).

Generate all favicons and platform icons by running from project root:

```bash
node scripts/generate-favicons.js
# or explicitly:
node scripts/generate-favicons.js "orhanakyavuz-v4/assets/images/logo-source.png"
```

The script uses `npx favicons` and writes files into:

  orhanakyavuz-v4/assets/icons/

After generation, add the following tags into your `<head>` (paste into `orhanakyavuz-v4/index.html`):

```html
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
<link rel="mask-icon" href="/assets/icons/safari-pinned-tab.svg" color="#0f6b47">
<meta name="msapplication-TileColor" content="#0f6b47">
<meta name="theme-color" content="#0f6b47">
```

Notes:
- If you prefer an `.ico` file (legacy), the `favicons` output includes `favicon.ico`.
- For best crispness on all devices, provide an SVG master and also a square PNG fallback.
- Optionally add preconnect/prefetch for `assets/icons/` if you host icons on a CDN.
