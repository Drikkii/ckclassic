<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::requireLogin();

$repo = new SliderRepository(admin_pdo());
$exporter = new SliderExporter($repo);
$siteRoot = admin_site_root();
$uploader = new SliderImageUploader($siteRoot);

$repo->ensureTable();

function admin_publish_slider(SliderRepository $repo, SliderExporter $exporter, string $siteRoot, string $successMessage): void
{
    try {
        $count = SliderHelper::publishSlider($repo, $exporter, $siteRoot);
        admin_flash($successMessage . " На сайте: {$count} слайдов.");
    } catch (Throwable $e) {
        admin_flash(
            'Данные сохранены в базе, но файл slider-data.js не обновился: ' . $e->getMessage(),
            'error',
        );
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::requireValid($_POST['_csrf'] ?? null);
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'seed_defaults') {
        $added = $repo->seedDefaultsIfEmpty();
        if ($added > 0) {
            admin_publish_slider($repo, $exporter, $siteRoot, "Добавлено слайдов по умолчанию: {$added}.");
        } else {
            admin_flash('Слайды уже есть — импорт не выполнен.', 'error');
        }
        admin_redirect('slider.php');
    }

    if ($action === 'delete_slide') {
        $id = (int) ($_POST['slide_id'] ?? 0);
        $slide = $repo->find($id);
        if ($slide) {
            SliderHelper::deleteImageFile($siteRoot, (string) $slide['image_src']);
            $repo->delete($id);
            admin_publish_slider($repo, $exporter, $siteRoot, 'Слайд удалён.');
        }
        admin_redirect('slider.php');
    }

    if ($action === 'upload_slide') {
        if (empty($_FILES['photo'])) {
            admin_flash('Выберите файл WebP для загрузки.', 'error');
            admin_redirect('slider.php');
        }

        try {
            $src = $uploader->upload(
                $_FILES['photo'],
                trim((string) ($_POST['image_alt'] ?? ''))
            );
            if ($src === null) {
                admin_flash('Файл не был загружен.', 'error');
            } else {
                $repo->create([
                    'image_src' => $src,
                    'image_alt' => trim((string) ($_POST['image_alt'] ?? '')),
                    'title' => trim((string) ($_POST['title'] ?? '')),
                    'subtitle' => trim((string) ($_POST['subtitle'] ?? '')),
                    'use_h1' => !empty($_POST['use_h1']),
                    'is_active' => true,
                ]);
                admin_publish_slider($repo, $exporter, $siteRoot, 'Слайд добавлен.');
            }
        } catch (Throwable $e) {
            admin_flash($e->getMessage(), 'error');
        }
        admin_redirect('slider.php');
    }

    if ($action === 'save_slides') {
        $orderCsv = trim((string) ($_POST['slide_order'] ?? ''));
        $orderedIds = $orderCsv !== ''
            ? array_values(array_filter(array_map('intval', explode(',', $orderCsv))))
            : [];

        if (!$orderedIds) {
            $orderedIds = array_map(
                static fn (array $slide): int => (int) $slide['id'],
                $repo->all()
            );
        }

        if ($orderedIds) {
            $repo->reorder($orderedIds);
        }

        foreach ($orderedIds as $id) {
            if ($id <= 0 || !$repo->find($id)) {
                continue;
            }
            $repo->update($id, SliderHelper::slideDataFromPost($_POST, $id));
        }

        admin_publish_slider($repo, $exporter, $siteRoot, 'Слайдер сохранён.');
        admin_redirect('slider.php');
    }
}

$slides = $repo->all();
$slideOrder = implode(',', array_map(static fn (array $s): string => (string) $s['id'], $slides));

