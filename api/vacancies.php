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

try {
    $pdo = Database::connection($config['db']);
    $repo = new SitePageRepository($pdo);
    if (!$repo->tableExists()) {
        $repo->ensureTable();
    }

    $updatedAt = (string) $pdo->query(
        "SELECT updated_at FROM site_pages WHERE page_key = 'vacancies' LIMIT 1"
    )->fetchColumn();

    echo json_encode(
        [
            'content' => $repo->getBody('vacancies'),
            'updatedAt' => $updatedAt !== '' ? $updatedAt : null,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
    );
} catch (Throwable $e) {
    error_log('[vacancies] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(
        ['error' => 'Vacancies page unavailable', 'content' => ''],
        JSON_UNESCAPED_UNICODE,
    );
}
