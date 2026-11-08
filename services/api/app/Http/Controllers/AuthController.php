<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

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
        return response()->json(['user' => $this->publicUser($user)], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email', 'max:255'], 'password' => ['required', 'string', 'max:1024']]);
        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }
        $request->session()->regenerate();
        return response()->json(['user' => $this->publicUser($request->user())]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->publicUser($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Signed out.']);
    }

    private function publicUser(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'mfa_enabled']);
    }
}
