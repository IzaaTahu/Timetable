<?php

define('BASE_PATH', __DIR__);
define('BASE_URL',  rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/'));

require_once BASE_PATH . '/config/credentials.php';
require_once BASE_PATH . '/core/Router.php';
require_once BASE_PATH . '/core/Controller.php';

function url(string $path = ''): string {
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    $path = ltrim($path, '/');
    return $path ? "$base/$path" : "$base/";
}

session_start();

// ── Router ────────────────────────────────────────────────────
$router = new Router();

// Halaman utama
$router->get('/', 'TimetableController', 'index');

// Radar page
$router->get('/radar',                  'RadarController',     'index');
$router->get('/api/radar',              'RadarController',     'apiRadar');

// JSON API endpoints (dipanggil dari JS)
$router->get('/api/schedules',          'TimetableController', 'apiSchedules');
$router->get('/api/exclusive/:code',    'TimetableController', 'apiExclusive');

// ── Dispatch ──────────────────────────────────────────────────
$router->dispatch();
