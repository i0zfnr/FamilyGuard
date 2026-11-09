<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(12)],
        ]);
        $user = User::create($data)->refresh();
        Auth::login($user);
        $request->session()->regenerate();

        AuditLog::record(
            eventType: 'auth.register',
            userId: $user->id,
            request: $request,
            payload: ['email' => $user->email, 'role' => $user->role]
        );

        return response()->json(['user' => $this->publicUser($user)], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        if (! Auth::attempt($credentials)) {
            AuditLog::record(
                eventType: 'auth.login_failed',
                userId: null,
                request: $request,
                payload: ['email' => $credentials['email']]
            );

            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        $request->session()->regenerate();
        $user = $request->user();

        AuditLog::record(
            eventType: 'auth.login',
            userId: $user->id,
            request: $request,
            payload: ['email' => $user->email]
        );

        return response()->json(['user' => $this->publicUser($user)]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->publicUser($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            AuditLog::record(
                eventType: 'auth.logout',
                userId: $user->id,
                request: $request
            );
        }

        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    private function publicUser(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'mfa_enabled']);
    }
}
