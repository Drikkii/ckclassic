<?php

declare(strict_types=1);

final class ProductRepository
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** @return list<array<string, mixed>> */
    public function all(?string $search = null): array
    {
        if ($search !== null && $search !== '') {
            $stmt = $this->pdo->prepare(
                'SELECT sku, name, collection_label, collection_slug, description, updated_at
                 FROM products
                 WHERE name LIKE ? OR sku LIKE ?
                 ORDER BY name'
            );
            $like = '%' . $search . '%';
            $stmt->execute([$like, $like]);
        } else {
            $stmt = $this->pdo->query(
                'SELECT sku, name, collection_label, collection_slug, description, updated_at
                 FROM products
                 ORDER BY name'
            );
        }

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(string $sku): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM products WHERE sku = ? LIMIT 1');
        $stmt->execute([$sku]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $row['data'] = json_decode((string) $row['data_json'], true) ?: [];

        return $row;
    }

    /** @param array<string, mixed> $data */
    public function save(string $sku, array $data): void
    {
        $data['sku'] = $sku;
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сериализовать данные товара.');
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO products (sku, name, collection_label, collection_slug, description, data_json)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                collection_label = VALUES(collection_label),
                collection_slug = VALUES(collection_slug),
                description = VALUES(description),
                data_json = VALUES(data_json)'
        );

        $stmt->execute([
            $sku,
            (string) ($data['name'] ?? ''),
            (string) ($data['collectionLabel'] ?? ''),
            (string) ($data['collection'] ?? ''),
            (string) ($data['description'] ?? ''),
            $json,
        ]);
    }

    public function delete(string $sku): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM products WHERE sku = ?');
        $stmt->execute([$sku]);

        return $stmt->rowCount() > 0;
    }

    public function exists(string $sku): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM products WHERE sku = ? LIMIT 1');
        $stmt->execute([$sku]);

        return (bool) $stmt->fetchColumn();
    }

    /** @param array<string, mixed> $data */
    public function renameSku(string $oldSku, string $newSku, array $data): void
    {
        if ($oldSku === $newSku) {
            $this->save($oldSku, $data);

            return;
        }

        if ($this->exists($newSku)) {
            throw new RuntimeException('Товар с таким артикулом уже существует.');
        }

        $data['sku'] = $newSku;
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сериализовать данные товара.');
        }

        $stmt = $this->pdo->prepare(
            'UPDATE products
             SET sku = ?, name = ?, collection_label = ?, collection_slug = ?, description = ?, data_json = ?
             WHERE sku = ?'
        );
        $stmt->execute([
            $newSku,
            (string) ($data['name'] ?? ''),
            (string) ($data['collectionLabel'] ?? ''),
            (string) ($data['collection'] ?? ''),
            (string) ($data['description'] ?? ''),
            $json,
            $oldSku,
        ]);

        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('Товар не найден.');
        }
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    }

    public function deleteAll(): int
    {
        $count = $this->count();
        $this->pdo->exec('DELETE FROM products');

        return $count;
    }

    /** @return list<array<string, mixed>> */
    public function allData(): array
    {
        $stmt = $this->pdo->query('SELECT data_json FROM products ORDER BY name');
        $products = [];

        foreach ($stmt->fetchAll() as $row) {
            $data = json_decode((string) $row['data_json'], true);
            if (is_array($data)) {
                $products[] = $data;
            }
        }

        return $products;
    }

    public function importFromCatalogFile(string $catalogPath): int
    {
        $raw = file_get_contents($catalogPath);
        if ($raw === false) {
            throw new RuntimeException('Не удалось прочитать catalog-data.js');
        }

        if (!preg_match('/window\.CATALOG_PRODUCTS\s*=\s*(\[.*\])\s*;?\s*$/s', $raw, $matches)) {
            throw new RuntimeException('Не удалось разобрать catalog-data.js');
        }

        $products = json_decode($matches[1], true);
        if (!is_array($products)) {
            throw new RuntimeException('Некорректный JSON в catalog-data.js');
        }

        foreach ($products as $product) {
            if (!is_array($product) || empty($product['sku'])) {
                continue;
            }
            $this->save((string) $product['sku'], $product);
        }

        return count($products);
    }
}
