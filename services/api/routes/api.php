<?php

use App\Http\Controllers\DeviceAgentController;
use App\Http\Controllers\DeviceEnrollmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/devices/enroll', [DeviceEnrollmentController::class, 'store'])->middleware('throttle:device-enroll');
    Route::post('/agent/telemetry', [DeviceAgentController::class, 'telemetry'])->middleware('throttle:agent-telemetry');
    Route::post('/agent/heartbeat', [DeviceAgentController::class, 'heartbeat'])->middleware('throttle:agent-heartbeat');
});
