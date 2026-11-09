<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\DeviceTelemetry;
use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TelemetryIngestionTest extends TestCase
{
    use RefreshDatabase;

    private function createDeviceWithToken(): array
    {
        $owner = User::factory()->create();
        $device = Device::create([
            'owner_id' => $owner->id,
            'device_name' => 'Telemetry Phone',
            'platform' => 'android',
            'public_key' => 'fake-pubkey',
            'enrollment_status' => 'active',
        ]);

        $plainToken = bin2hex(random_bytes(32));
        DeviceToken::create([
            'device_id' => $device->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(30),
        ]);

        return [$owner, $device, $plainToken];
    }

    public function test_telemetry_ingestion_and_response_contract(): void
    {
        [$owner, $device, $token] = $this->createDeviceWithToken();

        $response = $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
            'battery_percentage' => 85,
            'charging' => true,
            'storage_total' => 68719476736,
            'storage_available' => 34359738368,
            'network_type' => 'wifi',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'ingested')
            ->assertJsonStructure(['status', 'id', 'recorded_at']);

        $this->assertDatabaseHas('device_telemetry', [
            'device_id' => $device->id,
            'battery_percentage' => 85,
            'charging' => 1,
            'storage_total' => 68719476736,
            'storage_available' => 34359738368,
            'network_type' => 'wifi',
        ]);
    }

    public function test_telemetry_validates_network_types_and_bounds(): void
    {
        [$owner, $device, $token] = $this->createDeviceWithToken();

        // Valid network types
        foreach (['wifi', 'cellular', 'ethernet', 'none', 'other'] as $netType) {
            $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
                'battery_percentage' => 50,
                'network_type' => $netType,
            ])->assertCreated();
        }

        // Invalid network type
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
            'battery_percentage' => 50,
            'network_type' => 'bluetooth',
        ])->assertUnprocessable();

        // Battery bounds
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
            'battery_percentage' => -1,
        ])->assertUnprocessable();

        $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
            'battery_percentage' => 101,
        ])->assertUnprocessable();

        // Storage bounds
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', [
            'storage_total' => 500,
            'storage_available' => 501,
        ])->assertUnprocessable();
    }

    public function test_telemetry_history_retrieval_with_limit_and_scoping(): void
    {
        [$owner, $device, $token] = $this->createDeviceWithToken();
        $otherUser = User::factory()->create();

        // Create 10 telemetry points
        for ($i = 1; $i <= 10; $i++) {
            DeviceTelemetry::create([
                'device_id' => $device->id,
                'battery_percentage' => $i * 10,
                'charging' => $i % 2 === 0,
                'network_type' => 'wifi',
                'recorded_at' => now()->subMinutes(10 - $i),
            ]);
        }

        // Owner retrieves with limit=5
        $res = $this->actingAs($owner)->getJson('/api/v1/devices/'.$device->id.'/telemetry?limit=5')->assertOk();
        $data = $res->json('data');
        $this->assertCount(5, $data);
        // Most recent should be first
        $this->assertSame(100, $data[0]['battery_percentage']);

        // Cross-tenant user forbidden
        $this->actingAs($otherUser)->getJson('/api/v1/devices/'.$device->id.'/telemetry?limit=5')->assertForbidden();
    }

    public function test_heartbeat_response_contract_and_last_seen(): void
    {
        [$owner, $device, $token] = $this->createDeviceWithToken();

        $res = $this->withToken($token)->postJson('/api/v1/agent/heartbeat')->assertOk();
        $res->assertJsonPath('status', 'acknowledged')
            ->assertJsonStructure(['status', 'server_time']);

        $device->refresh();
        $this->assertNotNull($device->last_seen_at);
    }
}
