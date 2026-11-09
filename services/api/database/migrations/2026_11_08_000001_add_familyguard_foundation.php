<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('device_owner');
            $table->boolean('mfa_enabled')->default(false);
        });
        Schema::create('devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->string('device_name');
            $table->string('platform');
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('os_version')->nullable();
            $table->string('agent_version')->nullable();
            $table->text('public_key');
            $table->string('enrollment_status')->default('pending');
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();
            $table->index(['owner_id', 'enrollment_status']);
        });
        Schema::create('device_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('permission_type');
            $table->boolean('enabled')->default(false);
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->unique(['device_id', 'user_id', 'permission_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_permissions');
        Schema::dropIfExists('devices');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'mfa_enabled']);
        });
    }
};
