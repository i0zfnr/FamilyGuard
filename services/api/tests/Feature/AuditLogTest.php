<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['familyguard.enrollment_enabled' => true]);
    }

    public function test_auth_actions_record_audit_logs(): void
    {
        // 1. Register
        $regResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Audit User',
            'email' => 'audit@example.com',
            'password' => 'a strong secure passphrase 123',
            'password_confirmation' => 'a strong secure passphrase 123',
        ]);
        $regResponse->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.register',
            'user_id' => $regResponse->json('user.id'),
        ]);

        // 2. Failed login
        $this->postJson('/api/v1/auth/login', [
            'email' => 'audit@example.com',
            'password' => 'wrong-passphrase',
        ])->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.login_failed',
        ]);

        // 3. Successful login
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'audit@example.com',
            'password' => 'a strong secure passphrase 123',
        ])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.login',
            'user_id' => $loginResponse->json('user.id'),
        ]);

        // 4. Logout
        $this->postJson('/api/v1/auth/logout')->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.logout',
            'user_id' => $loginResponse->json('user.id'),
        ]);
    }

    public function test_challenge_and_device_actions_record_audit_logs(): void
    {
        $user = User::factory()->create();

        // 1. Challenge issued
        $challengeRes = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->assertCreated();
        $challengeId = $challengeRes->json('id');
        $challengeToken = $challengeRes->json('token');

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'challenge.issued',
            'user_id' => $user->id,
        ]);

        // 2. Device enrolled
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_sign($challengeId.':'.$challengeToken, $sig, $key, OPENSSL_ALGO_SHA256);

        $enrollRes = $this->postJson('/api/v1/devices/enroll', [
            'challenge_id' => $challengeId,
            'challenge_token' => $challengeToken,
            'device_name' => 'Audited Phone',
            'platform' => 'android',
            'public_key' => openssl_pkey_get_details($key)['key'],
            'signature' => base64_encode($sig),
            'owner_approved' => true,
        ])->assertCreated();

        $deviceId = $enrollRes->json('device_id');
        $deviceToken = $enrollRes->json('device_token');

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'device.enrolled',
            'user_id' => $user->id,
            'device_id' => $deviceId,
        ]);

        // 3. Heartbeat received
        $this->withToken($deviceToken)->postJson('/api/v1/agent/heartbeat')->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'heartbeat.received',
            'device_id' => $deviceId,
        ]);

        // 4. Telemetry ingested
        $this->withToken($deviceToken)->postJson('/api/v1/agent/telemetry', [
            'battery_percentage' => 88,
            'charging' => true,
            'network_type' => 'wifi',
        ])->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'telemetry.ingested',
            'device_id' => $deviceId,
        ]);

        // 5. Revocation
        $this->actingAs($user)->postJson('/api/v1/devices/'.$deviceId.'/revoke')->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'device.revoked',
            'user_id' => $user->id,
            'device_id' => $deviceId,
        ]);
    }

    public function test_audit_logs_are_strictly_immutable(): void
    {
        $log = AuditLog::record('test.event', null, null, null, ['key' => 'val']);
        $this->assertNotNull($log->id);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Audit logs are immutable and cannot be updated.');
        $log->update(['event_type' => 'tampered.event']);
    }

    public function test_audit_logs_cannot_be_deleted(): void
    {
        $log = AuditLog::record('test.event.2');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Audit logs are immutable and cannot be deleted.');
        $log->delete();
    }
}
