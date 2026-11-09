<?php

namespace Tests\Feature;

use App\Models\DeviceToken;
use App\Models\EnrollmentChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CryptographicEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['familyguard.enrollment_enabled' => true]);
    }

    private function generateRsaKey(int $bits = 2048): array
    {
        $key = openssl_pkey_new([
            'private_key_bits' => $bits,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);
        $details = openssl_pkey_get_details($key);

        return [$key, $details['key']];
    }

    public function test_rejects_sub_2048_bit_rsa_keys(): void
    {
        $user = User::factory()->create();
        $challenge = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->json();

        // Generate 1024-bit key (insecure)
        [$key, $publicKeyPem] = $this->generateRsaKey(1024);
        openssl_sign($challenge['id'].':'.$challenge['token'], $signature, $key, OPENSSL_ALGO_SHA256);

        $response = $this->postJson('/api/v1/devices/enroll', [
            'challenge_id' => $challenge['id'],
            'challenge_token' => $challenge['token'],
            'device_name' => 'Weak Key Phone',
            'platform' => 'android',
            'public_key' => $publicKeyPem,
            'signature' => base64_encode($signature),
            'owner_approved' => true,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('devices', ['device_name' => 'Weak Key Phone']);
    }

    public function test_rejects_invalid_or_mismatched_rsa_signature(): void
    {
        $user = User::factory()->create();
        $challenge = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->json();

        [$key, $publicKeyPem] = $this->generateRsaKey(2048);

        // Sign incorrect data (inverted)
        openssl_sign($challenge['token'].':'.$challenge['id'], $badSignature, $key, OPENSSL_ALGO_SHA256);

        $response = $this->postJson('/api/v1/devices/enroll', [
            'challenge_id' => $challenge['id'],
            'challenge_token' => $challenge['token'],
            'device_name' => 'Bad Sig Phone',
            'platform' => 'android',
            'public_key' => $publicKeyPem,
            'signature' => base64_encode($badSignature),
            'owner_approved' => true,
        ]);

        $response->assertStatus(422);
    }

    public function test_atomic_single_use_replay_prevention(): void
    {
        $user = User::factory()->create();
        $challenge = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->json();

        [$key, $publicKeyPem] = $this->generateRsaKey(2048);
        openssl_sign($challenge['id'].':'.$challenge['token'], $signature, $key, OPENSSL_ALGO_SHA256);

        $payload = [
            'challenge_id' => $challenge['id'],
            'challenge_token' => $challenge['token'],
            'device_name' => 'Legit Phone',
            'platform' => 'android',
            'public_key' => $publicKeyPem,
            'signature' => base64_encode($signature),
            'owner_approved' => true,
        ];

        // First attempt succeeds
        $res1 = $this->postJson('/api/v1/devices/enroll', $payload)->assertCreated();
        $deviceToken = $res1->json('device_token');

        // Verify token is 256-bit (64 hex characters)
        $this->assertSame(64, strlen($deviceToken));
        $this->assertMatchesRegularExpression('/\A[0-9a-f]{64}\z/', $deviceToken);

        // Verify stored as SHA-256 hash at rest, never plaintext
        $dbToken = DeviceToken::where('device_id', $res1->json('device_id'))->firstOrFail();
        $this->assertSame(hash('sha256', $deviceToken), $dbToken->token_hash);

        // Replay of the exact same payload must be rejected
        $this->postJson('/api/v1/devices/enroll', $payload)->assertStatus(422);

        // Verify challenge record was atomically marked used
        $challengeRecord = EnrollmentChallenge::findOrFail($challenge['id']);
        $this->assertNotNull($challengeRecord->used_at);
    }

    public function test_accepts_enrollment_approved_field_alias(): void
    {
        $user = User::factory()->create();
        $challenge = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->json();

        [$key, $publicKeyPem] = $this->generateRsaKey(2048);
        openssl_sign($challenge['id'].':'.$challenge['token'], $signature, $key, OPENSSL_ALGO_SHA256);

        // Using enrollment_approved per PROJECT.md interface contract
        $response = $this->postJson('/api/v1/devices/enroll', [
            'challenge_id' => $challenge['id'],
            'challenge_token' => $challenge['token'],
            'device_name' => 'Alias Approved Phone',
            'platform' => 'windows',
            'public_key' => $publicKeyPem,
            'signature' => base64_encode($signature),
            'enrollment_approved' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('devices', ['device_name' => 'Alias Approved Phone', 'platform' => 'windows']);
    }
}
