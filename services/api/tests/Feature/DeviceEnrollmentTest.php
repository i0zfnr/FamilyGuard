<?php
namespace Tests\Feature;
use App\Models\Device;
use App\Models\DeviceToken;
use App\Models\EnrollmentChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class DeviceEnrollmentTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); config(['familyguard.enrollment_enabled' => true]); }
    private function payload(array $challenge): array
    {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_sign($challenge['id'].':'.$challenge['token'], $signature, $key, OPENSSL_ALGO_SHA256);
        return ['challenge_id' => $challenge['id'], 'challenge_token' => $challenge['token'], 'device_name' => 'Test phone', 'platform' => 'android', 'public_key' => openssl_pkey_get_details($key)['key'], 'signature' => base64_encode($signature), 'owner_approved' => true];
    }
    public function test_enrollment_is_disabled_by_default(): void
    {
        config(['familyguard.enrollment_enabled' => false]);
        $this->postJson('/api/v1/devices/enroll', [])->assertStatus(503);
    }
    public function test_enrollment_replay_heartbeat_and_revocation(): void
    {
        $owner = User::factory()->create(); $other = User::factory()->create();
        $challenge = $this->actingAs($owner)->postJson('/api/v1/devices/enrollment-challenges')->json();
        $payload = $this->payload($challenge);
        $response = $this->postJson('/api/v1/devices/enroll', $payload)->assertCreated();
        $id = $response->json('device_id'); $token = $response->json('device_token');
        $this->assertSame($owner->id, Device::findOrFail($id)->owner_id);
        $this->assertSame(hash('sha256', $token), DeviceToken::where('device_id', $id)->firstOrFail()->token_hash);
        $this->postJson('/api/v1/devices/enroll', $payload)->assertStatus(422);
        $this->withToken($token)->postJson('/api/v1/agent/heartbeat')->assertOk();
        $this->assertNotNull(Device::findOrFail($id)->last_seen_at);
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', ['battery_percentage' => 63, 'charging' => false, 'storage_total' => 1000, 'storage_available' => 400, 'network_type' => 'wifi'])->assertCreated();
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', ['battery_percentage' => 101])->assertUnprocessable();
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', ['storage_total' => 1, 'storage_available' => 2])->assertUnprocessable();
        $this->actingAs($other)->getJson('/api/v1/devices/'.$id.'/telemetry')->assertNotFound();
        $this->actingAs($owner)->getJson('/api/v1/devices/'.$id.'/telemetry')->assertOk()->assertJsonPath('data.0.battery_percentage', 63);

        $this->actingAs($other)->postJson('/api/v1/devices/'.$id.'/revoke')->assertNotFound();
        $this->actingAs($owner)->postJson('/api/v1/devices/'.$id.'/revoke')->assertOk();
        $this->withToken($token)->postJson('/api/v1/agent/heartbeat')->assertUnauthorized();
        $this->withToken($token)->postJson('/api/v1/agent/telemetry', ['battery_percentage' => 50])->assertUnauthorized();
    }
    public function test_invalid_proof_expiration_and_revocation_are_rejected(): void
    {
        $owner = User::factory()->create();
        $challenge = $this->actingAs($owner)->postJson('/api/v1/devices/enrollment-challenges')->json();
        $payload = $this->payload($challenge);
        $invalid = $payload; $invalid['signature'] = base64_encode('wrong');
        $this->postJson('/api/v1/devices/enroll', $invalid)->assertStatus(422);
        $this->assertNull(EnrollmentChallenge::findOrFail($challenge['id'])->used_at);
        $invalid = $payload; $invalid['owner_approved'] = false;
        $this->postJson('/api/v1/devices/enroll', $invalid)->assertUnprocessable();
        EnrollmentChallenge::whereKey($challenge['id'])->update(['expires_at' => now()->subSecond()]);
        $this->postJson('/api/v1/devices/enroll', $payload)->assertStatus(422);
        EnrollmentChallenge::whereKey($challenge['id'])->update(['expires_at' => now()->addMinute(), 'revoked_at' => now()]);
        $this->postJson('/api/v1/devices/enroll', $payload)->assertStatus(422);
        $this->assertSame(0, Device::count());
    }
}
