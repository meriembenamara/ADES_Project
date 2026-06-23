<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingSample;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingSampleController extends Controller
{
    public function index(): JsonResponse
    {
        $samples = TrainingSample::query()
            ->with(['document:id,title,file_path,original_filename', 'user:id,name,email'])
            ->latest()
            ->get();

        return response()->json($samples);
    }

    public function export(): JsonResponse
    {
        $samples = TrainingSample::query()
            ->with(['document:id,title,description,class_key,category_key,original_filename'])
            ->latest()
            ->get()
            ->map(function (TrainingSample $sample): array {
                $document = $sample->document;
                $textParts = array_filter([
                    $document?->title,
                    $document?->description,
                    $sample->attribute_name,
                    $sample->attribute_snippet,
                    $sample->attribute_value,
                ]);

                return [
                    'document_id' => $sample->document_id,
                    'document_path' => $document?->file_path,
                    'text' => implode(' ', $textParts),
                    'ocr_text' => $sample->attribute_value,
                    'label' => $sample->category_key ?: $sample->class_key ?: $sample->attribute_name,
                    'class_key' => $sample->class_key ?: $document?->class_key,
                    'category_key' => $sample->category_key ?: $document?->category_key,
                    'attribute_name' => $sample->attribute_name,
                    'attribute_snippet' => $sample->attribute_snippet,
                    'attribute_value' => $sample->attribute_value,
                ];
            })
            ->values();

        return response()->json([
            'count' => $samples->count(),
            'items' => $samples,
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
            'labels_payload' => ['nullable', 'array'],
        ]);

        $sample = TrainingSample::query()->create($validated);

        return response()->json(
            $sample->load(['document:id,title,file_path,original_filename', 'user:id,name,email']),
            201
        );
    }
}
