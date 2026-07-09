<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::startSession();

if (Auth::check()) {
    admin_redirect('index.php');
}

$needsInstall = false;
try {
    $needsInstall = !Installer::hasUsers(admin_pdo());
} catch (Throwable) {
    $needsInstall = false;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);

    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Введите логин и пароль.';
    } elseif (Auth::attempt(admin_pdo(), $username, $password)) {
        admin_redirect('index.php');
    } else {
        Auth::startSession();
        $blockedUntil = (int) ($_SESSION['admin_login_attempts']['until'] ?? 0);
        if ($blockedUntil > time()) {
            $mins = (int) ceil(($blockedUntil - time()) / 60);
            $error = "Слишком много попыток. Повторите через {$mins} мин.";
        } else {
            $error = 'Неверный логин или пароль.';
        }
    }
}

$pageTitle = 'Вход';
ob_start();
?>
<section class="admin-card" style="max-width: 420px; margin: 40px auto;">
  <h1 class="admin-title">Вход в админку</h1>
  <p class="admin-subtitle">Управление каталогом Ск-классик</p>

  <?php if ($needsInstall): ?>
    <div class="admin-flash admin-flash--error">
      Админка ещё не установлена. Сначала откройте <a href="install.php">install.php</a>.
    </div>
  <?php endif; ?>

  <?php if ($error !== ''): ?>
    <div class="admin-flash admin-flash--error"><?= admin_h($error) ?></div>
  <?php endif; ?>

  <form class="admin-form" method="post">
    <?= Csrf::field() ?>
    <div class="admin-field">
      <label for="username">Логин</label>
      <input id="username" name="username" autocomplete="username" required />
    </div>
    <div class="admin-field">
      <label for="password">Пароль</label>
      <input id="password" type="password" name="password" autocomplete="current-password" required />
    </div>
    <div class="admin-actions">
      <button class="admin-btn" type="submit">Войти</button>
    </div>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
