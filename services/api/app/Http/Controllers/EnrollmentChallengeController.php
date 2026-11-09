<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\EnrollmentChallenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentChallengeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // High-entropy secrets are hashed at rest and returned only once.
        $token = bin2hex(random_bytes(32));
        $challenge = EnrollmentChallenge::create([
            'user_id' => $request->user()->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addMinutes(5),
        ]);

        AuditLog::record(
            eventType: 'challenge.issued',
            userId: $request->user()->id,
            request: $request,
            payload: [
                'challenge_id' => $challenge->id,
                'expires_at' => $challenge->expires_at->toISOString(),
            ]
        );

        return response()->json([
            'id' => $challenge->id,
            'token' => $token,
            'expires_at' => $challenge->expires_at->toISOString(),
            'enrollment_available' => (bool) config('familyguard.enrollment_enabled'),
        ], 201)->header('Cache-Control', 'no-store');
    }

    public function destroy(Request $request, EnrollmentChallenge $challenge): JsonResponse
    {
        abort_unless($challenge->user_id === $request->user()->id, 404);
        if ($challenge->revoked_at === null) {
            $challenge->update(['revoked_at' => now()]);
        }

        AuditLog::record(
            eventType: 'challenge.revoked',
            userId: $request->user()->id,
            request: $request,
            payload: ['challenge_id' => $challenge->id]
        );

        return response()->json(['message' => 'Challenge revoked.']);
    }
}
