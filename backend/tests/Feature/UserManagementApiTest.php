<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_signed_up_user_appears_in_users_listing(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'SecurePass1!',
        ]);

        $adminTokenPayload = $admin->issueApiToken('admin-session');
        $adminToken = $adminTokenPayload['id'].'|'.$adminTokenPayload['plainTextToken'];

        $this->postJson('/api/auth/sign-up', [
            'name' => 'New Member',
            'email' => 'member@example.com',
            'password' => 'SecurePass1!',
        ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonFragment([
                'name' => 'New Member',
                'email' => 'member@example.com',
            ]);
    }
}
