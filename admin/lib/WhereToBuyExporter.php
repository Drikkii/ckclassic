<?php

declare(strict_types=1);

final class WhereToBuyExporter
{
    public const PAGE_KEY = 'where-to-buy';

    public function __construct(private SitePageRepository $pages)
    {
    }

    public function write(string $siteRoot): void
    {
        $content = $this->pages->getBody(self::PAGE_KEY);
        $json = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сформировать JSON для страницы «Где купить».');
        }

        $path = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'where-to-buy-data.js';
        $fileContent = "window.WHERE_TO_BUY_CONTENT = {$json};\n";

        if (file_put_contents($path, $fileContent, LOCK_EX) === false) {
            throw new RuntimeException('Не удалось записать where-to-buy-data.js — проверьте права на папку сайта.');
        }
    }
}
