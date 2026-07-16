<?php

declare(strict_types=1);

final class ProductsInfoExporter
{
    /** @var array<string, string> */
    public const PAGES = [
        'materials' => 'products-materials',
        'usage' => 'products-usage',
        'warranty' => 'products-warranty',
    ];

    public function __construct(private SitePageRepository $pages)
    {
    }

    /** @return array<string, string> */
    public function collect(): array
    {
        $result = [];
        foreach (self::PAGES as $slug => $pageKey) {
            $result[$slug] = $this->pages->getBody($pageKey);
        }

        return $result;
    }

    public function write(string $siteRoot): void
    {
        $data = $this->collect();
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сформировать JSON для страниц о продукции.');
        }

        $path = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'products-info-data.js';
        $fileContent = 'window.PRODUCTS_INFO = ' . $json . ";\n";

        if (file_put_contents($path, $fileContent) === false) {
            throw new RuntimeException('Не удалось записать products-info-data.js — проверьте права на папку сайта.');
        }
    }
}
