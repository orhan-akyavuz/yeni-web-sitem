export default async function run(page, ui) {
  await page.evaluate(async () => { for (let i = 0; i < document.body.scrollHeight; i += 500) { window.scrollTo(0, i); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'dist-fullpage.png', fullPage: true });
  return 'ok';
}
<!-- index.html için taslak -->
<section class="youtube-content" aria-labelledby="youtube-heading">
  <div class="section-header">
    <h2 id="youtube-heading" class="section-header__title">Matematik Dünyam YouTube</h2>
    <a class="button button--youtube" href="https://www.youtube.com/@Matematikdunyamm" target="_blank">
      <img src="/assets/icons/youtube.svg" alt="" width="20" height="20">
      Kanala Git
    </a>
  </div>
  
  <div class="youtube-grid">
    <!-- Buraya manuel olarak veya dinamik olarak videolar gelecek -->
    <div class="video-card">
      <div class="video-placeholder">
        <!-- Video kapak fotoğrafı veya Embed video -->
        <iframe width="100%" height="315" src="https://www.youtube.com/embed/VIDE_ID" frameborder="0" allowfullscreen></iframe>
      </div>
      <h3 class="video-card__title">Video Başlığı Buraya</h3>
    </div>
  </div>
</section>