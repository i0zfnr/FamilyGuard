<?php

namespace App\Policies;

use App\Models\Device;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DevicePolicy
{
    /**
     * Determine whether the user can view any devices.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the device.
     */
    public function view(User $user, Device $device): Response
    {
        return $device->owner_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this device.');
    }

    /**
     * Determine whether the user can view telemetry of the device.
     */
    public function viewTelemetry(User $user, Device $device): Response
    {
        return $device->owner_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this device.');
    }

    /**
     * Determine whether the user can update the device.
     */
    public function update(User $user, Device $device): Response
    {
        return $device->owner_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this device.');
    }

    /**
     * Determine whether the user can revoke the device.
     */
    public function revoke(User $user, Device $device): Response
    {
        return $device->owner_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this device.');
    }

    /**
     * Determine whether the user can delete the device.
     */
    public function delete(User $user, Device $device): Response
    {
        return $device->owner_id === $user->id
            ? Response::allow()
            : Response::deny('You do not own this device.');
    }
}
