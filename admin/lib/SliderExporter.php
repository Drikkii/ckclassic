<?php

declare(strict_types=1);

final class SliderExporter
{
    public function __construct(private SliderRepository $slides)
    {
    }

    public function write(string $siteRoot): int
    {
        $items = [];
        foreach ($this->slides->allActive() as $slide) {
            $items[] = SliderHelper::toExportItem($slide);
        }

        $json = json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сформировать JSON слайдера.');
        }

        $path = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'slider-data.js';
        $content = 'window.HOME_SLIDES = ' . $json . ";\n";

        if (file_put_contents($path, $content) === false) {
            throw new RuntimeException('Не удалось записать slider-data.js — проверьте права на папку сайта.');
        }

        return count($items);
    }
}
