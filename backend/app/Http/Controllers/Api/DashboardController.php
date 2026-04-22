<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Dashboard::query()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive,archived'],
        ]);

        $dashboard = Dashboard::query()->create($validated);

        return response()->json($dashboard, 201);
    }

    public function show(Dashboard $dashboard): JsonResponse
    {
        return response()->json($dashboard);
    }

    public function update(Request $request, Dashboard $dashboard): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:active,inactive,archived'],
        ]);

        $dashboard->update($validated);

        return response()->json($dashboard->fresh());
    }

    public function destroy(Dashboard $dashboard): JsonResponse
    {
        $dashboard->delete();

        return response()->json([], 204);
    }
}
