<?php

use App\Http\Controllers\Api\MLTrainingController;
use App\Http\Controllers\Api\MLPredictionController;
use Illuminate\Support\Facades\Route;

// ML Training endpoints
Route::get('ml/health', [MLTrainingController::class, 'health']);
Route::post('ml/train', [MLTrainingController::class, 'trainSync']);
Route::post('ml/train-async', [MLTrainingController::class, 'train']);
Route::get('ml/trainings', [MLTrainingController::class, 'list']);
Route::get('ml/trainings/{training}', [MLTrainingController::class, 'show']);

// ML Prediction endpoints
Route::post('ml/predict', [MLPredictionController::class, 'predict']);
Route::post('ml/predict/document/{document}', [MLPredictionController::class, 'predictFromDocument']);
