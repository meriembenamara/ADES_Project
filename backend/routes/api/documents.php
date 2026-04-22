<?php

use App\Http\Controllers\Api\DocumentController;
use Illuminate\Support\Facades\Route;

Route::apiResource('documents', DocumentController::class);
