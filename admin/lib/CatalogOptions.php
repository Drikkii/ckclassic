<?php

declare(strict_types=1);

final class CatalogOptions
{
    /** @return array<string, string> */
    public static function collections(): array
    {
        return [
            'living' => 'Ливинг',
            'hermes' => 'Гермес',
            'dante' => 'Данте',
            'shantal' => 'Шантал Милорд',
            'jamaica' => 'Ямайка',
            'scarlett' => 'Скарлет',
            'teseo' => 'Тесео',
            'turin' => 'Турин',
            'dionis' => 'Дионис',
        ];
    }

    /** @return array<string, string> */
    public static function collectionPages(): array
    {
        return [
            'living' => '/pages/catalog/living.html',
            'hermes' => '/pages/catalog/hermes.html',
            'dante' => '/pages/catalog/dante.html',
            'shantal' => '/pages/catalog/shantal-milord.html',
            'jamaica' => '/pages/catalog/jamaica.html',
            'scarlett' => '/pages/catalog/scarlett.html',
            'teseo' => '/pages/catalog/teseo.html',
            'turin' => '/pages/catalog/turin.html',
            'dionis' => '/pages/catalog/dionis.html',
        ];
    }

    public static function productPageUrl(string $sku): string
    {
        return 'pages/catalog/product.html?sku=' . rawurlencode($sku);
    }

    public static function catalogPageUrl(string $collection): string
    {
        $pages = self::collectionPages();
        $path = $pages[$collection] ?? '/pages/catalog/living.html';

        return ltrim($path, '/');
    }

    /** @return array<string, string> */
    public static function types(): array
    {
        return [
            'corner-ottoman' => 'Угловой с оттоманкой',
            'corner-classic' => 'Угловой классический',
            'straight' => 'Прямой',
            'modular-set' => 'Модульный набор',
            'armchair' => 'Кресло',
            'pouf' => 'Пуфик',
        ];
    }

    /** @return array<string, string> */
    public static function styles(): array
    {
        return [
            'classic' => 'Классика',
            'modern' => 'Современный',
            'art-deco' => 'Арт-деко',
            'loft-scandinavian' => 'Лофт-скандинавский',
        ];
    }

    /** @return array<string, string> */
    public static function mechanisms(): array
    {
        return [
            'none' => 'Без механизма',
            'puma' => 'Пума',
            'spartak' => 'Спартак',
            'rollout' => 'Выкатной',
            'high-rollout' => 'Высоковыкатной',
            'gaslift' => 'Газлифт',
        ];
    }

    /** @param array<int, mixed> $values */
    public static function sanitizeMechanismList(array $values): array
    {
        $known = self::mechanisms();
        $order = array_keys($known);
        $result = [];

        foreach ($values as $value) {
            $key = self::normalizeMechanismKey((string) $value);
            if ($key === null || !isset($known[$key]) || in_array($key, $result, true)) {
                continue;
            }
            $result[] = $key;
        }

        usort(
            $result,
            static fn (string $a, string $b): int => array_search($a, $order, true) <=> array_search($b, $order, true),
        );

        return $result;
    }

    public static function normalizeMechanismKey(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $legacy = [
            'npb' => 'high-rollout',
            'sofa-bed' => 'rollout',
            'high_rollout' => 'high-rollout',
            'gas-lift' => 'gaslift',
        ];

        if (isset($legacy[$value])) {
            return $legacy[$value];
        }

        return array_key_exists($value, self::mechanisms()) ? $value : null;
    }

    /** @param array<string, mixed> $product */
    public static function resolveMechanisms(array $product): array
    {
        if (array_key_exists('mechanisms', $product) && is_array($product['mechanisms'])) {
            return self::sanitizeMechanismList($product['mechanisms']);
        }

        return ['none'];
    }

    /** @param list<string> $mechanisms */
    public static function formatMechanismLabel(array $mechanisms): string
    {
        if ($mechanisms === []) {
            return '';
        }

        $labels = self::mechanisms();
        $parts = [];

        foreach ($mechanisms as $key) {
            if (isset($labels[$key])) {
                $parts[] = $labels[$key];
            }
        }

        return implode(' / ', $parts);
    }

    /** @param array<string, mixed> $post */
    public static function mechanismsFromPost(array $post): array
    {
        $raw = $post['mechanisms'] ?? [];
        if (!is_array($raw)) {
            $raw = $raw !== '' ? [(string) $raw] : [];
        }

        return self::sanitizeMechanismList($raw);
    }

    /** @return array<string, string> */
    public static function galleryTypes(): array
    {
        return [
            'general' => 'Общий вид',
            'detail' => 'Деталь',
            'interior' => 'Интерьер',
            'mechanism' => 'Механизм',
        ];
    }

    /** @return array<string, string> */
    public static function fabrics(): array
    {
        return [
            'standard' => 'Стандарт (базовая)',
            'velvet-classic' => 'Велюр «Классик»',
            'chenille' => 'Шенилл «Комфорт»',
            'jacquard' => 'Жаккард «Премиум»',
            'leather-eco' => 'Экокожа «Soft»',
            'boucle' => 'Букле «Тренд»',
            'fringe-gold' => 'Бахрома золото',
            'fringe-silver' => 'Бахрома серебро',
        ];
    }

