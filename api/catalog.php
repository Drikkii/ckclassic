<?php

declare(strict_types=1);

$configPath = dirname(__DIR__) . '/admin/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Admin config not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array{db: array} $config */
$config = require $configPath;

require_once dirname(__DIR__) . '/admin/lib/Database.php';
require_once dirname(__DIR__) . '/admin/lib/ProductRepository.php';
require_once dirname(__DIR__) . '/admin/lib/CatalogOptions.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

try {
    $pdo = Database::connection($config['db']);
    $repo = new ProductRepository($pdo);
    $products = array_map(
        static function (array $item): array {
            return CatalogOptions::enrichProduct($item);
        },
        $repo->allData(),
    );
    echo json_encode($products, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Catalog unavailable'], JSON_UNESCAPED_UNICODE);
}
