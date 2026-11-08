<?php

use App\Http\Controllers\DeviceAgentController;
use App\Http\Controllers\DeviceEnrollmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/devices/enroll', [DeviceEnrollmentController::class, 'store'])->middleware('throttle:10,1');
    Route::post('/agent/telemetry', [DeviceAgentController::class, 'telemetry'])->middleware('throttle:60,1');
    Route::post('/agent/heartbeat', [DeviceAgentController::class, 'heartbeat'])->middleware('throttle:60,1');
});
