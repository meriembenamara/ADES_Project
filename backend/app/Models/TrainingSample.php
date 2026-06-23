<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingSample extends Model
{
    protected $fillable = [
        'document_id',
        'user_id',
        'class_key',
        'category_key',
        'attribute_name',
        'attribute_snippet',
        'attribute_value',
        'labels_payload',
    ];

    protected $casts = [
        'labels_payload' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
