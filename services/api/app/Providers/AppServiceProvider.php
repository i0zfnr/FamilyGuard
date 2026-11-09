<?php

namespace App\Providers;

use App\Models\Device;
use App\Policies\DevicePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Device::class, DevicePolicy::class);

        RateLimiter::for('auth', function (Request $request) {
            $key = ($request->input('email') ?: 'guest').'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });

        RateLimiter::for('enrollment-challenge', function (Request $request) {
            $key = ($request->user()?->id ?? 'guest').'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });

        RateLimiter::for('device-enroll', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('agent-heartbeat', function (Request $request) {
            $token = $request->bearerToken();
            $key = ($token ? hash('sha256', $token) : 'guest').'|'.$request->ip();

            return Limit::perMinute(60)->by($key);
        });

        RateLimiter::for('agent-telemetry', function (Request $request) {
            $token = $request->bearerToken();
            $key = ($token ? hash('sha256', $token) : 'guest').'|'.$request->ip();

            return Limit::perMinute(60)->by($key);
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
