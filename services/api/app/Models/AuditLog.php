<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Enforce strict immutability: audit logs cannot be updated or deleted.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('Audit logs are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new \RuntimeException('Audit logs are immutable and cannot be deleted.');
        });
    }

    /**
     * Record an audit event.
     */
    public static function record(
        string $eventType,
        ?int $userId = null,
        ?string $deviceId = null,
        ?Request $request = null,
        array $payload = []
    ): self {
        $ip = $request ? $request->ip() : request()?->ip();
        $userAgent = $request ? $request->userAgent() : request()?->userAgent();

        return static::create([
            'event_type' => $eventType,
            'user_id' => $userId ?? (auth()->check() ? auth()->id() : null),
            'device_id' => $deviceId,
            'ip_address' => $ip,
            'user_agent' => $userAgent ? substr($userAgent, 0, 1024) : null,
            'payload' => empty($payload) ? null : $payload,
            'created_at' => now(),
        ]);
    }
}
