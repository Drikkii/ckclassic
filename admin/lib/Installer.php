<?php

declare(strict_types=1);

final class Installer
{
    public static function runSchema(PDO $pdo, string $schemaPath): void
    {
        $sql = file_get_contents($schemaPath);
        if ($sql === false) {
            throw new RuntimeException('Не удалось прочитать sql/schema.sql');
        }

        $pdo->exec($sql);
    }

    public static function hasUsers(PDO $pdo): bool
    {
        try {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
            return $count > 0;
        } catch (PDOException) {
            return false;
        }
    }

    public static function createUser(PDO $pdo, string $username, string $password): void
    {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        if ($hash === false) {
            throw new RuntimeException('Не удалось создать хеш пароля.');
        }

        $stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        $stmt->execute([$username, $hash]);
    }
}
