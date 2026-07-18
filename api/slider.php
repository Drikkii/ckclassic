<?php

declare(strict_types=1);

$configPath = dirname(__DIR__) . '/admin/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Admin config not found', 'slides' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array{db: array} $config */
$config = require $configPath;

require_once dirname(__DIR__) . '/admin/lib/Database.php';
require_once dirname(__DIR__) . '/admin/lib/SliderRepository.php';
require_once dirname(__DIR__) . '/admin/lib/SliderHelper.php';

require_once dirname(__DIR__) . '/admin/lib/PathHelper.php';
require_once dirname(__DIR__) . '/admin/lib/ImageConverter.php';
require_once dirname(__DIR__) . '/admin/lib/SliderImageProcessor.php';

try {
    $pdo = Database::connection($config['db']);
    $repo = new SliderRepository($pdo);
    if (!$repo->tableExists()) {
        $repo->ensureTable();
    }

    $processor = new SliderImageProcessor(dirname(__DIR__));
    $slides = [];
    foreach ($repo->allActive() as $slide) {
        $slides[] = SliderHelper::toExportItem($slide, $processor);
    }

    $updatedAt = (string) $pdo->query('SELECT MAX(updated_at) FROM slider_slides')->fetchColumn();

    echo json_encode(
        [
            'slides' => $slides,
            'updatedAt' => $updatedAt !== '' ? $updatedAt : null,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
    );
} catch (Throwable $e) {
    error_log('[slider] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(
        ['error' => 'Slider unavailable', 'slides' => []],
        JSON_UNESCAPED_UNICODE,
    );
}
