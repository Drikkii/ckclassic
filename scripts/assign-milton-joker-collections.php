<?php

declare(strict_types=1);

/**
 * Переносит товары с «Милтон» / «Джокер» в названии в новые коллекции и публикует catalog-data.js.
 *
 *   php scripts/assign-milton-joker-collections.php
 */

require_once dirname(__DIR__) . '/admin/bootstrap.php';

function productHaystack(array $product): array
{
    $name = mb_strtolower((string) ($product['name'] ?? ''));
    $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
    $mainAlt = mb_strtolower((string) ($gallery[0]['alt'] ?? ''));
    $image = mb_strtolower(rawurldecode((string) ($product['image'] ?? '')));

    return [$name, $mainAlt, $image];
}

function belongsToMilton(array $product): bool
{
    [$name, $mainAlt, $image] = productHaystack($product);
    $hay = $name . ' ' . $mainAlt . ' ' . $image;

    return str_contains($hay, 'милтон') && !str_contains($hay, 'милорд');
}

function belongsToJoker(array $product): bool
{
    [$name, $mainAlt, $image] = productHaystack($product);

    return str_contains($name, 'джокер')
        || str_contains($mainAlt, 'джокер')
        || str_contains($image, 'джокер');
}

function assignCollection(array $product, string $slug, string $label): array
{
    $product['collection'] = $slug;
    $product['collectionLabel'] = $label;
    $product['group'] = $slug;
    if (!empty($product['description']) && is_string($product['description'])) {
        $product['description'] = preg_replace(
            '/коллекции «[^»]+»/',
            'коллекции «' . $label . '»',
            $product['description'],
            1,
        ) ?? $product['description'];
    }

    return $product;
}

$repo = new ProductRepository(admin_pdo());
$exporter = new CatalogExporter($repo);
$milton = 0;
$joker = 0;

foreach ($repo->allData() as $product) {
    if (!is_array($product) || empty($product['sku'])) {
        continue;
    }

    $next = null;
    if (belongsToMilton($product)) {
        $next = assignCollection($product, 'milton', 'Милтон');
        $milton++;
    } elseif (belongsToJoker($product)) {
        $next = assignCollection($product, 'joker', 'Джокер');
        $joker++;
    }

    if ($next !== null) {
        $repo->save((string) $product['sku'], $next);
    }
}

$total = $exporter->write(admin_site_root());

echo "Милтон: {$milton}, Джокер: {$joker}, catalog-data.js: {$total}\n";
