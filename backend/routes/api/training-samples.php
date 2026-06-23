<?php

use App\Http\Controllers\Api\TrainingSampleController;
use Illuminate\Support\Facades\Route;

Route::get('training-samples', [TrainingSampleController::class, 'index']);
Route::get('training-samples/export', [TrainingSampleController::class, 'export']);
Route::post('training-samples', [TrainingSampleController::class, 'store']);
