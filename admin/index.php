<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new ProductRepository(admin_pdo());

$search = trim((string) ($_GET['q'] ?? ''));
$products = $repo->all($search !== '' ? $search : null);

$adminSection = 'catalog';
$pageTitle = 'Товары';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <h1 class="admin-title" style="margin: 0;">Каталог</h1>
    <a class="admin-btn" href="product-new.php">+ Новый товар</a>
  </div>
  <p class="admin-subtitle">Всего товаров: <?= (int) $repo->count() ?></p>

  <form class="admin-search" method="get">
    <input type="search" name="q" value="<?= admin_h($search) ?>" placeholder="Поиск по названию или артикулу" />
    <button class="admin-btn" type="submit">Найти</button>
    <?php if ($search !== ''): ?>
      <a class="admin-btn admin-btn--secondary" href="index.php">Сбросить</a>
    <?php endif; ?>
  </form>

  <?php if (!$products): ?>
    <p class="admin-muted">Товары не найдены. Если база пустая — откройте <a href="install.php">install.php</a>.</p>
  <?php else: ?>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Артикул</th>
          <th>Коллекция</th>
          <th>Обновлён</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($products as $product): ?>
          <tr>
            <td><a href="product.php?sku=<?= urlencode((string) $product['sku']) ?>"><?= admin_h((string) $product['name']) ?></a></td>
            <td><?= admin_h((string) $product['sku']) ?></td>
            <td><?= admin_h((string) $product['collection_label']) ?></td>
            <td><?= admin_h((string) $product['updated_at']) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
