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
require_once dirname(__DIR__) . '/admin/lib/SliderRepository.php';
require_once dirname(__DIR__) . '/admin/lib/SliderHelper.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

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

    echo 'window.HOME_SLIDES = ';
    echo json_encode($slides, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo ";\n";
} catch (Throwable $e) {
    error_log('[slider.js] ' . $e->getMessage());
    http_response_code(500);
    echo 'console.error(' . json_encode('Slider unavailable', JSON_UNESCAPED_UNICODE) . ');' . "\n";
}
