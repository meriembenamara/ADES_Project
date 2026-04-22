<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ControlPoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlPointController extends Controller
{
    public function index(): JsonResponse
    {
        $controlPoints = ControlPoint::query()
            ->with(['document:id,title', 'assignee:id,name,email'])
            ->latest()
            ->get();

        return response()->json($controlPoints);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:todo,in_progress,done,blocked'],
            'due_date' => ['nullable', 'date'],
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $controlPoint = ControlPoint::query()->create($validated);

        return response()->json($controlPoint->load(['document:id,title', 'assignee:id,name,email']), 201);
    }

    public function show(ControlPoint $controlPoint): JsonResponse
    {
        return response()->json($controlPoint->load(['document:id,title', 'assignee:id,name,email']));
    }

    public function update(Request $request, ControlPoint $controlPoint): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:todo,in_progress,done,blocked'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'document_id' => ['sometimes', 'nullable', 'integer', 'exists:documents,id'],
            'assigned_to' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        $controlPoint->update($validated);

        return response()->json($controlPoint->fresh()->load(['document:id,title', 'assignee:id,name,email']));
    }

    public function destroy(ControlPoint $controlPoint): JsonResponse
    {
        $controlPoint->delete();

        return response()->json([], 204);
    }
}
