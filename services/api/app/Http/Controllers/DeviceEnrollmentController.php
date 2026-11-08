<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceToken;
use App\Models\EnrollmentChallenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DeviceEnrollmentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (! config('familyguard.enrollment_enabled')) return response()->json(['message' => 'Device enrollment is not available.'], 503);
        $data = $request->validate([
            'challenge_id' => ['required', 'uuid'],
            'challenge_token' => ['required', 'regex:/\\A[0-9a-f]{64}\\z/'],
            'device_name' => ['required', 'string', 'max:100'],
            'platform' => ['required', Rule::in(['android', 'windows'])],
            'public_key' => ['required', 'string', 'max:8192'],
            'signature' => ['required', 'string', 'max:8192'],
            'owner_approved' => ['required', 'accepted'],
        ]);
        $key = openssl_pkey_get_public($data['public_key']);
        $details = $key ? openssl_pkey_get_details($key) : false;
        $signature = base64_decode($data['signature'], true);
        if (! $details || $details['type'] !== OPENSSL_KEYTYPE_RSA || $details['bits'] < 2048 || $details['bits'] > 4096 || $signature === false || openssl_verify($data['challenge_id'].':'.$data['challenge_token'], $signature, $key, OPENSSL_ALGO_SHA256) !== 1) {
            return response()->json(['message' => 'Invalid enrollment request.'], 422);
        }
        $secret = bin2hex(random_bytes(32));
        $result = DB::transaction(function () use ($data, $secret) {
            // The conditional update consumes the challenge once, even for concurrent requests.
            $claimed = EnrollmentChallenge::query()->whereKey($data['challenge_id'])
                ->where('token_hash', hash('sha256', $data['challenge_token']))
                ->whereNull('used_at')->whereNull('revoked_at')->where('expires_at', '>', now())
                ->update(['used_at' => now(), 'updated_at' => now()]);
            if ($claimed !== 1) return null;
            $challenge = EnrollmentChallenge::findOrFail($data['challenge_id']);
            $device = Device::create(['owner_id' => $challenge->user_id, 'device_name' => $data['device_name'], 'platform' => $data['platform'], 'public_key' => $data['public_key'], 'enrollment_status' => 'active']);
            DeviceToken::create(['device_id' => $device->id, 'token_hash' => hash('sha256', $secret), 'expires_at' => now()->addDays(30)]);
            return $device;
        });
        if (! $result) return response()->json(['message' => 'Invalid or expired enrollment challenge.'], 422);
        return response()->json(['device_id' => $result->id, 'device_token' => $secret, 'expires_at' => now()->addDays(30)->toISOString()], 201)->header('Cache-Control', 'no-store');
    }
}
