<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

function lead_read_site_config(): array
{
    $config = [
        'email' => '',
        'mailFrom' => '',
        'mailFromName' => 'Ск-классик',
        'siteUrl' => '',
    ];

    $adminConfigPath = dirname(__DIR__) . '/admin/config.php';
    if (is_file($adminConfigPath)) {
        /** @var array<string, mixed> $adminConfig */
        $adminConfig = require $adminConfigPath;
        $config['email'] = trim((string) ($adminConfig['lead_email'] ?? ''));
        $config['mailFrom'] = trim((string) ($adminConfig['lead_from_email'] ?? ''));
        $config['mailFromName'] = trim((string) ($adminConfig['lead_from_name'] ?? $config['mailFromName']));
        $config['siteUrl'] = trim((string) ($adminConfig['site_url'] ?? ''));
    }

    $siteConfigJs = dirname(__DIR__) . '/site-config.js';
    if (!is_file($siteConfigJs)) {
        return $config;
    }

    $content = file_get_contents($siteConfigJs);
    if ($content === false) {
        return $config;
    }

    $patterns = [
        'email' => '/email:\s*["\']([^"\']+)["\']/',
        'mailFrom' => '/mailFrom:\s*["\']([^"\']+)["\']/',
        'mailFromName' => '/mailFromName:\s*["\']([^"\']+)["\']/',
        'siteUrl' => '/siteUrl:\s*["\']([^"\']+)["\']/',
    ];

    foreach ($patterns as $key => $pattern) {
        if ($config[$key] !== '' && $key !== 'mailFromName') {
            continue;
        }
        if (preg_match($pattern, $content, $matches)) {
            $config[$key] = trim($matches[1]);
        }
    }

    return $config;
}

function lead_read_email(): string
{
    $email = lead_read_site_config()['email'];
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return $email;
    }

    return '';
}

function lead_sanitize_fields(array $fields): array
{
    $clean = [];
    foreach ($fields as $key => $value) {
        if (!is_string($key) || $key === '' || str_starts_with($key, '_')) {
            continue;
        }
        if (is_array($value)) {
            $value = implode(', ', array_map('strval', $value));
        }
        $clean[$key] = trim((string) $value);
    }

    return $clean;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw !== false ? $raw : '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Некорректные данные'], JSON_UNESCAPED_UNICODE);
    exit;
}

$siteConfig = lead_read_site_config();

$to = lead_read_email();
if ($to === '') {
    http_response_code(500);
    echo json_encode(
        ['success' => false, 'message' => 'Не указан email получателя в site-config.js'],
        JSON_UNESCAPED_UNICODE,
    );
    exit;
}

$subject = trim((string) ($payload['subject'] ?? 'Заявка с сайта Ск-классик'));
$fields = lead_sanitize_fields(is_array($payload['fields'] ?? null) ? $payload['fields'] : []);

if (!$fields) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Пустая заявка'], JSON_UNESCAPED_UNICODE);
    exit;
}

$lines = [];
foreach ($fields as $label => $value) {
    if ($value === '') {
        continue;
    }
    $lines[] = $label . ': ' . $value;
}
$body = implode("\n", $lines);

$host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
$host = preg_replace('/[^a-zA-Z0-9.-]/', '', $host) ?? 'localhost';

$fromEmail = trim($siteConfig['mailFrom']);
if ($fromEmail === '' || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
    $fromEmail = 'noreply@' . $host;
}

$fromName = trim($siteConfig['mailFromName']) !== '' ? trim($siteConfig['mailFromName']) : 'Ск-классик';
$encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $encodedFromName . ' <' . $fromEmail . '>',
    'Reply-To: ' . $fromEmail,
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(
        ['success' => false, 'message' => 'Сервер не смог отправить письмо. Проверьте почту в site-config.js и настройки Beget.'],
        JSON_UNESCAPED_UNICODE,
    );
    exit;
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
