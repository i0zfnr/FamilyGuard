<?php
namespace Tests\Feature;
use App\Models\Device;
use App\Models\DeviceTelemetry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class TelemetryRetentionTest extends TestCase
{
    use RefreshDatabase;
    public function test_pruning_removes_only_expired_records(): void
    {
        $user = User::factory()->create();
        $device = Device::create(['owner_id' => $user->id, 'device_name' => 'Phone', 'platform' => 'android', 'public_key' => 'key']);
        DeviceTelemetry::create(['device_id' => $device->id, 'battery_percentage' => 20, 'recorded_at' => now()->subDays(31)]);
        DeviceTelemetry::create(['device_id' => $device->id, 'battery_percentage' => 50, 'recorded_at' => now()->subDays(29)]);
        $this->artisan('familyguard:prune-telemetry')->assertSuccessful();
        $this->assertDatabaseCount('device_telemetry', 1);
        $this->assertDatabaseHas('device_telemetry', ['battery_percentage' => 50]);
    }
}
