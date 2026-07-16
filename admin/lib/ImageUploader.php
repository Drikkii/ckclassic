<?php

declare(strict_types=1);

final class ImageUploader
{
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

            if (!ImageConverter::isAllowedUpload((string) $originalName, $tmp)) {
                throw new RuntimeException('Разрешены только JPEG, PNG и WebP: ' . $originalName);
            }

            $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.webp';
            $target = $dir . DIRECTORY_SEPARATOR . $filename;

            ImageConverter::saveAsWebp($tmp, $target);

            $relative = 'uploads/products/' . $safeSku . '/' . $filename;
            $uploaded[] = [
                'src' => ProductHelper::catalogImageHref($relative),
                'alt' => $alt,
                'type' => $type,
            ];
        }

        return $uploaded;
    }
}
