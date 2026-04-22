<?php

use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::apiResource('users', UserManagementController::class);
