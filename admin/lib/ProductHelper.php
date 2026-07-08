<?php

declare(strict_types=1);

final class ProductHelper
{
    public static function syncProductImages(array $product): array
    {
        $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
        if ($gallery) {
            $product['image'] = (string) ($gallery[0]['src'] ?? $product['image'] ?? '');
        } elseif (!empty($product['image'])) {
            $product['gallery'] = [[
                'src' => $product['image'],
                'alt' => (string) ($product['name'] ?? ''),
                'type' => 'general',
            ]];
        }

        return $product;
    }

    public static function catalogImageHref(string $relativePath): string
    {
        $normalized = str_replace('\\', '/', trim($relativePath, '/'));
        $parts = array_map('rawurlencode', explode('/', $normalized));

        return '../../img/' . implode('/', $parts);
    }

    /** @param list<array<string, mixed>> $gallery */
    public static function applyGalleryOrder(array $gallery, string $orderCsv): array
    {
        $orderCsv = trim($orderCsv);
        if ($orderCsv === '') {
            return $gallery;
        }

        $order = array_map('intval', explode(',', $orderCsv));
        $ordered = [];

        foreach ($order as $index) {
            if (isset($gallery[$index])) {
                $ordered[] = $gallery[$index];
            }
        }

        foreach ($gallery as $index => $item) {
            if (!in_array($index, $order, true)) {
                $ordered[] = $item;
            }
        }

        return array_values($ordered);
    }

    public static function deleteImageFile(string $siteRoot, string $src): void
    {
        $path = PathHelper::toFilesystemPath($siteRoot, $src);
        if ($path && is_file($path)) {
            @unlink($path);
        }
    }

    public static function safeSku(string $sku): string
    {
        $safe = preg_replace('/[^A-Za-z0-9._-]+/', '-', $sku);

        return $safe !== '' && $safe !== null ? $safe : 'product';
    }

    /** @param array<string, mixed> $product */
    public static function renameSkuInProduct(array $product, string $oldSku, string $newSku, string $siteRoot): array
    {
        $oldSafe = self::safeSku($oldSku);
        $newSafe = self::safeSku($newSku);

        if ($oldSafe !== $newSafe) {
            $uploadsRoot = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products' . DIRECTORY_SEPARATOR;
            $oldDir = $uploadsRoot . $oldSafe;
            $newDir = $uploadsRoot . $newSafe;

            if (is_dir($oldDir)) {
                if (is_dir($newDir)) {
                    throw new RuntimeException('Папка для нового артикула уже существует.');
                }
                if (!rename($oldDir, $newDir)) {
                    throw new RuntimeException('Не удалось переименовать папку с фото.');
                }
            }

            $oldPathSegment = 'uploads/products/' . $oldSafe;
            $newPathSegment = 'uploads/products/' . $newSafe;
            $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];

            foreach ($gallery as $index => $item) {
                $src = (string) ($item['src'] ?? '');
                if ($src !== '' && strpos($src, $oldPathSegment) !== false) {
                    $gallery[$index]['src'] = str_replace($oldPathSegment, $newPathSegment, $src);
                }
            }
            $product['gallery'] = $gallery;

            $image = (string) ($product['image'] ?? '');
            if ($image !== '' && strpos($image, $oldPathSegment) !== false) {
                $product['image'] = str_replace($oldPathSegment, $newPathSegment, $image);
            }
        }

        $product['sku'] = $newSku;

