<?php

declare(strict_types=1);

/** @var string $pageTitle */
/** @var string $content */
/** @var string $adminSection */

$pageTitle = $pageTitle ?? 'Админка';
$adminSection = $adminSection ?? '';
$flash = admin_take_flash();
?>
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title><?= admin_h($pageTitle) ?> — Ск-классик</title>
    <link rel="stylesheet" href="admin.css" />
  </head>
  <body class="admin">
    <header class="admin-header">
      <div class="admin-header__inner">
        <a class="admin-logo" href="index.php">Ск-классик · админка</a>
        <?php if (Auth::check()): ?>
          <nav class="admin-nav" aria-label="Разделы админки">
            <a class="admin-nav__link<?= $adminSection === 'catalog' ? ' is-active' : '' ?>" href="index.php">Каталог</a>
            <a class="admin-nav__link<?= $adminSection === 'slider' ? ' is-active' : '' ?>" href="slider.php">Слайдер</a>
            <a class="admin-nav__link<?= $adminSection === 'vacancies' ? ' is-active' : '' ?>" href="vacancies.php">Вакансии</a>
            <a class="admin-nav__link<?= $adminSection === 'privacy' ? ' is-active' : '' ?>" href="privacy.php">Конфиденциальность</a>
            <a class="admin-nav__link<?= $adminSection === 'products-info' ? ' is-active' : '' ?>" href="products-info.php">О продукции</a>
            <a class="admin-nav__link<?= $adminSection === 'where-to-buy' ? ' is-active' : '' ?>" href="where-to-buy.php">Где купить</a>
          </nav>
          <div class="admin-header__meta">
            <span><?= admin_h(Auth::username()) ?></span>
            <a href="logout.php">Выйти</a>
          </div>
        <?php endif; ?>
      </div>
    </header>

    <main class="admin-main">
      <?php if ($flash): ?>
        <div class="admin-flash admin-flash--<?= admin_h($flash['type']) ?>">
          <?= admin_h($flash['message']) ?>
        </div>
      <?php endif; ?>

      <?= $content ?>
    </main>
    <script src="admin.js" defer></script>
  </body>
</html>
