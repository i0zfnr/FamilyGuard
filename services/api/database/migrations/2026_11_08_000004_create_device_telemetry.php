<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_telemetry', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('device_id')->constrained('devices')->cascadeOnDelete();
            $table->unsignedTinyInteger('battery_percentage')->nullable();
            $table->boolean('charging')->nullable();
            $table->unsignedBigInteger('storage_total')->nullable();
            $table->unsignedBigInteger('storage_available')->nullable();
            $table->string('network_type', 32)->nullable();
            $table->timestamp('recorded_at');
            $table->index(['device_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_telemetry');
    }
};
