<?php

declare(strict_types=1);

/**
 * Обновляет поле filler у всех товаров в MySQL и пересобирает catalog-data.js.
 *
 *   php scripts/patch-product-filler.php
 *
 * То же самое можно сделать кнопкой в админке → Каталог.
 */

require_once dirname(__DIR__) . '/admin/bootstrap.php';

$repo = new ProductRepository(admin_pdo());
$exporter = new CatalogExporter($repo);
$result = ProductHelper::applyDefaultFillerToAll($repo, $exporter, admin_site_root());

echo "Обновлено товаров: {$result['updated']}, в catalog-data.js: {$result['total']}\n";
