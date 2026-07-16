<?php

declare(strict_types=1);

/**
 * Одноразовая миграция путей к фото товаров в WebP (в БД и catalog-data.js).
 * Откройте в браузере будучи авторизованным в админке, затем удалите файл.
 */

require_once __DIR__ . '/bootstrap.php';

Auth::requireLogin();

function migrate_image_path(string $path): string
{
    return preg_replace('/\.(jpe?g|png)$/i', '.webp', $path) ?? $path;
}

/** @param mixed $value */
function migrate_value(mixed $value): mixed
{
    if (is_string($value)) {
        if (preg_match('/\.(jpe?g|png)$/i', $value)) {
            return migrate_image_path($value);
        }

        return $value;
    }

    if (!is_array($value)) {
        return $value;
    }

    $next = [];
    foreach ($value as $key => $item) {
        $next[$key] = migrate_value($item);
    }

    return $next;
}

$pdo = admin_pdo();
$repo = new ProductRepository($pdo);
$products = $repo->allData();
$updated = 0;

foreach ($products as $product) {
    $sku = (string) ($product['sku'] ?? '');
    if ($sku === '') {
        continue;
    }

    $migrated = migrate_value($product);
    if ($migrated === $product) {
        continue;
    }

    $repo->save($sku, $migrated);
    $updated += 1;
}

$exporter = new CatalogExporter($repo);
$count = $exporter->write(admin_site_root());

header('Content-Type: text/plain; charset=utf-8');
echo "Updated products: {$updated}\n";
echo "Catalog republished: {$count} items\n";
echo "Done. Remove admin/migrate-images-webp.php from the server.\n";
