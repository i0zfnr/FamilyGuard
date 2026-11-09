<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_hashes_password_and_cannot_select_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'a strong passphrase', 'password_confirmation' => 'a strong passphrase', 'role' => 'system_admin']);
        $response->assertCreated()->assertJsonPath('user.role', 'device_owner');
        $user = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('a strong passphrase', $user->password));
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_logout_and_invalid_credentials(): void
    {
        $user = User::factory()->create(['password' => 'a strong passphrase']);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])->assertStatus(422);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'a strong passphrase'])->assertOk();
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_device_access_is_limited_to_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $device = Device::create(['owner_id' => $owner->id, 'device_name' => 'Phone', 'platform' => 'android', 'public_key' => 'test-key']);
        $this->getJson('/api/v1/devices')->assertUnauthorized();
        $this->actingAs($other)->getJson('/api/v1/devices')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($other)->getJson('/api/v1/devices/'.$device->id)->assertForbidden();
        $this->actingAs($owner)->getJson('/api/v1/devices')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.public_key');
    }
}
