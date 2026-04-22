<?php

use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

Route::apiResource('dashboards', DashboardController::class);
