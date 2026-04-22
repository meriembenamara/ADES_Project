<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function signUp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)->mixedCase()->letters()->numbers()->symbols()],
        ]);

        $validated['email'] = Str::lower($validated['email']);
        $user = User::query()->create($validated);
        $issuedToken = $user->issueApiToken('sign-up');

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
            'access_token' => $issuedToken['id'].'|'.$issuedToken['plainTextToken'],
            'token_type' => 'Bearer',
            'expires_at' => $issuedToken['expiresAt']->toIso8601String(),
        ], 201);
    }

    public function signIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc'],
            'password' => ['required', 'string'],
        ]);

        $key = Str::lower($validated['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too many login attempts. Try again later.',
                'retry_after_seconds' => $seconds,
            ], 429);
        }

        $user = User::query()->where('email', Str::lower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($key, 60);

            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        RateLimiter::clear($key);
        $issuedToken = $user->issueApiToken('sign-in');

        return response()->json([
            'message' => 'Signed in successfully.',
            'user' => $user,
            'access_token' => $issuedToken['id'].'|'.$issuedToken['plainTextToken'],
            'token_type' => 'Bearer',
            'expires_at' => $issuedToken['expiresAt']->toIso8601String(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function signOut(Request $request): JsonResponse
    {
        $token = $request->attributes->get('api_token');
        $token?->delete();

        return response()->json([
            'message' => 'Signed out successfully.',
        ]);
    }

    public function signOutAll(Request $request): JsonResponse
    {
        $request->user()?->apiTokens()->delete();

        return response()->json([
            'message' => 'Signed out from all devices.',
        ]);
    }
}
