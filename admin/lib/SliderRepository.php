<?php

declare(strict_types=1);

final class SliderRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, sort_order, image_src, image_alt, title, subtitle, use_h1, is_active, updated_at
             FROM slider_slides
             ORDER BY sort_order ASC, id ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function allActive(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, sort_order, image_src, image_alt, title, subtitle, use_h1, is_active, updated_at
             FROM slider_slides
             WHERE is_active = 1
             ORDER BY sort_order ASC, id ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, sort_order, image_src, image_alt, title, subtitle, use_h1, is_active, updated_at
             FROM slider_slides
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): int
    {
        $sortOrder = $this->nextSortOrder();
        $stmt = $this->pdo->prepare(
            'INSERT INTO slider_slides (sort_order, image_src, image_alt, title, subtitle, use_h1, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $sortOrder,
            (string) ($data['image_src'] ?? ''),
            (string) ($data['image_alt'] ?? ''),
            (string) ($data['title'] ?? ''),
            (string) ($data['subtitle'] ?? ''),
            !empty($data['use_h1']) ? 1 : 0,
            !empty($data['is_active']) ? 1 : 0,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE slider_slides
             SET image_alt = ?, title = ?, subtitle = ?, use_h1 = ?, is_active = ?
             WHERE id = ?'
        );
        $stmt->execute([
            (string) ($data['image_alt'] ?? ''),
            (string) ($data['title'] ?? ''),
            (string) ($data['subtitle'] ?? ''),
            !empty($data['use_h1']) ? 1 : 0,
            !empty($data['is_active']) ? 1 : 0,
            $id,
        ]);
    }

    public function updateImage(int $id, string $imageSrc): void
    {
        $stmt = $this->pdo->prepare('UPDATE slider_slides SET image_src = ? WHERE id = ?');
        $stmt->execute([$imageSrc, $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM slider_slides WHERE id = ?');
        $stmt->execute([$id]);

        return $stmt->rowCount() > 0;
    }

    /** @param list<int> $orderedIds */
    public function reorder(array $orderedIds): void
    {
        $stmt = $this->pdo->prepare('UPDATE slider_slides SET sort_order = ? WHERE id = ?');
        foreach ($orderedIds as $index => $id) {
            $stmt->execute([(int) $index, (int) $id]);
        }
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM slider_slides')->fetchColumn();
    }

    public function tableExists(): bool
    {
        try {
            $this->pdo->query('SELECT 1 FROM slider_slides LIMIT 1');
            return true;
        } catch (PDOException) {
            return false;
        }
    }

    public function ensureTable(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS slider_slides (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              sort_order INT NOT NULL DEFAULT 0,
              image_src VARCHAR(512) NOT NULL,
              image_alt VARCHAR(255) NOT NULL DEFAULT "",
              title VARCHAR(255) NOT NULL DEFAULT "",
              subtitle VARCHAR(512) NOT NULL DEFAULT "",
              use_h1 TINYINT(1) NOT NULL DEFAULT 0,
              is_active TINYINT(1) NOT NULL DEFAULT 1,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_slider_sort (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    public function seedDefaultsIfEmpty(): int
    {
        if ($this->count() > 0) {
            return 0;
        }

        return $this->replaceAll(SliderHelper::defaultSlides());
    }

    /** @param list<array<string, mixed>> $slides */
    public function replaceAll(array $slides): int
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec('DELETE FROM slider_slides');
            foreach ($slides as $slide) {
                $this->create($slide);
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return count($slides);
    }

    private function nextSortOrder(): int
    {
        return (int) $this->pdo->query('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM slider_slides')->fetchColumn();
    }
}
