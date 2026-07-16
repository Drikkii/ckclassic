<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new SitePageRepository(admin_pdo());
$exporter = new ProductsInfoExporter($repo);
$siteRoot = admin_site_root();

$repo->ensureTable();

$pageLabels = [
    'materials' => 'Используемые материалы и технологии',
    'usage' => 'Правила эксплуатации',
    'warranty' => 'Гарантии',
];

$pagePaths = [
    'materials' => '../pages/products/materials.html',
    'usage' => '../pages/products/usage.html',
    'warranty' => '../pages/products/warranty.html',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);

    try {
        foreach (ProductsInfoExporter::PAGES as $slug => $pageKey) {
            $body = trim((string) ($_POST['body_' . $slug] ?? ''));
            $repo->saveBody($pageKey, $body);
        }
        $exporter->write($siteRoot);
        admin_flash('Страницы о продукции сохранены и опубликованы на сайте.');
    } catch (Throwable $e) {
        admin_flash('Не удалось сохранить: ' . $e->getMessage(), 'error');
    }

    admin_redirect('products-info.php');
}

$bodies = $exporter->collect();

$adminSection = 'products-info';
$pageTitle = 'О продукции';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <h1 class="admin-title" style="margin: 0;">О продукции и материалах</h1>
  </div>
  <p class="admin-subtitle">
    Тексты отображаются на страницах раздела «О продукции» в меню сайта.
    Переносы строк сохраняются. После сохранения обновляется файл <code>products-info-data.js</code>.
  </p>

  <form class="admin-form" method="post">
    <?= Csrf::field() ?>

    <?php foreach ($pageLabels as $slug => $label): ?>
      <fieldset class="admin-fieldset" style="margin-bottom: 24px;">
        <legend><?= admin_h($label) ?></legend>
        <p class="admin-subtitle" style="margin: 0 0 12px;">
          <a href="<?= admin_h($pagePaths[$slug]) ?>" target="_blank" rel="noopener">Открыть на сайте</a>
          · <code><?= admin_h($pagePaths[$slug]) ?></code>
        </p>
        <div class="admin-field">
          <label for="body_<?= admin_h($slug) ?>">Текст страницы</label>
          <textarea
            id="body_<?= admin_h($slug) ?>"
            name="body_<?= admin_h($slug) ?>"
            rows="12"
            placeholder="Введите текст для страницы «<?= admin_h($label) ?>»."
          ><?= admin_h($bodies[$slug] ?? '') ?></textarea>
        </div>
      </fieldset>
    <?php endforeach; ?>

    <div class="admin-actions">
      <button class="admin-btn" type="submit">Сохранить и опубликовать</button>
    </div>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
