<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MLTraining extends Model
{
    protected $fillable = [
        'user_id',
        'model_type',
        'description',
        'status',
        'started_at',
        'completed_at',
        'metrics',
        'error_message',
    ];

    protected $casts = [
        'metrics' => 'json',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