    /** @return list<string> */
    public static function specialGroups(): array
    {
        return ['beds', 'chairs', 'panels', 'custom'];
    }

    public static function resolveGroup(string $collection, string $currentGroup = ''): string
    {
        if (in_array($currentGroup, self::specialGroups(), true)) {
            return $currentGroup;
        }

        return self::groupForCollection($collection);
    }

    public static function groupForCollection(string $collection): string
    {
        if ($collection === 'shantal') {
            return 'shantal-milord';
        }

        return $collection;
    }

    public static function groupLabel(string $group): string
    {
        foreach (self::collections() as $slug => $label) {
            if (self::groupForCollection($slug) === $group) {
                return $label;
            }
        }

        $extra = [
            'beds' => 'Кровати',
            'chairs' => 'Кресла и стулья',
            'panels' => 'Спинки и панели',
            'custom' => 'Нестандартные изделия',
        ];

        return $extra[$group] ?? $group;
    }

    public static function normalizeType(string $type): string
    {
        $legacy = [
            'corner' => 'corner-classic',
            'modular' => 'modular-set',
            'custom-config' => 'armchair',
        ];

        if (isset($legacy[$type])) {
            return $legacy[$type];
        }

        return array_key_exists($type, self::types()) ? $type : 'straight';
    }

    public static function normalizeStyle(string $style): string
    {
        return array_key_exists($style, self::styles()) ? $style : 'classic';
    }

    public static function baseForType(string $type): string
    {
        $type = self::normalizeType($type);

        if ($type === 'corner-ottoman') {
            return 'угловой диван с оттоманкой';
        }
        if ($type === 'corner-classic') {
            return 'угловая композиция';
        }
        if ($type === 'modular-set') {
            return 'модульный набор';
        }
        if ($type === 'armchair') {
            return 'кресло';
        }
        if ($type === 'pouf') {
            return 'пуфик';
        }

        return 'прямой диван';
    }

    public static function imageUploadAccept(): string
    {
        return 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
    }

    public static function cleanDescriptionText(string $text): string
    {
        $text = preg_replace('/\s*Каркас[^.!?…]*[.!?…]?/u', '', $text) ?? $text;
        $normalized = preg_replace('/\s+/u', ' ', $text);

        return trim($normalized ?? $text);
    }

    public static function formatDimensions(int $length, int $width, int $height): string
    {
        if ($length <= 0 || $width <= 0 || $height <= 0) {
            return '';
        }

        return sprintf('%d × %d × %d см', $length, $width, $height);
    }

    /**
     * @return array{length: int, width: int, height: int}
     */
    public static function parseDimensions(array $product): array
    {
        $length = max(0, (int) ($product['length'] ?? 0));
        $width = max(0, (int) ($product['width'] ?? 0));
        $height = max(0, (int) ($product['height'] ?? 0));

        if ($length > 0 && $width > 0 && $height > 0) {
            return compact('length', 'width', 'height');
        }

        $dims = trim((string) ($product['dims'] ?? ''));
        if ($dims !== '' && preg_match('/(\d+)\s*[×x]\s*(\d+)\s*[×x]\s*(\d+)/u', $dims, $matches)) {
            $values = [(int) $matches[1], (int) $matches[2], (int) $matches[3]];
            if (max($values) > 500) {
                $values = array_map(static fn (int $value): int => (int) round($value / 10), $values);
            }

            return [
                'length' => $values[0],
                'width' => $values[1],
                'height' => $values[2],
            ];
        }

        return [
            'length' => 0,
            'width' => $width,
            'height' => 0,
        ];
    }

    /** @param array<string, mixed> $product */
    public static function enrichProduct(array $product): array
    {
        $type = self::normalizeType((string) ($product['type'] ?? 'straight'));
        $style = self::normalizeStyle((string) ($product['style'] ?? 'classic'));
        $collection = (string) ($product['collection'] ?? 'living');
        $dimensions = self::parseDimensions($product);

        $product['type'] = $type;
        $product['style'] = $style;
        $product['typeLabel'] = self::types()[$type] ?? $type;
        $product['styleLabel'] = self::styles()[$style] ?? $style;
        $product['collection'] = $collection;
        $product['collectionLabel'] = self::collections()[$collection] ?? (string) ($product['collectionLabel'] ?? '');
        $product['group'] = self::resolveGroup($collection, (string) ($product['group'] ?? ''));
        $product['length'] = $dimensions['length'];
        $product['width'] = $dimensions['width'];
        $product['height'] = $dimensions['height'];

        $formattedDims = self::formatDimensions($dimensions['length'], $dimensions['width'], $dimensions['height']);
        if ($formattedDims !== '') {
            $product['dims'] = $formattedDims;
        }

        if (empty($product['base'])) {
            $product['base'] = self::baseForType($type);
        }

        $mechanisms = self::resolveMechanisms($product);
        $product['mechanisms'] = $mechanisms;
        $product['mechanismLabel'] = self::formatMechanismLabel($mechanisms);
        unset($product['frame'], $product['isOutOfStock'], $product['hasMechanism'], $product['mechanismType']);
        $product['fabrics'] = [];
        $product['description'] = self::cleanDescriptionText((string) ($product['description'] ?? ''));

        return $product;
    }
}
