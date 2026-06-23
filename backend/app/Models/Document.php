<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'description',
        'file_path',
        'class_key',
        'category_key',
        'original_filename',
        'file_size',
        'mime_type',
        'status',
        'created_by',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function controlPoints(): HasMany
    {
        return $this->hasMany(ControlPoint::class);
    }

    public function labelings(): HasMany
    {
        return $this->hasMany(Labeling::class);
    }

    public function trainingSamples(): HasMany
    {
        return $this->hasMany(TrainingSample::class);
    }
}
