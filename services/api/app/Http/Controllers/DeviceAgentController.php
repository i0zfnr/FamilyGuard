<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceToken;
use App\Models\DeviceTelemetry;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceAgentController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $device = $this->authenticateDevice($request);
        if (! $device) return response()->json(['message' => 'Unauthorized.'], 401);
        $device->forceFill(['last_seen_at' => now()])->save();
        return response()->json(['status' => 'ok']);
    }

    public function telemetry(Request $request): JsonResponse
    {
        $device = $this->authenticateDevice($request);
        if (! $device) return response()->json(['message' => 'Unauthorized.'], 401);
        $data = $request->validate([
            'battery_percentage' => ['nullable', 'integer', 'between:0,100'],
            'charging' => ['nullable', 'boolean'],
            'storage_total' => ['nullable', 'integer', 'min:0', 'max:9223372036854775807'],
            'storage_available' => ['nullable', 'integer', 'min:0', 'max:9223372036854775807'],
            'network_type' => ['nullable', Rule::in(['wifi', 'cellular', 'ethernet', 'none', 'other'])],
        ]);
        if (isset($data['storage_total'], $data['storage_available']) && $data['storage_available'] > $data['storage_total']) {
            return response()->json(['message' => 'Available storage cannot exceed total storage.'], 422);
        }
        if (count(array_filter($data, fn ($value) => $value !== null)) === 0) return response()->json(['message' => 'At least one measurement is required.'], 422);
        $record = DeviceTelemetry::create(array_merge($data, ['device_id' => $device->id, 'recorded_at' => now()]));
        return response()->json(['id' => $record->id, 'recorded_at' => $record->recorded_at->toISOString()], 201);
    }

    public function history(Request $request, Device $device): JsonResponse
    {
        abort_unless($device->owner_id === $request->user()->id, 404);
        return response()->json(DeviceTelemetry::where('device_id', $device->id)->orderByDesc('recorded_at')->orderByDesc('id')->paginate(20));
    }

    private function authenticateDevice(Request $request): ?Device
    {
        $token = $request->bearerToken();
        if (! is_string($token) || ! preg_match('/\A[0-9a-f]{64}\z/', $token)) return null;
        $credential = DeviceToken::query()->where('token_hash', hash('sha256', $token))->whereNull('revoked_at')->where('expires_at', '>', now())->first();
        return $credential ? Device::query()->whereKey($credential->device_id)->where('enrollment_status', 'active')->first() : null;
    }

    public function revoke(Request $request, Device $device): JsonResponse
    {
        abort_unless($device->owner_id === $request->user()->id, 404);
        DB::transaction(function () use ($device) {
            $device->forceFill(['enrollment_status' => 'revoked'])->save();
            DeviceToken::where('device_id', $device->id)->whereNull('revoked_at')->update(['revoked_at' => now()]);
            DB::table('device_permissions')->where('device_id', $device->id)->update(['enabled' => false, 'revoked_at' => now()]);
        });
        return response()->json(['message' => 'Device access revoked.']);
    }
}
