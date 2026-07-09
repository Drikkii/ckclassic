<?php
/**
 * Скопируйте в config.php и укажите данные MySQL из панели Beget.
 * config.php не должен попадать в публичный репозиторий.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'YOUR_DB_NAME',
        'user' => 'YOUR_DB_USER',
        'pass' => 'YOUR_DB_PASSWORD',
        'charset' => 'utf8mb4',
    ],
    // Корень сайта (папка с index.html, catalog-data.js, img/)
    'site_root' => dirname(__DIR__),
    // Почта для заявок с форм (необязательно — иначе берётся из site-config.js)
    // 'lead_email' => 'sk-classic@mail.ru',
    // Адрес отправителя на домене сайта (создайте ящик в Beget → Почта)
    // 'lead_from_email' => 'noreply@mebel-sk-classic.ru',
    // 'lead_from_name' => 'Ск-классик',
    // 'site_url' => 'https://mebel-sk-classic.ru',
];
