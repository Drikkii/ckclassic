<?php

declare(strict_types=1);

final class ImageConverter
{
    /** @var array<string, list<string>> */
    private const ALLOWED_SOURCE = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/webp' => ['webp'],
    ];

    /** @return list<string> */
    public static function allowedExtensions(): array
    {
        $ext = [];
        foreach (self::ALLOWED_SOURCE as $extensions) {
            foreach ($extensions as $item) {
                $ext[] = $item;
            }
        }

        return array_values(array_unique($ext));
    }

    public static function acceptAttribute(): string
    {
        return 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
    }

    public static function detectMimeType(string $path): ?string
    {
        if (!is_file($path)) {
            return null;
        }

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $path);
                finfo_close($finfo);
                if (is_string($mime) && $mime !== '') {
                    return $mime;
                }
            }
        }

        if (function_exists('mime_content_type')) {
            $mime = mime_content_type($path);
            if (is_string($mime) && $mime !== '') {
                return $mime;
            }
        }

        return null;
    }

    public static function isAllowedUpload(string $originalName, string $tmpPath): bool
    {
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $mime = self::detectMimeType($tmpPath);
        if ($mime === null || !isset(self::ALLOWED_SOURCE[$mime])) {
            return false;
        }

        return in_array($ext, self::ALLOWED_SOURCE[$mime], true);
    }

    public static function saveAsWebp(string $sourcePath, string $targetPath, int $quality = 85): void
    {
        self::saveAsWebpResized($sourcePath, $targetPath, 0, $quality);
    }

    /** @return array{width: int, height: int} */
    public static function saveAsWebpResized(
        string $sourcePath,
        string $targetPath,
        int $maxWidth = 0,
        int $quality = 85,
    ): array {
        if (!function_exists('imagewebp')) {
            throw new RuntimeException('На сервере не включена поддержка WebP (GD).');
        }

        $image = self::loadImage($sourcePath);
        $srcWidth = imagesx($image);
        $srcHeight = imagesy($image);

        if ($maxWidth > 0 && $srcWidth > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) max(1, round($srcHeight * ($maxWidth / $srcWidth)));
            $resized = imagecreatetruecolor($newWidth, $newHeight);
            if ($resized === false) {
                imagedestroy($image);
                throw new RuntimeException('Не удалось подготовить холст для изменения размера.');
            }

            imagealphablending($resized, true);
            imagesavealpha($resized, true);
            imagecopyresampled(
                $resized,
                $image,
                0,
                0,
                0,
                0,
                $newWidth,
                $newHeight,
                $srcWidth,
                $srcHeight,
            );
            imagedestroy($image);
            $image = $resized;
            $srcWidth = $newWidth;
            $srcHeight = $newHeight;
        }

        $dir = dirname($targetPath);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            imagedestroy($image);
            throw new RuntimeException('Не удалось создать папку для сохранения.');
        }

        $saved = imagewebp($image, $targetPath, max(1, min(100, $quality)));
        imagedestroy($image);

        if (!$saved) {
            throw new RuntimeException('Не удалось сохранить WebP.');
        }

        return ['width' => $srcWidth, 'height' => $srcHeight];
    }

    /** @return \GdImage */
    public static function loadImage(string $sourcePath): \GdImage
    {
        $mime = self::detectMimeType($sourcePath);
        if ($mime === null) {
            throw new RuntimeException('Не удалось определить тип изображения.');
        }

        $image = match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($sourcePath),
            'image/png' => imagecreatefrompng($sourcePath),
            'image/webp' => imagecreatefromwebp($sourcePath),
            default => false,
        };

        if ($image === false) {
            throw new RuntimeException('Не удалось прочитать изображение.');
        }

        if ($mime === 'image/png') {
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        return $image;
    }

    /** @return array{width: int, height: int}|null */
    public static function imageDimensions(string $path): ?array
    {
        if (!is_file($path)) {
            return null;
        }

        $size = @getimagesize($path);
        if (!is_array($size) || empty($size[0]) || empty($size[1])) {
            return null;
        }

        return [
            'width' => (int) $size[0],
            'height' => (int) $size[1],
        ];
    }
}
