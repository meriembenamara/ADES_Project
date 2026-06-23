<?php

namespace App\Jobs;

use App\Models\MLTraining;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TrainMLModel implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const ML_SERVICE_URL = 'http://ml_models:8001';

    public function __construct(
        protected MLTraining $training,
    ) {
    }

    public function handle(): void
    {
        try {
            $this->training->update([
                'status' => 'in_progress',
                'started_at' => now(),
            ]);

            Log::info('Starting ML training', [
                'training_id' => $this->training->id,
                'model_type' => $this->training->model_type,
            ]);

            $payload = [
                'data_source' => 'backend',
                'backend_api_url' => config('app.url') . '/api/labelings/export',
                'backend_token' => $this->training->user?->tokens()->latest()->first()?->plainTextToken,
            ];

            $response = Http::timeout(600)
                ->post(self::ML_SERVICE_URL . '/train', $payload);

            if (!$response->ok()) {
                throw new \Exception(
                    "ML service returned status {$response->status()}: " . $response->body()
                );
            }

            $result = $response->json();

            $this->training->update([
                'status' => 'completed',
                'completed_at' => now(),
                'metrics' => $result,
            ]);

            Log::info('ML training completed successfully', [
                'training_id' => $this->training->id,
                'metrics' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('ML training failed', [
                'training_id' => $this->training->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->training->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            $this->fail($e);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ML training job failed', [
            'training_id' => $this->training->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
