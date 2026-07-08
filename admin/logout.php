<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::logout();
admin_redirect('login.php');
