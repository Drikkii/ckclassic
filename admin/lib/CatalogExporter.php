<?php

declare(strict_types=1);

final class CatalogExporter
{
    /** @var ProductRepository */
    private $products;

    public function __construct(ProductRepository $products)
    {
        $this->products = $products;
    }

    public function write(string $siteRoot): int
    {
        $items = array_map(
            static function (array $item): array {
                return CatalogOptions::enrichProduct($item);
            },
            $this->products->allData(),
        );
        $json = json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            throw new RuntimeException('Не удалось сформировать JSON каталога.');
        }

        $path = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'catalog-data.js';
        $content = 'window.CATALOG_PRODUCTS = ' . $json . ";\n";

        if (file_put_contents($path, $content) === false) {
            throw new RuntimeException('Не удалось записать catalog-data.js — проверьте права на папку сайта.');
        }

        return count($items);
    }
}
