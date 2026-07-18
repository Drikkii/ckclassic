<?php

declare(strict_types=1);

$configPath = dirname(__DIR__) . '/admin/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120, stale-while-revalidate=300');

if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Admin config not found', 'content' => ''], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array{db: array} $config */
$config = require $configPath;

require_once dirname(__DIR__) . '/admin/lib/Database.php';
require_once dirname(__DIR__) . '/admin/lib/SitePageRepository.php';
require_once dirname(__DIR__) . '/admin/lib/WhereToBuyExporter.php';

try {
    $pdo = Database::connection($config['db']);
    $repo = new SitePageRepository($pdo);
    if (!$repo->tableExists()) {
        $repo->ensureTable();
    }

    $pageKey = WhereToBuyExporter::PAGE_KEY;
    $stmt = $pdo->prepare('SELECT updated_at FROM site_pages WHERE page_key = ? LIMIT 1');
    $stmt->execute([$pageKey]);
    $updatedAt = (string) ($stmt->fetchColumn() ?: '');

    echo json_encode(
        [
            'content' => $repo->getBody($pageKey),
            'updatedAt' => $updatedAt !== '' ? $updatedAt : null,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
    );
} catch (Throwable $e) {
    error_log('[where-to-buy] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(
        ['error' => 'Where to buy page unavailable', 'content' => ''],
        JSON_UNESCAPED_UNICODE,
    );
}
