<?php

declare(strict_types=1);

$configPath = dirname(__DIR__) . '/admin/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120, stale-while-revalidate=300');

$page = trim((string) ($_GET['page'] ?? ''));

if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Admin config not found', 'content' => ''], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once dirname(__DIR__) . '/admin/lib/Database.php';
require_once dirname(__DIR__) . '/admin/lib/SitePageRepository.php';
require_once dirname(__DIR__) . '/admin/lib/ProductsInfoExporter.php';

/** @var array<string, string> $allowed */
$allowed = ProductsInfoExporter::PAGES;

if (!isset($allowed[$page])) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown page', 'content' => ''], JSON_UNESCAPED_UNICODE);
    exit;
}

$pageKey = $allowed[$page];

/** @var array{db: array} $config */
$config = require $configPath;

try {
    $pdo = Database::connection($config['db']);
    $repo = new SitePageRepository($pdo);
    if (!$repo->tableExists()) {
        $repo->ensureTable();
    }

    $stmt = $pdo->prepare('SELECT updated_at FROM site_pages WHERE page_key = ? LIMIT 1');
    $stmt->execute([$pageKey]);
    $updatedAt = (string) ($stmt->fetchColumn() ?: '');

    echo json_encode(
        [
            'page' => $page,
            'content' => $repo->getBody($pageKey),
            'updatedAt' => $updatedAt !== '' ? $updatedAt : null,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(
        ['error' => $e->getMessage(), 'content' => ''],
        JSON_UNESCAPED_UNICODE,
    );
}
