<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LabelingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_store_a_labeling_entry(): void
    {
        $user = User::factory()->create();
        $document = Document::query()->create([
            'title' => 'Invoice 001',
            'description' => 'Uploaded invoice',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $tokenPayload = $user->issueApiToken('labeling-test');
        $token = $tokenPayload['id'].'|'.$tokenPayload['plainTextToken'];

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/labelings', [
                'document_id' => $document->id,
                'user_id' => $user->id,
                'class_key' => 'cls-archive',
                'category_key' => 'cat-factures',
                'attribute_name' => 'Numero facture',
                'attribute_snippet' => 'FAC-2026-0315',
                'attribute_value' => 'FAC-2026-0315',
            ])
            ->assertCreated()
            ->assertJsonFragment([
                'attribute_name' => 'Numero facture',
                'attribute_value' => 'FAC-2026-0315',
            ]);

        $this->assertDatabaseHas('labelings', [
            'document_id' => $document->id,
            'attribute_name' => 'Numero facture',
            'attribute_value' => 'FAC-2026-0315',
        ]);
    }
}
