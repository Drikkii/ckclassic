<?php

declare(strict_types=1);

final class SitePageRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function ensureTable(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS site_pages (
              page_key VARCHAR(64) NOT NULL PRIMARY KEY,
              body TEXT NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    public function tableExists(): bool
    {
        try {
            $this->pdo->query('SELECT 1 FROM site_pages LIMIT 1');
            return true;
        } catch (PDOException) {
            return false;
        }
    }

    public function getBody(string $pageKey): string
    {
        $stmt = $this->pdo->prepare('SELECT body FROM site_pages WHERE page_key = ? LIMIT 1');
        $stmt->execute([$pageKey]);

        return (string) ($stmt->fetchColumn() ?: '');
    }

    public function saveBody(string $pageKey, string $body): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO site_pages (page_key, body)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE body = VALUES(body)'
        );
        $stmt->execute([$pageKey, $body]);
    }
}
