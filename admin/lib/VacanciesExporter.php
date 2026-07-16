<?php

declare(strict_types=1);

final class VacanciesExporter
{
    public function __construct(private SitePageRepository $pages)
    {
    }

    public function write(string $siteRoot): void
    {
        $content = $this->pages->getBody('vacancies');
        $json = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Не удалось сформировать JSON для вакансий.');
        }

        $path = rtrim($siteRoot, '/\\') . DIRECTORY_SEPARATOR . 'vacancies-data.js';
        $fileContent = 'window.VACANCIES_CONTENT = ' . $json . ";\n";

        if (file_put_contents($path, $fileContent) === false) {
            throw new RuntimeException('Не удалось записать vacancies-data.js — проверьте права на папку сайта.');
        }
    }
}
