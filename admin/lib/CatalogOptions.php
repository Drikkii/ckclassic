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
            'baxter' => 'Бакстер',
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
            'baxter' => '/pages/catalog/baxter.html',
            'dionis' => '/pages/catalog/dionis.html',
        ];
    }

    public static function productPageUrl(string $sku): string
    {
        return '/pages/catalog/product.html?sku=' . rawurlencode($sku);
    }

    public static function catalogPageUrl(string $collection): string
    {
        $pages = self::collectionPages();

        return $pages[$collection] ?? '/pages/catalog/living.html';
    }

    /** @return array<string, string> */
    public static function types(): array
    {
        return [
            'straight' => 'Прямой',
            'corner' => 'Угловой',
            'modular' => 'Модульный',
        ];
    }

    /** @return array<string, string> */
    public static function styles(): array
    {
        return [
            'classic' => 'Классика',
            'modern' => 'Современный',
        ];
    }

    /** @return array<string, string> */
    public static function mechanisms(): array
    {
        return [
            'puma' => 'Пума',
            'rollout' => 'Выкатной',
            'npb' => 'НПБ',
            'sofa-bed' => 'Диван-кровать',
        ];
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

    public static function groupForCollection(string $collection): string
    {
        if ($collection === 'shantal') {
            return 'shantal-milord';
        }

        return $collection;
    }

    public static function baseForType(string $type): string
    {
        if ($type === 'corner') {
            return 'угловая композиция';
        }
        if ($type === 'modular') {
            return 'модульная система';
        }

        return 'прямой диван';
    }
}
