<?php

namespace Tests\Feature;

use App\Models\EnrollmentChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_authenticated_user_can_create_expiring_hashed_challenge(): void
    {
        $this->postJson('/api/v1/devices/enrollment-challenges')->assertUnauthorized();
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/v1/devices/enrollment-challenges')->assertCreated()->assertHeader('Cache-Control', 'no-store, private')->assertJsonPath('enrollment_available', true);
        $token = $response->json('token');
        $this->assertSame(64, strlen($token));
        $challenge = EnrollmentChallenge::findOrFail($response->json('id'));
        $this->assertSame(hash('sha256', $token), $challenge->token_hash);
        $this->assertSame($user->id, $challenge->user_id);
        $this->assertTrue($challenge->expires_at->between(now()->addMinutes(4), now()->addMinutes(5)));
        $this->assertNull($challenge->used_at);
    }

    public function test_only_owner_can_revoke_challenge(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $id = $this->actingAs($owner)->postJson('/api/v1/devices/enrollment-challenges')->json('id');
        $this->actingAs($other)->deleteJson('/api/v1/devices/enrollment-challenges/'.$id)->assertNotFound();
        $this->actingAs($owner)->deleteJson('/api/v1/devices/enrollment-challenges/'.$id)->assertOk();
        $this->assertNotNull(EnrollmentChallenge::findOrFail($id)->revoked_at);
    }
}
