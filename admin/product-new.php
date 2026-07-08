<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new ProductRepository(admin_pdo());
$exporter = new CatalogExporter($repo);
$siteRoot = admin_site_root();
$uploader = new ImageUploader($siteRoot);

$error = '';
$sku = 'SK-NEW-' . date('ymd');
$product = ProductHelper::defaultProduct($sku);
$formId = 'product-create-form';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);

    $sku = trim((string) ($_POST['new_sku'] ?? ''));
    if ($sku === '' || !preg_match('/^[A-Za-z0-9._-]+$/', $sku)) {
        $error = 'Артикул: только латиница, цифры, точка, дефис.';
    } elseif ($repo->exists($sku)) {
        $error = 'Товар с таким артикулом уже есть.';
    } else {
        $product = ProductHelper::defaultProduct($sku);
        $product = ProductHelper::applyPost($product, $_POST);
        $product['sku'] = $sku;
        if ($product['name'] === '') {
            $error = 'Укажите название товара.';
        } else {
            if (!empty($_FILES['photos'])) {
                try {
                    $added = $uploader->upload(
                        $sku,
                        $_FILES['photos'],
                        $product['name'],
                        (string) ($_POST['upload_type'] ?? 'general')
                    );
                    $product['gallery'] = $added;
                    $product = ProductHelper::syncProductImages($product);
                } catch (Throwable $e) {
                    $error = $e->getMessage();
                }
            }

            if ($error === '') {
                $repo->save($sku, $product);
                ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
                admin_flash('Товар создан.');
                admin_redirect('product.php?sku=' . urlencode($sku));
            }
        }
    }
}

$adminSection = 'catalog';
$pageTitle = 'Новый товар';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <a class="admin-btn admin-btn--secondary" href="index.php">← К списку</a>
  </div>

  <h1 class="admin-title">Новый товар</h1>
  <p class="admin-subtitle">Заполните поля и при необходимости сразу добавьте фото.</p>

  <?php if ($error !== ''): ?>
    <div class="admin-flash admin-flash--error"><?= admin_h($error) ?></div>
  <?php endif; ?>

  <form id="<?= admin_h($formId) ?>" class="admin-form admin-form--product" method="post" enctype="multipart/form-data">
    <?= Csrf::field() ?>
    <input type="hidden" name="action" value="create" />
    <?php
    $isNewProduct = true;
    require __DIR__ . '/_product-fields.php';
    ?>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
