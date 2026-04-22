<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_sign_up_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/sign-up', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'SecurePass1!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'access_token',
                'token_type',
                'expires_at',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
        $this->assertDatabaseCount('api_tokens', 1);
    }

    public function test_user_can_sign_in_and_access_me_endpoint(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'SecurePass1!',
        ]);

        $signIn = $this->postJson('/api/auth/sign-in', [
            'email' => 'user@example.com',
            'password' => 'SecurePass1!',
        ]);

        $signIn->assertOk();
        $token = $signIn->json('access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'user@example.com');
    }

    public function test_sign_out_invalidates_current_token(): void
    {
        $user = User::factory()->create();
        $tokenPayload = $user->issueApiToken('test');
        $token = $tokenPayload['id'].'|'.$tokenPayload['plainTextToken'];

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/sign-out')
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    public function test_sign_in_returns_422_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'SecurePass1!',
        ]);

        $this->postJson('/api/auth/sign-in', [
            'email' => 'user@example.com',
            'password' => 'WrongPass1!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
