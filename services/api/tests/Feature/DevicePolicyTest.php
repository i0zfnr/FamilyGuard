<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\DeviceTelemetry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DevicePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_cross_tenant_isolation_on_device_endpoints(): void
    {
        $tenantA = User::factory()->create();
        $tenantB = User::factory()->create();

        $deviceA = Device::create([
            'owner_id' => $tenantA->id,
            'device_name' => "Tenant A's Device",
            'platform' => 'android',
            'public_key' => 'fake-key-a',
            'enrollment_status' => 'active',
        ]);

        $deviceB = Device::create([
            'owner_id' => $tenantB->id,
            'device_name' => "Tenant B's Device",
            'platform' => 'windows',
            'public_key' => 'fake-key-b',
            'enrollment_status' => 'active',
        ]);

        DeviceTelemetry::create([
            'device_id' => $deviceA->id,
            'battery_percentage' => 95,
            'network_type' => 'wifi',
            'recorded_at' => now(),
        ]);

        DeviceTelemetry::create([
            'device_id' => $deviceB->id,
            'battery_percentage' => 42,
            'network_type' => 'cellular',
            'recorded_at' => now(),
        ]);

        // 1. Tenant B viewing Tenant A's device -> 403 Forbidden
        $this->actingAs($tenantB)->getJson('/api/v1/devices/'.$deviceA->id)->assertForbidden();

        // 2. Tenant B viewing Tenant A's telemetry -> 403 Forbidden
        $this->actingAs($tenantB)->getJson('/api/v1/devices/'.$deviceA->id.'/telemetry')->assertForbidden();

        // 3. Tenant B revoking Tenant A's device -> 403 Forbidden
        $this->actingAs($tenantB)->postJson('/api/v1/devices/'.$deviceA->id.'/revoke')->assertForbidden();

        // 4. Tenant A viewing Tenant B's device -> 403 Forbidden
        $this->actingAs($tenantA)->getJson('/api/v1/devices/'.$deviceB->id)->assertForbidden();

        // 5. Tenant A viewing Tenant B's telemetry -> 403 Forbidden
        $this->actingAs($tenantA)->getJson('/api/v1/devices/'.$deviceB->id.'/telemetry')->assertForbidden();

        // 6. Tenant A revoking Tenant B's device -> 403 Forbidden
        $this->actingAs($tenantA)->postJson('/api/v1/devices/'.$deviceB->id.'/revoke')->assertForbidden();

        // 7. Legitimate access by owner
        $this->actingAs($tenantA)->getJson('/api/v1/devices/'.$deviceA->id)->assertOk()->assertJsonPath('device.id', $deviceA->id);
        $this->actingAs($tenantA)->getJson('/api/v1/devices/'.$deviceA->id.'/telemetry')->assertOk()->assertJsonPath('data.0.battery_percentage', 95);
        $this->actingAs($tenantA)->postJson('/api/v1/devices/'.$deviceA->id.'/revoke')->assertOk();

        // 8. Device list only returns owned devices
        $listRes = $this->actingAs($tenantB)->getJson('/api/v1/devices')->assertOk();
        $this->assertCount(1, $listRes->json('data'));
        $this->assertSame($deviceB->id, $listRes->json('data.0.id'));
    }
}
