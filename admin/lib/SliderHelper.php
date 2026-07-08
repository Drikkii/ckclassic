<?php

declare(strict_types=1);

final class SliderHelper
{
    public static function publicImageSrc(string $src): string
    {
        $path = str_replace('\\', '/', trim($src));
        $path = preg_replace('#^(\.\./)+#', '', $path) ?? $path;

        return ltrim($path, '/');
    }

    public static function adminImageUrl(string $src): string
    {
        return admin_asset_url(self::publicImageSrc($src));
    }

    /** @param array<string, mixed> $slide */
    public static function toExportItem(array $slide): array
    {
        $title = (string) ($slide['title'] ?? '');
        $useH1 = !empty($slide['use_h1']);

        return [
            'src' => self::publicImageSrc((string) ($slide['image_src'] ?? '')),
            'alt' => (string) ($slide['image_alt'] ?? ''),
            'title' => $title,
            'sub' => (string) ($slide['subtitle'] ?? ''),
            'useH1' => $useH1,
            'h1' => $useH1 ? $title : '',
        ];
    }

    public static function deleteImageFile(string $siteRoot, string $src): void
    {
        $normalized = self::publicImageSrc($src);
        if (!str_starts_with($normalized, 'img/uploads/slider/')) {
            return;
        }

        $path = PathHelper::toFilesystemPath($siteRoot, $normalized);
        if ($path && is_file($path)) {
            @unlink($path);
        }
    }

    public static function publishSlider(SliderRepository $repo, SliderExporter $exporter, string $siteRoot): int
    {
        return $exporter->write($siteRoot);
    }

    /** @return list<array<string, mixed>> */
    public static function defaultSlides(): array
    {
        return [
            [
                'image_src' => 'img/photo-mebeli/Оффер 26/Ливинг МФ СК классик.jpeg',
                'image_alt' => 'Мягкая мебель Ск-классик — коллекция Ливинг',
                'title' => 'Мягкая мебель Ск-классик',
                'subtitle' => 'Собственное производство · доставка по России',
                'use_h1' => true,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/photo-mebeli/фото на белом/Гермес линейка/Гермес диван-кровать (пума).JPG',
                'image_alt' => 'Коллекция Гермес',
                'title' => 'Коллекция Гермес',
                'subtitle' => 'Классические диваны и угловые модели',
                'use_h1' => false,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/photo-mebeli/фото на белом/Данте линейка/Данте (диван-кровать).jpeg',
                'image_alt' => 'Коллекция Данте',
                'title' => 'Коллекция Данте',
                'subtitle' => 'Диваны, кресла и пуфы',
                'use_h1' => false,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/photo-mebeli/фото на белом/Шантал Милорд линейка/Шантал  Милорд.jpeg',
                'image_alt' => 'Модельный ряд',
                'title' => 'Модельный ряд',
                'subtitle' => 'Диваны, кресла, угловые и модульные системы',
                'use_h1' => false,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/photo-mebeli/Фото, вписанные в интерьер/новинка Bellezza.JPG',
                'image_alt' => 'Наши работы',
                'title' => 'Наши работы',
                'subtitle' => 'Реализованные проекты и отзывы клиентов',
                'use_h1' => false,
                'is_active' => true,
            ],
        ];
    }

    /** @param array<string, mixed> $post */
    public static function slideDataFromPost(array $post, int $id): array
    {
        return [
            'image_alt' => trim((string) ($post['alt_' . $id] ?? '')),
            'title' => trim((string) ($post['title_' . $id] ?? '')),
            'subtitle' => trim((string) ($post['subtitle_' . $id] ?? '')),
            'use_h1' => self::postFlag($post, 'use_h1_' . $id),
            'is_active' => self::postFlag($post, 'is_active_' . $id),
        ];
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
}
