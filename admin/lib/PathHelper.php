<?php

declare(strict_types=1);

final class PathHelper
{
    public static function toFilesystemPath(string $siteRoot, string $catalogPath): ?string
    {
        $normalized = str_replace('\\', '/', trim($catalogPath));
        if ($normalized === '') {
            return null;
        }

        $normalized = preg_replace('#^(\.\./)+#', '', $normalized) ?? $normalized;
        $normalized = ltrim($normalized, '/');
        $normalized = rawurldecode($normalized);

        if (strpos($normalized, '..') !== false) {
            return null;
        }

        $full = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalized);

        return $full;
    }
}
