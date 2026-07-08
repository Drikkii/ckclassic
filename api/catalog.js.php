<?php

declare(strict_types=1);

$configPath = dirname(__DIR__) . '/admin/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/javascript; charset=utf-8');
    echo 'console.error("Admin config not found");';
    exit;
}

/** @var array{db: array} $config */
$config = require $configPath;

require_once dirname(__DIR__) . '/admin/lib/Database.php';
require_once dirname(__DIR__) . '/admin/lib/ProductRepository.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=120, stale-while-revalidate=300');

try {
    $pdo = Database::connection($config['db']);
    $repo = new ProductRepository($pdo);
    $products = $repo->allData();
    echo 'window.CATALOG_PRODUCTS = ';
    echo json_encode($products, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo ";\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'console.error(' . json_encode('Catalog unavailable: ' . $e->getMessage(), JSON_UNESCAPED_UNICODE) . ');';
    echo "\nwindow.CATALOG_PRODUCTS = [];\n";
}
