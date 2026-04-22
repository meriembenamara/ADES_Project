<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (! $bearer || ! str_contains($bearer, '|')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        [$tokenId, $plainToken] = explode('|', $bearer, 2);

        if (! ctype_digit($tokenId) || $plainToken === '') {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = ApiToken::query()
            ->whereKey((int) $tokenId)
            ->first();

        if (! $token || ! hash_equals($token->token_hash, hash('sha256', $plainToken))) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($token->expires_at->isPast()) {
            $token->delete();

            return response()->json(['message' => 'Token expired.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();

        Auth::setUser($token->user);
        $request->attributes->set('api_token', $token);

        return $next($request);
    }
}
