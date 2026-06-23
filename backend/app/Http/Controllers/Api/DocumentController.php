<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $documents = Document::query()
            ->with(['creator:id,name,email'])
            ->latest()
            ->get();

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'file_path' => ['nullable', 'string', 'max:500'],
            'class_key' => ['nullable', 'string', 'max:120'],
            'category_key' => ['nullable', 'string', 'max:120'],
            'status' => ['required', 'in:draft,in_review,approved,rejected'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $storedPath = $uploadedFile->store('documents', 'public');

            $validated['file_path'] = $storedPath;
            $validated['original_filename'] = $uploadedFile->getClientOriginalName();
            $validated['file_size'] = $uploadedFile->getSize();
            $validated['mime_type'] = $uploadedFile->getMimeType();
        }

        $document = Document::query()->create($validated);

        return response()->json($document->load('creator:id,name,email'), 201);
    }

    public function show(Document $document): JsonResponse
    {
        return response()->json($document->load('creator:id,name,email'));
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'file_path' => ['sometimes', 'nullable', 'string', 'max:500'],
            'class_key' => ['sometimes', 'nullable', 'string', 'max:120'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:120'],
            'status' => ['sometimes', 'required', 'in:draft,in_review,approved,rejected'],
            'created_by' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        $document->update($validated);

        return response()->json($document->fresh()->load('creator:id,name,email'));
    }

    public function destroy(Document $document): JsonResponse
    {
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([], 204);
    }
}
