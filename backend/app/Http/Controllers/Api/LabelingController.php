<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Labeling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabelingController extends Controller
{
    public function index(): JsonResponse
    {
        $labelings = Labeling::query()
            ->with(['document:id,title,file_path,original_filename', 'user:id,name,email'])
            ->latest()
            ->get();

        return response()->json($labelings);
    }

    public function export(): JsonResponse
    {
        $labelings = Labeling::query()
            ->with(['document:id,title,description,class_key,category_key,original_filename,file_path'])
            ->latest()
            ->get()
            ->map(function (Labeling $labeling): array {
                $document = $labeling->document;
                $textParts = array_filter([
                    $document?->title,
                    $document?->description,
                    $labeling->attribute_name,
                    $labeling->attribute_snippet,
                    $labeling->attribute_value,
                ]);

                return [
                    'document_id' => $labeling->document_id,
                    'document_path' => $document?->file_path,
                    'text' => implode(' ', $textParts),
                    'ocr_text' => $labeling->attribute_value,
                    'label' => $labeling->category_key ?: $labeling->class_key ?: $labeling->attribute_name,
                    'class_key' => $labeling->class_key ?: $document?->class_key,
                    'category_key' => $labeling->category_key ?: $document?->category_key,
                    'attribute_name' => $labeling->attribute_name,
                    'attribute_snippet' => $labeling->attribute_snippet,
                    'attribute_value' => $labeling->attribute_value,
                ];
            })
            ->values();

        return response()->json([
            'count' => $labelings->count(),
            'items' => $labelings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required', 'integer', 'exists:documents,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'class_key' => ['nullable', 'string', 'max:120'],
            'category_key' => ['nullable', 'string', 'max:120'],
            'attribute_name' => ['required', 'string', 'max:180'],
            'attribute_snippet' => ['nullable', 'string'],
            'attribute_value' => ['required', 'string'],
        ]);

        $labeling = Labeling::query()->create($validated);

        return response()->json(
            $labeling->load(['document:id,title,file_path,original_filename', 'user:id,name,email']),
            201
        );
    }
}