        return self::syncProductImages($product);
    }

    public static function publishCatalog(ProductRepository $repo, CatalogExporter $exporter, string $siteRoot): void
    {
        $count = $exporter->write($siteRoot);
        admin_flash("Каталог обновлён на сайте ({$count} товаров).");
    }

    /** @param array<string, mixed> $product */
    public static function applyPost(array $product, array $post): array
    {
        $product['name'] = trim((string) ($post['name'] ?? $product['name'] ?? ''));
        $product['description'] = trim((string) ($post['description'] ?? $product['description'] ?? ''));
        $product['dims'] = trim((string) ($post['dims'] ?? $product['dims'] ?? ''));
        $product['frame'] = trim((string) ($post['frame'] ?? $product['frame'] ?? ''));
        $product['filler'] = trim((string) ($post['filler'] ?? $product['filler'] ?? ''));
        $product['base'] = trim((string) ($post['base'] ?? $product['base'] ?? ''));

        $product['price'] = (int) preg_replace('/\D+/', '', (string) ($post['price'] ?? $product['price'] ?? 0));
        $product['basePrice'] = $product['price'];
        $product['width'] = max(0, (int) ($post['width'] ?? $product['width'] ?? 0));
        $product['popularity'] = max(0, min(100, (int) ($post['popularity'] ?? $product['popularity'] ?? 50)));

        $collection = (string) ($post['collection'] ?? $product['collection'] ?? 'living');
        $collections = CatalogOptions::collections();
        $product['collection'] = $collection;
        $product['collectionLabel'] = $collections[$collection] ?? (string) ($product['collectionLabel'] ?? '');
        $product['group'] = trim((string) ($post['group'] ?? CatalogOptions::groupForCollection($collection)));

        $product['style'] = (string) ($post['style'] ?? $product['style'] ?? 'classic');
        $product['type'] = (string) ($post['type'] ?? $product['type'] ?? 'straight');
        $product['isNew'] = self::postFlag($post, 'is_new');
        $product['isOutOfStock'] = self::postFlag($post, 'is_out_of_stock');

        $hasMechanism = !empty($post['has_mechanism']);
        $product['hasMechanism'] = $hasMechanism;
        if ($hasMechanism) {
            $mechanismType = (string) ($post['mechanism_type'] ?? '');
            $mechanisms = CatalogOptions::mechanisms();
            $product['mechanismType'] = $mechanismType !== '' ? $mechanismType : null;
            $product['mechanismLabel'] = $mechanisms[$mechanismType] ?? '—';
        } else {
            $product['mechanismType'] = null;
            $product['mechanismLabel'] = '—';
        }

        $fabrics = $post['fabrics'] ?? [];
        if (!is_array($fabrics)) {
            $fabrics = [];
        }
        $allowedFabrics = array_keys(CatalogOptions::fabrics());
        $product['fabrics'] = array_values(array_intersect($fabrics, $allowedFabrics));
        if (!$product['fabrics']) {
            $product['fabrics'] = ['standard'];
        }

        $gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
        $orderCsv = (string) ($post['gallery_order'] ?? '');
        $orderCsv = trim($orderCsv);
        $order = $orderCsv !== '' ? array_map('intval', explode(',', $orderCsv)) : array_keys($gallery);

        $newGallery = [];
        foreach ($order as $origIdx) {
            if (!isset($gallery[$origIdx])) {
                continue;
            }
            $item = $gallery[$origIdx];
            $typeKey = 'gallery_type_' . $origIdx;
            $altKey = 'gallery_alt_' . $origIdx;
            if (isset($post[$typeKey])) {
                $item['type'] = (string) $post[$typeKey];
            }
            if (isset($post[$altKey])) {
                $item['alt'] = trim((string) $post[$altKey]);
            }
            $newGallery[] = $item;
        }
        $product['gallery'] = $newGallery;

        return self::syncProductImages($product);
    }

    /** @param array<string, mixed> $post */
    private static function postFlag(array $post, string $key): bool
    {
        if (!isset($post[$key])) {
            return false;
        }

        $value = $post[$key];
        if (is_array($value)) {
            return in_array('1', $value, true);
        }

        return (string) $value === '1';
    }

    /** @return array<string, mixed> */
    public static function defaultProduct(string $sku): array
    {
        return [
            'sku' => $sku,
            'name' => '',
            'collectionLabel' => 'Ливинг',
            'collection' => 'living',
            'group' => 'living',
            'style' => 'classic',
            'type' => 'straight',
            'dims' => '',
            'width' => 170,
            'hasMechanism' => false,
            'mechanismType' => null,
            'mechanismLabel' => '—',
            'price' => 0,
            'basePrice' => 0,
            'isNew' => true,
            'isOutOfStock' => false,
            'popularity' => 50,
            'description' => '',
            'frame' => 'массив бука, фанера, берёзовая латофлекс',
            'filler' => 'ППУ высокой плотности, синтепон',
            'base' => 'прямой диван',
            'fabrics' => ['standard'],
            'gallery' => [],
            'image' => '',
        ];
    }
}
