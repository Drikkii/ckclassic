<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

header('Content-Type: text/plain; charset=utf-8');

echo "PHP: " . PHP_VERSION . "\n\n";

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    echo "config.php: НЕ НАЙДЕН\n";
    exit;
}
echo "config.php: OK\n";

$config = require $configPath;
$db = $config['db'] ?? [];
echo "DB host: " . ($db['host'] ?? '?') . "\n";
echo "DB name: " . ($db['name'] ?? '?') . "\n";
echo "DB user: " . ($db['user'] ?? '?') . "\n";

$siteRoot = $config['site_root'] ?? dirname(__DIR__);
echo "\nsite_root: {$siteRoot}\n";
echo "catalog-data.js: " . (is_file($siteRoot . '/catalog-data.js') ? 'OK' : 'НЕ НАЙДЕН') . "\n";
echo "sql/schema.sql: " . (is_file(dirname(__DIR__) . '/sql/schema.sql') ? 'OK' : 'НЕ НАЙДЕН') . "\n";

echo "\nlib/Database.php: " . (is_file(__DIR__ . '/lib/Database.php') ? 'OK' : 'НЕ НАЙДЕН') . "\n";

try {
    require_once __DIR__ . '/lib/Database.php';
    $pdo = Database::connection($db);
    echo "\nMySQL: ПОДКЛЮЧЕНИЕ OK\n";
    $pdo->query('SELECT 1');
    echo "MySQL: ЗАПРОС OK\n";
} catch (Throwable $e) {
    echo "\nMySQL ОШИБКА: " . $e->getMessage() . "\n";
}

echo "\n---\nДиагностика доступна только после входа в админку.\n";
