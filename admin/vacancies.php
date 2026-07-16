<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new SitePageRepository(admin_pdo());
$exporter = new VacanciesExporter($repo);
$siteRoot = admin_site_root();

$repo->ensureTable();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);
    $body = trim((string) ($_POST['body'] ?? ''));

    try {
        $repo->saveBody('vacancies', $body);
        $exporter->write($siteRoot);
        admin_flash('Страница вакансий сохранена и опубликована на сайте.');
    } catch (Throwable $e) {
        admin_flash('Не удалось сохранить: ' . $e->getMessage(), 'error');
    }

    admin_redirect('vacancies.php');
}

$body = $repo->getBody('vacancies');

$adminSection = 'vacancies';
$pageTitle = 'Вакансии';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <h1 class="admin-title" style="margin: 0;">Страница «Вакансии»</h1>
    <a class="admin-btn admin-btn--secondary" href="../pages/about/vacancies.html" target="_blank" rel="noopener">Открыть на сайте</a>
  </div>
  <p class="admin-subtitle">
    Текст отображается на странице <code>pages/about/vacancies.html</code>.
    Переносы строк сохраняются. После сохранения обновляется файл <code>vacancies-data.js</code>.
  </p>

  <form class="admin-form" method="post">
    <?= Csrf::field() ?>
    <div class="admin-field">
      <label for="body">Текст страницы</label>
      <textarea id="body" name="body" rows="16" placeholder="Опишите открытые вакансии, условия работы и контакты для отклика."><?= admin_h($body) ?></textarea>
    </div>
    <div class="admin-actions">
      <button class="admin-btn" type="submit">Сохранить и опубликовать</button>
    </div>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
