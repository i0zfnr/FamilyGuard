<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

$apiPath = dirname(__DIR__);
$projectPath = dirname($apiPath, 2);

return Application::configure(basePath: $apiPath)
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create()
    ->useConfigPath($apiPath.'/config')
    ->useBootstrapPath($projectPath.'/bootstrap')
    ->useDatabasePath($apiPath.'/database')
    ->usePublicPath($projectPath.'/public')
    ->useStoragePath($projectPath.'/storage');
