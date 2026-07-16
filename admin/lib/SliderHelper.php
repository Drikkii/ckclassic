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
    public static function toExportItem(array $slide, ?SliderImageProcessor $processor = null): array
    {
        $title = (string) ($slide['title'] ?? '');
        $useH1 = !empty($slide['use_h1']);
        $imageSrc = self::publicImageSrc((string) ($slide['image_src'] ?? ''));

        $item = [
            'src' => $imageSrc,
            'alt' => (string) ($slide['image_alt'] ?? ''),
            'title' => $title,
            'sub' => (string) ($slide['subtitle'] ?? ''),
            'useH1' => $useH1,
            'h1' => $useH1 ? $title : '',
        ];

        if ($processor !== null && $imageSrc !== '') {
            try {
                $optimized = $processor->optimize($imageSrc);
                $item['src'] = $optimized['src'];
                $item['srcset'] = $optimized['srcset'];
                $item['width'] = $optimized['width'];
                $item['height'] = $optimized['height'];
            } catch (Throwable) {
                // Оставляем исходный файл, если оптимизация недоступна.
            }
        }

        return $item;
    }

    public static function deleteImageFile(string $siteRoot, string $src): void
    {
        $normalized = self::publicImageSrc($src);
        if (!str_starts_with($normalized, 'img/slider/')) {
            return;
        }

        if (!self::isManagedUpload($normalized)) {
            return;
        }

        $path = PathHelper::toFilesystemPath($siteRoot, $normalized);
        if ($path && is_file($path)) {
            @unlink($path);
        }

        $dir = $path ? dirname($path) : null;
        $filename = $path ? pathinfo($path, PATHINFO_FILENAME) : '';
        if ($dir === null || $filename === '') {
            return;
        }

        foreach (glob($dir . DIRECTORY_SEPARATOR . $filename . '-*w.webp') ?: [] as $variant) {
            if (is_file($variant)) {
                @unlink($variant);
            }
        }

        if (preg_match('/^(.+)-(\d+)w$/', $filename, $matches) === 1) {
            foreach (glob($dir . DIRECTORY_SEPARATOR . $matches[1] . '-*w.webp') ?: [] as $variant) {
                if (is_file($variant)) {
                    @unlink($variant);
                }
            }
        }
    }

    public static function isManagedUpload(string $src): bool
    {
        $normalized = self::publicImageSrc($src);
        $filename = pathinfo($normalized, PATHINFO_FILENAME);
        if (preg_match('/^\d{8}-\d{6}-[a-f0-9]{8}$/i', $filename) === 1) {
            return true;
        }

        return preg_match('/^\d{8}-\d{6}-[a-f0-9]{8}-\d+w$/i', $filename) === 1;
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
                'image_src' => 'img/slider/divan_classika-1920w.webp',
                'image_alt' => 'Классические диваны Ск-классик в интерьере',
                'title' => 'Мягкая мебель Ск-классик',
                'subtitle' => 'Собственное производство · доставка по России',
                'use_h1' => true,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/slider/divan_v_moskve_-1920w.webp',
                'image_alt' => 'Диваны в Москве — мебельная фабрика Ск-классик',
                'title' => 'Диваны в Москве',
                'subtitle' => 'Производство и доставка по Москве и области',
                'use_h1' => false,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/slider/divan_classika_na_zakaz-1920w.webp',
                'image_alt' => 'Классические диваны на заказ',
                'title' => 'Классика на заказ',
                'subtitle' => 'Индивидуальные размеры и отделка',
                'use_h1' => false,
                'is_active' => true,
            ],
            [
                'image_src' => 'img/slider/divan_barocco-1920w.webp',
                'image_alt' => 'Диваны в стиле барокко',
                'title' => 'Диваны в стиле барокко',
                'subtitle' => 'Роскошная классическая мягкая мебель',
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
