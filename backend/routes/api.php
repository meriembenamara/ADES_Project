<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API works',
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/sign-up', [AuthController::class, 'signUp']);
    Route::post('/sign-in', [AuthController::class, 'signIn']);

    Route::middleware('api.token')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/sign-out', [AuthController::class, 'signOut']);
        Route::post('/sign-out-all', [AuthController::class, 'signOutAll']);
    });
});

Route::middleware('api.token')->group(function (): void {
    require __DIR__.'/api/dashboards.php';
    require __DIR__.'/api/users.php';
    require __DIR__.'/api/documents.php';
    require __DIR__.'/api/control-points.php';
});
