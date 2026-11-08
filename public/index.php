<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));
if (in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true) && parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) === '/') {
    header('Content-Type: text/html; charset=UTF-8');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        readfile(__DIR__.'/index.html');
    }

    return;
}
require __DIR__.'/../services/api/vendor/autoload.php';
/** @var Application $app */
$app = require __DIR__.'/../services/api/bootstrap/app.php';
$app->useEnvironmentPath(dirname(__DIR__));
$app->handleRequest(Request::capture());
