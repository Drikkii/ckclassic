<?php

declare(strict_types=1);

final class Auth
{
    public static function startSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443);

            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'secure' => $secure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }
    }

    public static function check(): bool
    {
        self::startSession();
        return !empty($_SESSION['admin_user_id']);
    }

    public static function requireLogin(): void
    {
        if (!self::check()) {
            header('Location: login.php');
            exit;
        }
    }

    public static function attempt(PDO $pdo, string $username, string $password): bool
    {
        self::startSession();

        $attemptKey = 'admin_login_attempts';
        $attempts = $_SESSION[$attemptKey] ?? ['count' => 0, 'until' => 0];
        if (($attempts['until'] ?? 0) > time()) {
            return false;
        }

        $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $count = (int) ($attempts['count'] ?? 0) + 1;
            if ($count >= 5) {
                $_SESSION[$attemptKey] = ['count' => 0, 'until' => time() + 900];
            } else {
                $_SESSION[$attemptKey] = ['count' => $count, 'until' => 0];
            }
            return false;
        }

        unset($_SESSION[$attemptKey]);
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = (int) $user['id'];
        $_SESSION['admin_username'] = $username;

        return true;
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
    }

    public static function username(): string
    {
        self::startSession();
        return (string) ($_SESSION['admin_username'] ?? '');
    }
}
