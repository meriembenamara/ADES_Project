<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function apiTokens(): HasMany
    {
        return $this->hasMany(ApiToken::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'created_by');
    }

    public function controlPoints(): HasMany
    {
        return $this->hasMany(ControlPoint::class, 'assigned_to');
    }

    /**
     * Create a new API token and return the plain token value once.
     *
     * @return array{id:int,plainTextToken:string,expiresAt:\Illuminate\Support\Carbon}
     */
    public function issueApiToken(?string $name = null): array
    {
        $plainToken = Str::random(80);
        $expiresAt = now()->addMinutes((int) config('session.api_token_ttl_minutes', 10080));

        $token = $this->apiTokens()->create([
            'name' => $name ?? 'default',
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => $expiresAt,
        ]);

        return [
            'id' => $token->id,
            'plainTextToken' => $plainToken,
            'expiresAt' => $expiresAt,
        ];
    }
}
