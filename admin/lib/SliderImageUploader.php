<?php

declare(strict_types=1);

final class SliderImageUploader
{
    public function __construct(private string $siteRoot)
    {
    }

    public function upload(array $files, string $alt = ''): ?string
    {
        $dir = rtrim($this->siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'slider';

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('Не удалось создать папку для загрузки слайдера.');
        }

        $names = $files['name'] ?? [];
        $tmpNames = $files['tmp_name'] ?? [];
        $errors = $files['error'] ?? [];

        if (!is_array($names)) {
            $names = [$names];
            $tmpNames = [$tmpNames];
            $errors = [$errors];
        }

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

            ImageConverter::saveAsWebpResized(
                $tmp,
                $target,
                SliderImageProcessor::HERO_MAX_WIDTH,
                SliderImageProcessor::HERO_QUALITY,
            );

            $this->createSrcsetVariants($target);

            return 'img/slider/' . $filename;
        }

        return null;
    }

    private function createSrcsetVariants(string $targetPath): void
    {
        $dims = ImageConverter::imageDimensions($targetPath);
        if ($dims === null) {
            return;
        }

        $dir = dirname($targetPath);
        $baseName = pathinfo($targetPath, PATHINFO_FILENAME);
        foreach ([1280, 1920] as $width) {
            if ($dims['width'] < $width) {
                continue;
            }

            $variantPath = $dir . DIRECTORY_SEPARATOR . $baseName . '-' . $width . 'w.webp';
            if (is_file($variantPath)) {
                continue;
            }

            ImageConverter::saveAsWebpResized(
                $targetPath,
                $variantPath,
                $width,
                SliderImageProcessor::HERO_QUALITY,
            );
        }
    }
}
