<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class DeviceTelemetry extends Model
{
    protected $table = 'device_telemetry';
    public $timestamps = false;
    protected $guarded = ['id'];
    protected function casts(): array { return ['charging' => 'boolean', 'recorded_at' => 'datetime']; }
}
