<?php

use App\Http\Controllers\Api\LabelingController;
use Illuminate\Support\Facades\Route;

Route::get('labelings', [LabelingController::class, 'index']);
Route::get('labelings/export', [LabelingController::class, 'export']);
Route::post('labelings', [LabelingController::class, 'store']);
