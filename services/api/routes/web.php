<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceAgentController;
use App\Http\Controllers\EnrollmentChallengeController;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/api/v1/health', fn () => response()->json(['status' => 'ok']));
Route::get('/api/v1/csrf', fn (Request $request) => response()->json(['csrf_token' => $request->session()->token()]));
Route::post('/api/v1/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/api/v1/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware('auth')->group(function () {
    Route::get('/api/v1/auth/me', [AuthController::class, 'me']);
    Route::post('/api/v1/auth/logout', [AuthController::class, 'logout']);
    Route::post('/api/v1/devices/enrollment-challenges', [EnrollmentChallengeController::class, 'store'])->middleware('throttle:5,1');
    Route::delete('/api/v1/devices/enrollment-challenges/{challenge}', [EnrollmentChallengeController::class, 'destroy']);
    Route::get('/api/v1/devices', fn (Request $request) => Device::query()->where('owner_id', $request->user()->id)->orderBy('device_name')->paginate(20));
    Route::get('/api/v1/devices/{device}/telemetry', [DeviceAgentController::class, 'history']);
    Route::post('/api/v1/devices/{device}/revoke', [DeviceAgentController::class, 'revoke']);
    Route::get('/api/v1/devices/{device}', function (Request $request, Device $device) {
        abort_unless($device->owner_id === $request->user()->id, 404);
        return response()->json(['device' => $device]);
    });
});
