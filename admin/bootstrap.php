<?php

declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    exit('Создайте admin/config.php на основе config.example.php и укажите данные MySQL.');
}

/** @var array{db: array, site_root: string} $config */
$config = require $configPath;

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/PathHelper.php';
require_once __DIR__ . '/lib/Csrf.php';
require_once __DIR__ . '/lib/ProductRepository.php';
require_once __DIR__ . '/lib/CatalogExporter.php';
require_once __DIR__ . '/lib/Installer.php';
require_once __DIR__ . '/lib/CatalogOptions.php';
require_once __DIR__ . '/lib/ProductHelper.php';
require_once __DIR__ . '/lib/ImageConverter.php';
require_once __DIR__ . '/lib/ImageUploader.php';
require_once __DIR__ . '/lib/SliderRepository.php';
require_once __DIR__ . '/lib/SliderHelper.php';
require_once __DIR__ . '/lib/SliderExporter.php';
require_once __DIR__ . '/lib/SliderImageProcessor.php';
require_once __DIR__ . '/lib/SitePageRepository.php';
require_once __DIR__ . '/lib/VacanciesExporter.php';
require_once __DIR__ . '/lib/PrivacyExporter.php';
require_once __DIR__ . '/lib/ProductsInfoExporter.php';
require_once __DIR__ . '/lib/WhereToBuyExporter.php';
require_once __DIR__ . '/lib/SliderImageUploader.php';

function admin_config(): array
{
    global $config;
    return $config;
}

function admin_pdo(): PDO
{
    return Database::connection(admin_config()['db']);
}

function admin_site_root(): string
{
    return admin_config()['site_root'];
}

function admin_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function admin_redirect(string $path): void
{
    header('Location: ' . $path);
    exit;
}

function admin_flash(string $message, string $type = 'success'): void
{
    Auth::startSession();
    $_SESSION['admin_flash'] = ['message' => $message, 'type' => $type];
}

function admin_take_flash(): ?array
{
    Auth::startSession();
    if (empty($_SESSION['admin_flash'])) {
        return null;
    }
    $flash = $_SESSION['admin_flash'];
    unset($_SESSION['admin_flash']);
    return $flash;
}

function admin_asset_url(string $src): string
{
    $path = str_replace('\\', '/', trim($src));
    $path = preg_replace('#^(\.\./)+#', '', $path) ?? $path;
    return '/' . ltrim($path, '/');
}

function admin_public_url(string $path): string
{
    $path = ltrim(str_replace('\\', '/', $path), '/');
    $siteUrl = rtrim(trim((string) (admin_config()['site_url'] ?? '')), '/');

    if ($siteUrl !== '') {
        return $siteUrl . '/' . $path;
    }

    return '/' . $path;
}
