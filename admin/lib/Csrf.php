<?php

declare(strict_types=1);

final class Csrf
{
    private const SESSION_KEY = 'admin_csrf_token';

    public static function token(): string
    {
        Auth::startSession();
        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION[self::SESSION_KEY];
    }

    public static function field(): string
    {
        $token = self::token();
        return '<input type="hidden" name="_csrf" value="' . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
    }

    public static function verify(?string $token): bool
    {
        Auth::startSession();
        $expected = $_SESSION[self::SESSION_KEY] ?? '';
        return is_string($token) && $expected !== '' && hash_equals($expected, $token);
    }

    public static function requireValid(?string $token): void
    {
        if (!self::verify($token)) {
            http_response_code(403);
            exit('Неверный CSRF-токен. Обновите страницу и попробуйте снова.');
        }
    }
}
