<?php

use App\Models\DeviceTelemetry;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('familyguard:prune-telemetry', function () {
    $count = DeviceTelemetry::where('recorded_at', '<', now()->subDays(30))->delete();
    $this->info("Deleted {$count} expired telemetry records.");
})->purpose('Delete device telemetry older than 30 days');

Schedule::command('familyguard:prune-telemetry')->daily()->withoutOverlapping();
