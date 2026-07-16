<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new SitePageRepository(admin_pdo());
$exporter = new PrivacyExporter($repo);
$siteRoot = admin_site_root();

$repo->ensureTable();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);
    $body = trim((string) ($_POST['body'] ?? ''));

    try {
        $repo->saveBody('privacy', $body);
        $exporter->write($siteRoot);
        admin_flash('Политика конфиденциальности сохранена и опубликована на сайте.');
    } catch (Throwable $e) {
        admin_flash('Не удалось сохранить: ' . $e->getMessage(), 'error');
    }

    admin_redirect('privacy.php');
}

$body = $repo->getBody('privacy');
if ($body === '') {
    $body = PrivacyExporter::defaultBody();
}

$adminSection = 'privacy';
$pageTitle = 'Политика конфиденциальности';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <h1 class="admin-title" style="margin: 0;">Политика конфиденциальности</h1>
    <a class="admin-btn admin-btn--secondary" href="../pages/privacy.html" target="_blank" rel="noopener">Открыть на сайте</a>
  </div>
  <p class="admin-subtitle">
    HTML-текст отображается на странице <code>pages/privacy.html</code>.
    Можно использовать теги <code>&lt;p&gt;</code>, <code>&lt;h2&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code>, <code>&lt;a&gt;</code>.
    После сохранения обновляется файл <code>privacy-data.js</code>.
  </p>

  <form class="admin-form" method="post">
    <?= Csrf::field() ?>
    <div class="admin-field">
      <label for="body">Текст страницы</label>
      <textarea id="body" name="body" rows="24" spellcheck="false"><?= admin_h($body) ?></textarea>
    </div>
    <div class="admin-actions">
      <button class="admin-btn" type="submit">Сохранить и опубликовать</button>
    </div>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
