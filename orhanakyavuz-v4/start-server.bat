@echo off
REM ============================================================================
REM start-server.bat — orhanakyavuz.com'u yerelde önizlemek için (Windows)
REM ============================================================================
REM NEDEN GEREKLI: Bu sitedeki dosya yollari ("/assets/...", "/blog/...") kok
REM dizinden baslayan MUTLAK yollardir. Bu, gercek bir barindirma ortaminda
REM (Netlify/Vercel/GitHub Pages) doğru ve standart yaklasimdir, ama bir HTML
REM dosyasina cift tiklayip dogrudan tarayicida actiginda calismaz.
REM
REM Bu betik, projeyi bilgisayarinda gecici bir web sunucusu olarak baslatir.
REM Kapatmak icin bu pencerede Ctrl+C.
REM ============================================================================

cd /d "%~dp0"

echo orhanakyavuz.com yerel sunucusu baslatiliyor...
echo Tarayicida su adresi ac: http://localhost:8000
echo Durdurmak icin: Ctrl+C
echo.

start "" http://localhost:8000
where python >nul 2>&1
if %errorlevel%==0 (
  python -m http.server 8000
) else (
  echo Python bulunamadi. npx serve kullaniliyor...
  npx --yes serve -l 8000
)

pause
