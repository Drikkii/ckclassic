<?php

declare(strict_types=1);

/** @var array<string, mixed> $product */
/** @var string $sku */
/** @var bool $isNewProduct */
/** @var string $formId */

$formId = $formId ?? 'product-edit-form';
$isNewProduct = $isNewProduct ?? false;
$collections = CatalogOptions::collections();
$dimensions = CatalogOptions::parseDimensions($product);
$groupValue = CatalogOptions::resolveGroup(
    (string) ($product['collection'] ?? 'living'),
    (string) ($product['group'] ?? ''),
);
$groupLabel = CatalogOptions::groupLabel($groupValue);
$imageAccept = CatalogOptions::imageUploadAccept();
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
    <label for="group_display">Группа фильтров</label>
    <input
      id="group_display"
      type="text"
      value="<?= admin_h($groupLabel) ?>"
      readonly
      class="admin-input-readonly"
      data-group-display
    />
    <input type="hidden" id="group" name="group" value="<?= admin_h($groupValue) ?>" data-group-value />
    <p class="admin-muted" style="margin-top: 6px;">Выставляется автоматически по выбранной коллекции.</p>
  </div>

  <div class="admin-field">
    <label for="type">Тип</label>
    <select id="type" name="type" data-product-type>
      <?php foreach (CatalogOptions::types() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= CatalogOptions::normalizeType((string) ($product['type'] ?? '')) === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="admin-field">
    <label for="style">Стиль</label>
    <select id="style" name="style">
      <?php foreach (CatalogOptions::styles() as $value => $label): ?>
        <option value="<?= admin_h($value) ?>" <?= CatalogOptions::normalizeStyle((string) ($product['style'] ?? '')) === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="admin-field">
    <label for="price">Цена, ₽</label>
    <input id="price" name="price" inputmode="numeric" value="<?= admin_h((string) ($product['price'] ?? 0)) ?>" />
  </div>

  <div class="admin-field">
    <label for="length">Длина, см</label>
    <input id="length" name="length" inputmode="numeric" min="0" value="<?= admin_h((string) $dimensions['length']) ?>" data-dimension-field />
  </div>

  <div class="admin-field">
    <label for="width">Ширина, см</label>
    <input id="width" name="width" inputmode="numeric" min="0" value="<?= admin_h((string) $dimensions['width']) ?>" data-dimension-field />
  </div>

  <div class="admin-field">
    <label for="height">Высота, см</label>
    <input id="height" name="height" inputmode="numeric" min="0" value="<?= admin_h((string) $dimensions['height']) ?>" data-dimension-field />
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
    <label for="filler">Наполнитель</label>
    <input id="filler" name="filler" value="<?= admin_h((string) ($product['filler'] ?? '')) ?>" />
  </div>
  <div class="admin-field">
    <label for="base">Основание</label>
    <input id="base" name="base" value="<?= admin_h((string) ($product['base'] ?? '')) ?>" data-product-base />
  </div>
</div>

<fieldset class="admin-fieldset">
  <legend>Механизм</legend>
  <p class="admin-muted" style="margin-bottom: 10px;">Отметьте один или несколько вариантов. Если ничего не выбрано, строка «Механизм» на сайте не показывается.</p>
  <div class="admin-check-grid">
    <?php
    $selectedMechanisms = CatalogOptions::resolveMechanisms($product);
    foreach (CatalogOptions::mechanisms() as $value => $label):
        $checked = in_array($value, $selectedMechanisms, true);
    ?>
      <label class="admin-check">
        <input type="checkbox" name="mechanisms[]" value="<?= admin_h($value) ?>" <?= $checked ? 'checked' : '' ?> />
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
<?php else: ?>
  <input type="hidden" name="is_new" id="product-is-new" value="<?= ($product['isNew'] ?? false) ? '1' : '0' ?>" />
<?php endif; ?>

<?php if ($isNewProduct): ?>
  <div class="admin-field">
    <label for="photos">Фото (JPEG, PNG или WebP)</label>
    <input id="photos" type="file" name="photos[]" accept="<?= admin_h($imageAccept) ?>" multiple />
    <p class="admin-muted" style="margin-top: 6px;">Файлы автоматически конвертируются в WebP при загрузке.</p>
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
