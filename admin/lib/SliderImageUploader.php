<?php

declare(strict_types=1);

final class SliderImageUploader
{
    /** @var list<string> */
    private const ALLOWED_EXT = ['webp'];

    /** @var list<string> */
    private const ALLOWED_MIME = ['image/webp'];

    public function __construct(private string $siteRoot)
    {
    }

    public function upload(array $files, string $alt = ''): ?string
    {
        $dir = rtrim($this->siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'slider';

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

            return 'img/uploads/slider/' . $filename;
        }

        return null;
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
