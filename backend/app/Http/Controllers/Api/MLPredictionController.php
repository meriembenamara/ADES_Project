<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class MLPredictionController extends Controller
{
    private const ML_SERVICE_URL = 'http://ml_models:8001';

    public function predict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'min:10'],
            'attribute_names' => ['nullable', 'array'],
            'attribute_names.*' => ['string'],
        ]);

        try {
            $payload = [
                'text' => $validated['text'],
                'attribute_names' => $validated['attribute_names'] ?? null,
            ];

            $response = Http::timeout(30)
                ->post(self::ML_SERVICE_URL . '/predict', $payload);

            if (!$response->ok()) {
                throw new \Exception(
                    "ML service returned status {$response->status()}: " . $response->body()
                );
            }

            $result = $response->json();

            return response()->json([
                'message' => 'Prédiction réussie',
                'predictions' => $result['predictions'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error('Prediction failed', [
                'error' => $e->getMessage(),
                'text_length' => strlen($validated['text']),
            ]);

            return response()->json([
                'message' => 'Prédiction échouée',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function predictFromDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required', 'integer', 'exists:documents,id'],
            'attribute_names' => ['nullable', 'array'],
            'attribute_names.*' => ['string'],
        ]);

        try {
            $document = \App\Models\Document::findOrFail($validated['document_id']);

            // Extract text from document (OCR or existing text)
            $text = $document->description ?? $document->title ?? '';

            if (!$text && $document->file_path) {
                // TODO: Run OCR on file
                // $text = OcrService::extract($document->file_path);
            }

            if (!$text) {
                return response()->json([
                    'message' => 'Aucun texte à traiter dans le document',
                    'error' => 'Document sans contenu',
                ], 400);
            }

            return $this->predict(
                new Request([
                    'text' => $text,
                    'attribute_names' => $validated['attribute_names'] ?? null,
                ])
            );
        } catch (\Exception $e) {
            Log::error('Document prediction failed', [
                'document_id' => $validated['document_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Prédiction échouée',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
