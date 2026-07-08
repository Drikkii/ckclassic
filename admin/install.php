<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::startSession();

$error = '';
$success = '';
$installed = false;
$pdo = null;
$siteRoot = admin_site_root();
$catalogPath = $siteRoot . DIRECTORY_SEPARATOR . 'catalog-data.js';
$schemaPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'sql' . DIRECTORY_SEPARATOR . 'schema.sql';

try {
    $pdo = admin_pdo();
    $installed = Installer::hasUsers($pdo);
} catch (Throwable $e) {
    $error = 'Не удалось подключиться к MySQL: ' . $e->getMessage()
        . '. Проверьте admin/config.php (имя базы, пользователь, пароль).';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);

    if (!$pdo) {
        $error = 'Нет подключения к базе данных. Исправьте config.php и обновите страницу.';
    } elseif ($installed) {
        $error = 'Установка уже выполнена.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $password2 = (string) ($_POST['password2'] ?? '');

        if ($username === '' || $password === '') {
            $error = 'Заполните логин и пароль.';
        } elseif ($password !== $password2) {
            $error = 'Пароли не совпадают.';
        } elseif (strlen($password) < 8) {
            $error = 'Пароль должен быть не короче 8 символов.';
        } else {
            try {
                Installer::runSchema($pdo, $schemaPath);
                Installer::createUser($pdo, $username, $password);

                $repo = new ProductRepository($pdo);
                if (!is_file($catalogPath)) {
                    throw new RuntimeException('Файл catalog-data.js не найден в корне сайта.');
                }

                $imported = $repo->importFromCatalogFile($catalogPath);
                $exporter = new CatalogExporter($repo);
                $exported = $exporter->write($siteRoot);

                $success = "Готово: импортировано {$imported} товаров, catalog-data.js обновлён ({$exported}). "
                    . 'Удалите install.php с сервера и войдите через login.php.';
                $installed = true;
            } catch (Throwable $e) {
                $error = $e->getMessage();
            }
        }
    }
}

$pageTitle = 'Установка';
ob_start();
?>
<section class="admin-card" style="max-width: 640px; margin: 0 auto;">
  <h1 class="admin-title">Установка админки</h1>

  <?php if ($installed && $success === ''): ?>
    <p class="admin-muted">Админ-пользователь уже создан. Откройте <a href="login.php">login.php</a>.</p>
    <p class="admin-muted">Файл install.php лучше удалить с сервера.</p>
  <?php else: ?>
    <p class="admin-subtitle">Создаст таблицы MySQL, администратора и импортирует товары из catalog-data.js.</p>

    <?php if ($error !== ''): ?>
      <div class="admin-flash admin-flash--error"><?= admin_h($error) ?></div>
    <?php endif; ?>

    <?php if (!$pdo): ?>
      <p class="admin-muted">Исправьте подключение к MySQL в config.php и обновите страницу.</p>
    <?php elseif ($success !== ''): ?>
      <div class="admin-flash admin-flash--success"><?= admin_h($success) ?></div>
      <p><a class="admin-btn" href="login.php">Перейти ко входу</a></p>
    <?php else: ?>
      <form class="admin-form" method="post">
        <?= Csrf::field() ?>
        <div class="admin-field">
          <label for="username">Логин администратора</label>
          <input id="username" name="username" autocomplete="username" required />
        </div>
        <div class="admin-field">
          <label for="password">Пароль</label>
          <input id="password" type="password" name="password" autocomplete="new-password" required />
        </div>
        <div class="admin-field">
          <label for="password2">Повтор пароля</label>
          <input id="password2" type="password" name="password2" autocomplete="new-password" required />
        </div>
        <div class="admin-actions">
          <button class="admin-btn" type="submit">Установить</button>
        </div>
      </form>
    <?php endif; ?>
  <?php endif; ?>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
