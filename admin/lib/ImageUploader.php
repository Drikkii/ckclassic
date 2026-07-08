<?php

declare(strict_types=1);

final class ImageUploader
{
    /** @var list<string> */
    private const ALLOWED_EXT = ['webp'];

    /** @var list<string> */
    private const ALLOWED_MIME = ['image/webp'];

    public function __construct(private string $siteRoot)
    {
    }

    /**
     * @param array<string, mixed> $files $_FILES['photos']
     * @return list<array{src: string, alt: string, type: string}>
     */
    public function upload(string $sku, array $files, string $alt = '', string $type = 'general'): array
    {
        $safeSku = preg_replace('/[^A-Za-z0-9._-]+/', '-', $sku) ?? 'product';
        $dir = rtrim($this->siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products' . DIRECTORY_SEPARATOR . $safeSku;

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('Не удалось создать папку для загрузки.');
        }

        $names = $files['name'] ?? [];
        $tmpNames = $files['tmp_name'] ?? [];
        $errors = $files['error'] ?? [];

        if (!is_array($names)) {
            $names = [$names];
            $tmpNames = [$tmpNames];
            $errors = [$errors];
        }

        $uploaded = [];

        foreach ($names as $index => $originalName) {
            $error = (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE);
            if ($error === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if ($error !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Ошибка загрузки файла: ' . $originalName);
            }

            $tmp = (string) ($tmpNames[$index] ?? '');
            if ($tmp === '' || !is_uploaded_file($tmp)) {
                continue;
            }

            $ext = strtolower(pathinfo((string) $originalName, PATHINFO_EXTENSION));
            if (!in_array($ext, self::ALLOWED_EXT, true)) {
                throw new RuntimeException('Разрешён только формат WebP: ' . $originalName);
            }

            $mime = $this->detectMimeType($tmp);
            if ($mime === null || !in_array($mime, self::ALLOWED_MIME, true)) {
                throw new RuntimeException('Файл должен быть в формате WebP: ' . $originalName);
            }

            $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.webp';
            $target = $dir . DIRECTORY_SEPARATOR . $filename;

            if (!move_uploaded_file($tmp, $target)) {
                throw new RuntimeException('Не удалось сохранить файл: ' . $originalName);
            }

            $relative = 'uploads/products/' . $safeSku . '/' . $filename;
            $uploaded[] = [
                'src' => ProductHelper::catalogImageHref($relative),
                'alt' => $alt,
                'type' => $type,
            ];
        }

        return $uploaded;
    }

    private function detectMimeType(string $path): ?string
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
}
