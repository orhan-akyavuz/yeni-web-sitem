#!/usr/bin/env bash
# ============================================================================
# start-server.sh — orhanakyavuz.com'u yerelde önizlemek için
# ============================================================================
# NEDEN GEREKLİ: Bu sitedeki tüm dosya yolları ("/assets/...", "/blog/...")
# kök dizinden başlayan MUTLAK yollardır. Bu, Netlify/Vercel/GitHub Pages gibi
# gerçek bir barındırma ortamında DOĞRU ve standart yaklaşımdır — ama bir
# dosyaya çift tıklayıp doğrudan tarayıcıda ("file://" ile) açarsan, tarayıcı
# bu yolları bilgisayarının kök dizininde arar ve hiçbir CSS/JS/görsel
# yüklenmez.
#
# Bu betik, projeyi bilgisayarında GEÇİCİ bir web sunucusu olarak başlatır —
# tıpkı gerçek yayında olduğu gibi çalışır. Kapatmak için terminalde Ctrl+C.
# ============================================================================

PORT=8000
URL="http://localhost:$PORT"

cd "$(dirname "$0")" || exit 1

echo "orhanakyavuz.com yerel sunucusu başlatılıyor..."
echo "Tarayıcıda şu adresi aç: $URL"
echo "Durdurmak için: Ctrl+C"
echo ""

# Tarayıcıyı birkaç saniye sonra otomatik aç (varsa)
( sleep 1.5 && (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true) ) &

# Python 3 önce denenir (çoğu Mac/Linux'ta hazır gelir), yoksa Python 2, yoksa Node
if command -v python3 &>/dev/null; then
  python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
  python -m SimpleHTTPServer "$PORT"
elif command -v npx &>/dev/null; then
  npx --yes serve -l "$PORT"
else
  echo "Python veya Node.js bulunamadı. Lütfen birini kurup tekrar deneyin."
  exit 1
fi