$adminSection = 'slider';
$pageTitle = 'Слайдер';
ob_start();
?>
<section class="admin-card">
  <div class="admin-actions" style="margin-bottom: 16px;">
    <h1 class="admin-title" style="margin: 0;">Слайдер главной страницы</h1>
    <a class="admin-btn admin-btn--secondary" href="../index.html" target="_blank" rel="noopener">Открыть сайт</a>
  </div>
  <p class="admin-subtitle">
    Перетащите слайды для смены порядка. Первый слайд показывается сразу при открытии сайта.
    После изменения подписей нажмите «Сохранить порядок и подписи». Формат фото: только WebP.
  </p>

  <?php if (!$slides): ?>
    <p class="admin-muted" style="margin-bottom: 16px;">Слайдов пока нет.</p>
    <form method="post" style="margin-bottom: 20px;">
      <?= Csrf::field() ?>
      <input type="hidden" name="action" value="seed_defaults" />
      <button class="admin-btn" type="submit">Импортировать текущие слайды с сайта</button>
    </form>
  <?php else: ?>
    <form class="admin-form" method="post" id="slider-edit-form">
      <?= Csrf::field() ?>
      <input type="hidden" name="action" value="save_slides" />
      <input type="hidden" name="slide_order" value="<?= admin_h($slideOrder) ?>" data-slide-order />

      <div class="admin-slider-list admin-gallery--sortable" data-admin-slider>
        <?php foreach ($slides as $slide): ?>
          <?php $id = (int) $slide['id']; ?>
          <article class="admin-slider-item" data-slide-item data-slide-id="<?= $id ?>" draggable="true">
            <div class="admin-slider-item__preview">
              <img src="<?= admin_h(SliderHelper::adminImageUrl((string) $slide['image_src'])) ?>" alt="" />
              <span class="admin-slider-item__drag" aria-hidden="true">⋮⋮</span>
            </div>
            <div class="admin-slider-item__fields">
              <div class="admin-field">
                <label for="alt_<?= $id ?>">Подпись к фото (alt)</label>
                <input id="alt_<?= $id ?>" name="alt_<?= $id ?>" value="<?= admin_h((string) $slide['image_alt']) ?>" />
              </div>
              <div class="admin-field">
                <label for="title_<?= $id ?>">Заголовок</label>
                <input id="title_<?= $id ?>" name="title_<?= $id ?>" value="<?= admin_h((string) $slide['title']) ?>" />
              </div>
              <div class="admin-field">
                <label for="subtitle_<?= $id ?>">Подзаголовок</label>
                <input id="subtitle_<?= $id ?>" name="subtitle_<?= $id ?>" value="<?= admin_h((string) $slide['subtitle']) ?>" />
              </div>
              <label class="admin-check">
                <input type="hidden" name="use_h1_<?= $id ?>" value="0" />
                <input type="checkbox" name="use_h1_<?= $id ?>" value="1" <?= !empty($slide['use_h1']) ? 'checked' : '' ?> />
                Заголовок как H1 (для SEO на главном слайде)
              </label>
              <label class="admin-check" style="margin-top: 8px;">
                <input type="hidden" name="is_active_<?= $id ?>" value="0" />
                <input type="checkbox" name="is_active_<?= $id ?>" value="1" <?= !empty($slide['is_active']) ? 'checked' : '' ?> />
                Показывать на сайте
              </label>
              <button class="admin-btn admin-btn--danger" type="submit" form="delete-slide-<?= $id ?>" style="width: 100%; margin-top: 12px;">Удалить слайд</button>
            </div>
          </article>
        <?php endforeach; ?>
      </div>

      <div class="admin-actions" style="margin-top: 20px;">
        <button class="admin-btn" type="submit">Сохранить порядок и подписи</button>
      </div>
    </form>

    <?php foreach ($slides as $slide): ?>
      <?php $id = (int) $slide['id']; ?>
      <form id="delete-slide-<?= $id ?>" method="post" onsubmit="return confirm('Удалить этот слайд?');" hidden>
        <?= Csrf::field() ?>
        <input type="hidden" name="action" value="delete_slide" />
        <input type="hidden" name="slide_id" value="<?= $id ?>" />
      </form>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<section class="admin-card">
  <h2 class="admin-title" style="font-size: 1.2rem;">Добавить слайд</h2>
  <form class="admin-form" method="post" enctype="multipart/form-data">
    <?= Csrf::field() ?>
    <input type="hidden" name="action" value="upload_slide" />
    <div class="admin-form-grid">
      <div class="admin-field">
        <label for="photo">Фото (WebP)</label>
        <input id="photo" type="file" name="photo" accept="image/webp,.webp" required />
      </div>
      <div class="admin-field">
        <label for="image_alt">Подпись к фото (alt)</label>
        <input id="image_alt" name="image_alt" />
      </div>
      <div class="admin-field">
        <label for="title">Заголовок</label>
        <input id="title" name="title" />
      </div>
      <div class="admin-field">
        <label for="subtitle">Подзаголовок</label>
        <input id="subtitle" name="subtitle" />
      </div>
    </div>
    <label class="admin-check">
      <input type="checkbox" name="use_h1" value="1" />
      Заголовок как H1
    </label>
    <div class="admin-actions" style="margin-top: 16px;">
      <button class="admin-btn" type="submit">Загрузить слайд</button>
    </div>
  </form>
</section>
<?php
$content = ob_get_clean();
require __DIR__ . '/_layout.php';
