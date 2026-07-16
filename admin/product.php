<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new ProductRepository(admin_pdo());
$exporter = new CatalogExporter($repo);
$siteRoot = admin_site_root();
$uploader = new ImageUploader($siteRoot);

function admin_handle_product_post(
    ProductRepository $repo,
    CatalogExporter $exporter,
    ImageUploader $uploader,
    string $siteRoot,
    string $sku,
    array $product
): void {
    Csrf::requireValid($_POST['_csrf'] ?? null);
    $action = (string) ($_POST['action'] ?? 'save');

    if ($action === 'delete_product') {
        $repo->delete($sku);
        ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
        admin_flash('Товар удалён.');
        admin_redirect('index.php');
    }

    if ($action === 'delete_image') {
        $index = (int) ($_POST['image_index'] ?? -1);
        $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
        if (isset($gallery[$index])) {
            ProductHelper::deleteImageFile($siteRoot, (string) $gallery[$index]['src']);
            array_splice($gallery, $index, 1);
            $product['gallery'] = array_values($gallery);
            $product = ProductHelper::syncProductImages($product);
            $repo->save($sku, $product);
            ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
            admin_flash('Фото удалено.');
        }
        admin_redirect('product.php?sku=' . urlencode($sku));
    }

    if ($action === 'set_main_image') {
        $index = (int) ($_POST['image_index'] ?? -1);
        $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
        if ($index > 0 && isset($gallery[$index])) {
            $item = $gallery[$index];
            array_splice($gallery, $index, 1);
            array_unshift($gallery, $item);
            $product['gallery'] = array_values($gallery);
            $product = ProductHelper::syncProductImages($product);
            $repo->save($sku, $product);
            ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
            admin_flash('Главное фото обновлено.');
        }
        admin_redirect('product.php?sku=' . urlencode($sku));
    }

    if ($action === 'upload_images') {
        if (empty($_FILES['photos'])) {
            admin_flash('Выберите файлы для загрузки.', 'error');
            admin_redirect('product.php?sku=' . urlencode($sku));
        }
        try {
            $added = $uploader->upload(
                $sku,
                $_FILES['photos'],
                trim((string) ($_POST['upload_alt'] ?? $product['name'] ?? '')),
                (string) ($_POST['upload_type'] ?? 'general')
            );
            if (!$added) {
                admin_flash('Файлы не были загружены.', 'error');
            } else {
                $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
                $product['gallery'] = array_merge($gallery, $added);
                $product = ProductHelper::syncProductImages($product);
                $repo->save($sku, $product);
                ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
                admin_flash('Загружено фото: ' . count($added));
            }
        } catch (Throwable $e) {
            admin_flash($e->getMessage(), 'error');
        }
        admin_redirect('product.php?sku=' . urlencode($sku));
    }

    $product = ProductHelper::applyPost($product, $_POST);

    $newSku = trim((string) ($_POST['new_sku'] ?? $sku));
    if ($newSku === '' || !preg_match('/^[A-Za-z0-9._-]+$/', $newSku)) {
        admin_flash('Артикул: только латиница, цифры, точка, дефис.', 'error');
        admin_redirect('product.php?sku=' . urlencode($sku));
    }

    if ($product['name'] === '') {
        admin_flash('Укажите название товара.', 'error');
        admin_redirect('product.php?sku=' . urlencode($sku));
    }

    try {
        if ($newSku !== $sku) {
            $product = ProductHelper::renameSkuInProduct($product, $sku, $newSku, $siteRoot);
            $repo->renameSku($sku, $newSku, $product);
            $sku = $newSku;
            $message = 'Артикул изменён. Изменения сохранены.';
        } else {
            $product['sku'] = $sku;
            $repo->save($sku, $product);
            $message = 'Изменения сохранены.';
        }
    } catch (Throwable $e) {
        admin_flash($e->getMessage(), 'error');
        admin_redirect('product.php?sku=' . urlencode((string) ($_POST['sku'] ?? $sku)));
    }

    ProductHelper::publishCatalog($repo, $exporter, $siteRoot);
    admin_flash($message);
    admin_redirect('product.php?sku=' . urlencode($sku));
}

$sku = trim((string) ($_GET['sku'] ?? $_POST['sku'] ?? ''));
if ($sku === '') {
    admin_redirect('index.php');
}

$row = $repo->find($sku);
if (!$row) {
    admin_flash('Товар не найден.', 'error');
    admin_redirect('index.php');
}

$product = CatalogOptions::enrichProduct(ProductHelper::syncProductImages($row['data']));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    admin_handle_product_post($repo, $exporter, $uploader, $siteRoot, $sku, $product);
}

$formId = 'product-edit-form';
$adminSection = 'catalog';
$pageTitle = (string) ($product['name'] ?? $sku);
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <a class="admin-btn admin-btn--secondary" href="index.php">← К списку</a>
  </div>

  <h1 class="admin-title"><?= admin_h((string) $product['name']) ?></h1>
  <p class="admin-subtitle">
    Артикул: <?= admin_h($sku) ?> ·
    <?= admin_h((string) ($product['collectionLabel'] ?? '')) ?>
  </p>
  <div class="admin-actions" style="margin-bottom: 16px;">
    <a class="admin-btn admin-btn--secondary" href="<?= admin_h(admin_public_url(CatalogOptions::productPageUrl($sku))) ?>" target="_blank" rel="noopener">Карточка на сайте</a>
    <a class="admin-btn admin-btn--secondary" href="<?= admin_h(admin_public_url(CatalogOptions::catalogPageUrl((string) ($product['collection'] ?? 'living')))) ?>" target="_blank" rel="noopener">Каталог коллекции</a>
  </div>

  <form id="<?= admin_h($formId) ?>" class="admin-form admin-form--product" method="post">
    <?= Csrf::field() ?>
    <input type="hidden" name="sku" value="<?= admin_h($sku) ?>" />
    <input type="hidden" name="action" value="save" />
    <?php
    $isNewProduct = false;
    require __DIR__ . '/_product-fields.php';
    ?>
  </form>

  <?php require __DIR__ . '/_product-gallery.php'; ?>
</section>

<section class="admin-card admin-danger-zone">
  <h2 class="admin-title" style="font-size: 1.2rem;">Удаление товара</h2>
  <p class="admin-muted">Товар исчезнет с сайта.</p>
  <form method="post" onsubmit="return confirm('Удалить товар полностью?');">
    <?= Csrf::field() ?>
    <input type="hidden" name="sku" value="<?= admin_h($sku) ?>" />
    <input type="hidden" name="action" value="delete_product" />
    <button class="admin-btn admin-btn--danger" type="submit">Удалить товар</button>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
