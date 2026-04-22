<?php

use App\Http\Controllers\Api\ControlPointController;
use Illuminate\Support\Facades\Route;

Route::apiResource('control-points', ControlPointController::class);
