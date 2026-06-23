<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MLTraining;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLTrainingController extends Controller
{
    private const ML_SERVICE_URL = 'http://ml_models:8001';

    public function health(): JsonResponse
    {
        try {
            $response = Http::timeout(5)->get(self::ML_SERVICE_URL . '/health');
            return response()->json([
                'status' => $response->ok() ? 'healthy' : 'unhealthy',
                'service' => 'ml_models',
                'url' => self::ML_SERVICE_URL,
            ]);
        } catch (\Exception $e) {
            Log::warning('ML service health check failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'unavailable',
                'service' => 'ml_models',
                'error' => $e->getMessage(),
            ], 503);
        }
    }

    public function train(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'model_type' => ['required', 'in:classification,extraction'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $training = MLTraining::create([
            'user_id' => auth('api')->id() ?? null,
            'model_type' => $validated['model_type'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
            'metrics' => null,
            'error_message' => null,
        ]);

        try {
            $this->dispatchTraining($training);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch training job', [
                'training_id' => $training->id,
                'error' => $e->getMessage(),
            ]);

            $training->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Entraînement du modèle échoué',
                'training' => $training,
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Entraînement du modèle lancé',
            'training' => $training,
        ], 202);
    }

    public function trainSync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'model_type' => ['required', 'in:classification,extraction'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $training = MLTraining::create([
            'user_id' => auth('api')->id() ?? null,
            'model_type' => $validated['model_type'],
            'description' => $validated['description'] ?? null,
            'status' => 'in_progress',
            'started_at' => now(),
            'completed_at' => null,
            'metrics' => null,
            'error_message' => null,
        ]);

        try {
            $payload = [
                'data_source' => 'backend',
                'backend_api_url' => config('app.url') . '/api/labelings/export',
                'backend_token' => $request->bearerToken(),
            ];

            $response = Http::timeout(600)
                ->post(self::ML_SERVICE_URL . '/train', $payload);

            if (!$response->ok()) {
                throw new \Exception("ML service returned status {$response->status()}: " . $response->body());
            }

            $result = $response->json();

            $training->update([
                'status' => 'completed',
                'completed_at' => now(),
                'metrics' => $result,
            ]);

            return response()->json([
                'message' => 'Entraînement du modèle réussi',
                'training' => $training->fresh(),
                'result' => $result,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Training failed', [
                'training_id' => $training->id,
                'error' => $e->getMessage(),
            ]);

            $training->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Entraînement du modèle échoué',
                'training' => $training,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function list(): JsonResponse
    {
        $trainings = MLTraining::query()
            ->latest()
            ->paginate(15);

        return response()->json($trainings);
    }

    public function show(MLTraining $training): JsonResponse
    {
        return response()->json($training);
    }

    private function dispatchTraining(MLTraining $training): void
    {
        \App\Jobs\TrainMLModel::dispatch($training);
    }
}
