<?php

declare(strict_types=1);

final class SliderImageProcessor
{
    public const HERO_MAX_WIDTH = 2560;
    public const HERO_QUALITY = 92;

    /** @var list<int> */
    private const SRCSET_WIDTHS = [1280, 1920];

    public function __construct(private string $siteRoot)
    {
    }

    /** @return array{src: string, srcset: string, width: int, height: int} */
    public function optimize(string $src): array
    {
        $normalized = SliderHelper::publicImageSrc($src);
        if ($normalized === '') {
            throw new RuntimeException('Путь к изображению слайда пуст.');
        }

        if (self::isSliderAsset($normalized)) {
            return self::exportSliderAsset($this->siteRoot, $normalized);
        }

        return $this->importToSliderFolder($normalized);
    }

    public static function isSliderAsset(string $src): bool
    {
        return str_starts_with($src, 'img/slider/')
            && str_ends_with(strtolower($src), '.webp');
    }

    /** @return array{src: string, srcset: string, width: int, height: int} */
    public static function exportSliderAsset(string $siteRoot, string $src): array
    {
        $path = PathHelper::toFilesystemPath($siteRoot, $src);
        if ($path === null || !is_file($path)) {
            throw new RuntimeException('Файл слайдера не найден: ' . $src);
        }

        $dims = ImageConverter::imageDimensions($path);
        if ($dims === null) {
            throw new RuntimeException('Не удалось прочитать размеры: ' . $src);
        }

        $srcset = self::collectSrcset($siteRoot, $src, $dims['width']);
        if ($srcset === '') {
            $srcset = $src . ' ' . $dims['width'] . 'w';
        }

        return [
            'src' => $src,
            'srcset' => $srcset,
            'width' => $dims['width'],
            'height' => $dims['height'],
        ];
    }

    /** @return array{src: string, srcset: string, width: int, height: int} */
    private function importToSliderFolder(string $normalized): array
    {
        $sourcePath = PathHelper::toFilesystemPath($this->siteRoot, $normalized);
        if ($sourcePath === null || !is_file($sourcePath)) {
            throw new RuntimeException('Файл изображения не найден: ' . $normalized);
        }

        $sourceMtime = (int) filemtime($sourcePath);
        $sourceDims = ImageConverter::imageDimensions($sourcePath);
        if ($sourceDims === null) {
            throw new RuntimeException('Не удалось прочитать размеры изображения: ' . $normalized);
        }

        $cacheKey = substr(hash('sha256', $normalized . '|' . $sourceMtime), 0, 16);
        $baseName = $cacheKey;
        $srcsetParts = [];
        $primarySrc = $normalized;
        $primaryWidth = $sourceDims['width'];
        $primaryHeight = $sourceDims['height'];

        foreach (self::SRCSET_WIDTHS as $targetWidth) {
            if ($sourceDims['width'] < $targetWidth) {
                continue;
            }

            $relative = self::sliderRelativePath($baseName, $targetWidth);
            $targetPath = PathHelper::toFilesystemPath($this->siteRoot, $relative);
            if ($targetPath === null) {
                continue;
            }

            self::ensureVariant($sourcePath, $targetPath, $sourceMtime, $targetWidth);

            $srcsetParts[] = $relative . ' ' . $targetWidth . 'w';
            $primarySrc = $relative;
            $primaryWidth = min($targetWidth, $sourceDims['width']);
            $primaryHeight = (int) max(
                1,
                round($sourceDims['height'] * ($primaryWidth / $sourceDims['width'])),
            );
        }

        if (!$srcsetParts) {
            $relative = self::sliderRelativePath($baseName, 0);
            $targetPath = PathHelper::toFilesystemPath($this->siteRoot, $relative);
            if ($targetPath !== null) {
                self::ensureVariant($sourcePath, $targetPath, $sourceMtime, 0);
                $saved = ImageConverter::imageDimensions($targetPath);
                if ($saved !== null) {
                    $primaryWidth = $saved['width'];
                    $primaryHeight = $saved['height'];
                }
                $primarySrc = $relative;
            }

            return [
                'src' => $primarySrc,
                'srcset' => $primarySrc . ' ' . $primaryWidth . 'w',
                'width' => $primaryWidth,
                'height' => $primaryHeight,
            ];
        }

        return [
            'src' => $primarySrc,
            'srcset' => implode(', ', $srcsetParts),
            'width' => $primaryWidth,
            'height' => $primaryHeight,
        ];
    }

    private static function sliderRelativePath(string $baseName, int $width): string
    {
        if ($width > 0) {
            return 'img/slider/' . $baseName . '-' . $width . 'w.webp';
        }

        return 'img/slider/' . $baseName . '.webp';
    }

    private static function ensureVariant(
        string $sourcePath,
        string $targetPath,
        int $sourceMtime,
        int $maxWidth,
    ): void {
        $needsWrite = !is_file($targetPath) || (int) filemtime($targetPath) < $sourceMtime;
        if (!$needsWrite) {
            return;
        }

        ImageConverter::saveAsWebpResized(
            $sourcePath,
            $targetPath,
            $maxWidth > 0 ? $maxWidth : self::HERO_MAX_WIDTH,
            self::HERO_QUALITY,
        );
    }

    private static function collectSrcset(string $siteRoot, string $src, int $width): string
    {
        $path = PathHelper::toFilesystemPath($siteRoot, $src);
        if ($path === null) {
            return '';
        }

        $dir = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);
        $baseName = preg_match('/^(.+)-(\d+)w$/', $filename, $matches) === 1
            ? $matches[1]
            : $filename;
        $parts = [];

        foreach (self::SRCSET_WIDTHS as $targetWidth) {
            if ($width < $targetWidth) {
                continue;
            }

            $variantName = $baseName . '-' . $targetWidth . 'w.webp';
            $variantPath = $dir . DIRECTORY_SEPARATOR . $variantName;
            if (!is_file($variantPath)) {
                continue;
            }

            $relative = self::sliderRelativePathFromFile($siteRoot, $variantPath);
            if ($relative === '') {
                continue;
            }

            $variantDims = ImageConverter::imageDimensions($variantPath);
            $descriptor = $variantDims !== null
                ? (string) $variantDims['width'] . 'w'
                : (string) $targetWidth . 'w';
            $parts[] = $relative . ' ' . $descriptor;
        }

        return implode(', ', $parts);
    }

    private static function sliderRelativePathFromFile(string $siteRoot, string $absolutePath): string
    {
        $root = rtrim(str_replace('\\', '/', $siteRoot), '/');
        $file = str_replace('\\', '/', $absolutePath);
        $prefix = $root . '/';

        if (!str_starts_with($file, $prefix)) {
            return '';
        }

        return ltrim(substr($file, strlen($prefix)), '/');
    }
}
