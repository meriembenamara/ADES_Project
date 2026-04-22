<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserManagementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::query()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $validated['email'] = Str::lower($validated['email']);
        $validated['password'] = Hash::make($validated['password']);

        $user = User::query()->create($validated);

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'string', 'email:rfc', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
        ]);

        if (isset($validated['email'])) {
            $validated['email'] = Str::lower($validated['email']);
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([], 204);
    }
}
