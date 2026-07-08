<?php

declare(strict_types=1);

/** @var array<string, mixed> $product */
/** @var string $sku */
/** @var bool $isNewProduct */
/** @var string $formId */

$formId = $formId ?? 'product-edit-form';
$isNewProduct = $isNewProduct ?? false;
$selectedFabrics = is_array($product['fabrics'] ?? null) ? $product['fabrics'] : [];
$collections = CatalogOptions::collections();
?>
<div class="admin-form-grid">
  <div class="admin-field">
    <label for="sku_display">Артикул (SKU)</label>
    <input
      id="sku_display"
      name="new_sku"
      value="<?= admin_h($sku) ?>"
      required
      pattern="[A-Za-z0-9._-]+"
    />
    <?php if (!$isNewProduct): ?>
      <p class="admin-muted" style="margin-top: 6px;">Можно изменить. Ссылка на карточку товара обновится после сохранения.</p>
    <?php endif; ?>
  </div>

  <div class="admin-field">
    <label for="name">Название</label>
    <input id="name" name="name" value="<?= admin_h((string) ($product['name'] ?? '')) ?>" required />
  </div>

  <div class="admin-field">
    <label for="collection">Коллекция</label>
    <select id="collection" name="collection">
      <?php foreach ($collections as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= ($product['collection'] ?? '') === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="admin-field">
    <label for="group">Группа (фильтр)</label>
    <input id="group" name="group" value="<?= admin_h((string) ($product['group'] ?? '')) ?>" />
  </div>

  <div class="admin-field">
    <label for="type">Тип</label>
    <select id="type" name="type">
      <?php foreach (CatalogOptions::types() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= ($product['type'] ?? '') === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="admin-field">
    <label for="style">Стиль</label>
    <select id="style" name="style">
      <?php foreach (CatalogOptions::styles() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= ($product['style'] ?? '') === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="admin-field">
    <label for="price">Цена, ₽</label>
    <input id="price" name="price" inputmode="numeric" value="<?= admin_h((string) ($product['price'] ?? 0)) ?>" />
  </div>

  <div class="admin-field">
    <label for="width">Ширина, см</label>
    <input id="width" name="width" inputmode="numeric" value="<?= admin_h((string) ($product['width'] ?? 0)) ?>" />
  </div>

  <div class="admin-field">
    <label for="dims">Габариты</label>
    <input id="dims" name="dims" value="<?= admin_h((string) ($product['dims'] ?? '')) ?>" placeholder="2000 × 950 × 880 мм" />
  </div>

  <div class="admin-field">
    <label for="popularity">Популярность (0–100)</label>
    <input id="popularity" name="popularity" type="number" min="0" max="100" value="<?= admin_h((string) ($product['popularity'] ?? 50)) ?>" />
  </div>
</div>

<div class="admin-field">
  <label for="description">Описание</label>
  <textarea id="description" name="description"><?= admin_h((string) ($product['description'] ?? '')) ?></textarea>
</div>

<div class="admin-form-grid">
  <div class="admin-field">
    <label for="frame">Каркас</label>
    <input id="frame" name="frame" value="<?= admin_h((string) ($product['frame'] ?? '')) ?>" />
  </div>
  <div class="admin-field">
    <label for="filler">Наполнитель</label>
    <input id="filler" name="filler" value="<?= admin_h((string) ($product['filler'] ?? '')) ?>" />
  </div>
  <div class="admin-field">
    <label for="base">Основание</label>
    <input id="base" name="base" value="<?= admin_h((string) ($product['base'] ?? '')) ?>" />
  </div>
</div>

<fieldset class="admin-fieldset">
  <legend>Механизм</legend>
  <label class="admin-check">
    <input type="checkbox" name="has_mechanism" value="1" <?= !empty($product['hasMechanism']) ? 'checked' : '' ?> data-mechanism-toggle />
    Есть механизм трансформации
  </label>
  <div class="admin-field" data-mechanism-fields>
    <label for="mechanism_type">Тип механизма</label>
    <select id="mechanism_type" name="mechanism_type">
      <option value="">—</option>
      <?php foreach (CatalogOptions::mechanisms() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= ($product['mechanismType'] ?? '') === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
</fieldset>

<fieldset class="admin-fieldset">
  <legend>Ткани</legend>
  <div class="admin-check-grid">
    <?php foreach (CatalogOptions::fabrics() as $value => $label): ?>
      <label class="admin-check">
        <input type="checkbox" name="fabrics[]" value="<?= admin_h($value) ?>" <?= in_array($value, $selectedFabrics, true) ? 'checked' : '' ?> />
        <?= admin_h($label) ?>
      </label>
    <?php endforeach; ?>
  </div>
</fieldset>

<?php if ($isNewProduct): ?>
  <label class="admin-check">
    <input type="checkbox" name="is_new" value="1" <?= !empty($product['isNew']) ? 'checked' : '' ?> />
    Новинка
  </label>

  <label class="admin-check">
    <input type="checkbox" name="is_out_of_stock" value="1" <?= !empty($product['isOutOfStock']) ? 'checked' : '' ?> />
    Нет в наличии
  </label>
<?php else: ?>
  <input type="hidden" name="is_new" id="product-is-new" value="<?= ($product['isNew'] ?? false) ? '1' : '0' ?>" />
  <input type="hidden" name="is_out_of_stock" id="product-is-out-of-stock" value="<?= ($product['isOutOfStock'] ?? false) ? '1' : '0' ?>" />
<?php endif; ?>

<?php if ($isNewProduct): ?>
  <div class="admin-field">
    <label for="photos">Фото (только WebP, можно несколько)</label>
    <input id="photos" type="file" name="photos[]" accept="image/webp,.webp" multiple />
  </div>
  <div class="admin-field">
    <label for="upload_type">Тип фото</label>
    <select id="upload_type" name="upload_type">
      <?php foreach (CatalogOptions::galleryTypes() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>"><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
<?php endif; ?>

<?php if ($isNewProduct): ?>
  <div class="admin-actions">
    <button class="admin-btn" type="submit">Создать товар</button>
  </div>
<?php endif; ?>
