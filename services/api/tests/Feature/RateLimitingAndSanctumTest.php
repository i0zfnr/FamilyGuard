<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingAndSanctumTest extends TestCase
{
    use RefreshDatabase;

    public function test_csrf_token_endpoint_returns_token(): void
    {
        $response = $this->getJson('/api/v1/csrf');
        $response->assertOk()->assertJsonStructure(['csrf_token']);
        $this->assertNotEmpty($response->json('csrf_token'));
    }

    public function test_sanctum_bearer_token_authenticates_protected_endpoints(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-bearer-token')->plainTextToken;

        // Access /api/v1/auth/me with Sanctum Bearer token
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk();

        $response->assertJsonPath('user.id', $user->id);

        // Create a device for this user
        Device::create([
            'owner_id' => $user->id,
            'device_name' => 'Sanctum Device',
            'platform' => 'android',
            'public_key' => 'fake-key',
        ]);

        // Access /api/v1/devices with Sanctum Bearer token
        $devicesRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/devices')
            ->assertOk();

        $this->assertCount(1, $devicesRes->json('data'));
        $this->assertSame('Sanctum Device', $devicesRes->json('data.0.device_name'));
    }

    public function test_auth_rate_limiting_throttles_excessive_attempts(): void
    {
        // 5 requests allowed per minute for auth
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'spam@example.com',
                'password' => 'wrong',
            ]);
        }

        // 6th attempt must be throttled with 429 Too Many Requests
        $this->postJson('/api/v1/auth/login', [
            'email' => 'spam@example.com',
            'password' => 'wrong',
        ])->assertStatus(429);
    }

    public function test_enrollment_challenge_rate_limiting(): void
    {
        $user = User::factory()->create();

        // 5 requests allowed per minute for challenges
        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->assertCreated();
        }

        // 6th attempt must be throttled with 429 Too Many Requests
        $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->assertStatus(429);
    }
}
