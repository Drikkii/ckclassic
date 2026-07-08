<?php

declare(strict_types=1);

/** @var array<string, mixed> $product */
/** @var string $sku */
/** @var string $formId */
/** @var bool $isNewProduct */

$formId = $formId ?? 'product-edit-form';
$isNewProduct = $isNewProduct ?? false;
$gallery = is_array($product['gallery'] ?? null) ? $product['gallery'] : [];
$galleryOrder = implode(',', array_keys($gallery));
?>
<input type="hidden" name="gallery_order" value="<?= admin_h($galleryOrder) ?>" data-gallery-order form="<?= admin_h($formId) ?>" />

<section class="admin-card" style="margin-top: 20px; padding: 0; border: none; box-shadow: none; background: transparent;">
  <div class="admin-card">
    <h2 class="admin-title" style="font-size: 1.2rem;">Галерея</h2>
    <p class="admin-subtitle">Перетащите фото для смены порядка. Первое — главное в каталоге. Сохраните товар после изменения порядка.</p>

    <?php if (!$gallery): ?>
      <p class="admin-muted">Нет фото.</p>
    <?php else: ?>
      <div class="admin-gallery admin-gallery--sortable" data-admin-gallery>
        <?php foreach ($gallery as $index => $image): ?>
          <article class="admin-gallery__item" data-gallery-item data-original-index="<?= (int) $index ?>" draggable="true">
            <img src="<?= admin_h(admin_asset_url((string) ($image['src'] ?? ''))) ?>" alt="" />
            <div class="admin-gallery__meta">
              <?php if ($index === 0): ?><strong>Главное</strong><?php endif; ?>
              <label>
                Тип
                <select name="gallery_type_<?= (int) $index ?>" form="<?= admin_h($formId) ?>">
                  <?php foreach (CatalogOptions::galleryTypes() as $value => $label): ?>
                    <option value="<?= admin_h($value) ?>" <?= ($image['type'] ?? '') === $value ? 'selected' : '' ?>><?= admin_h($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </label>
              <label>
                Подпись
                <input type="text" name="gallery_alt_<?= (int) $index ?>" value="<?= admin_h((string) ($image['alt'] ?? '')) ?>" form="<?= admin_h($formId) ?>" />
              </label>
              <?php if ($index !== 0): ?>
                <form method="post" style="margin-top: 8px;">
                  <?= Csrf::field() ?>
                  <input type="hidden" name="sku" value="<?= admin_h($sku) ?>" />
                  <input type="hidden" name="action" value="set_main_image" />
                  <input type="hidden" name="image_index" value="<?= (int) $index ?>" />
                  <button class="admin-btn admin-btn--secondary" type="submit" style="width: 100%; padding: 8px;">Сделать главным</button>
                </form>
              <?php endif; ?>
              <form method="post" onsubmit="return confirm('Удалить это фото?');" style="margin-top: 8px;">
                <?= Csrf::field() ?>
                <input type="hidden" name="sku" value="<?= admin_h($sku) ?>" />
                <input type="hidden" name="action" value="delete_image" />
                <input type="hidden" name="image_index" value="<?= (int) $index ?>" />
                <button class="admin-btn admin-btn--danger" type="submit" style="width: 100%; padding: 8px;">Удалить</button>
              </form>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <form class="admin-form" method="post" enctype="multipart/form-data" style="margin-top: 20px;">
      <?= Csrf::field() ?>
      <input type="hidden" name="sku" value="<?= admin_h($sku) ?>" />
      <input type="hidden" name="action" value="upload_images" />
      <div class="admin-field">
        <label for="photos">Загрузить фото (только WebP)</label>
        <input id="photos" type="file" name="photos[]" accept="image/webp,.webp" multiple required />
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label for="upload_alt">Подпись (для всех новых)</label>
          <input id="upload_alt" name="upload_alt" value="<?= admin_h((string) ($product['name'] ?? '')) ?>" />
        </div>
        <div class="admin-field">
          <label for="upload_type">Тип фото</label>
          <select id="upload_type" name="upload_type">
            <?php foreach (CatalogOptions::galleryTypes() as $value => $label): ?>
              <option value="<?= admin_h($value) ?>"><?= admin_h($label) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <button class="admin-btn" type="submit">Загрузить</button>
    </form>

    <?php if (!$isNewProduct): ?>
      <div class="admin-fieldset" style="margin-top: 20px; border: 1px solid rgba(42, 37, 32, 0.12); border-radius: 8px; padding: 16px;">
        <label class="admin-check">
          <input type="checkbox" id="product-is-new-cb" <?= ($product['isNew'] ?? false) ? 'checked' : '' ?> />
          Новинка
        </label>
        <label class="admin-check" style="display: block; margin-top: 8px;">
          <input type="checkbox" id="product-is-out-of-stock-cb" <?= ($product['isOutOfStock'] ?? false) ? 'checked' : '' ?> />
          Нет в наличии
        </label>
      </div>
    <?php endif; ?>

    <div class="admin-actions" style="margin-top: 16px;">
      <button class="admin-btn" type="submit" form="<?= admin_h($formId) ?>">Сохранить</button>
    </div>
  </div>
</section>
