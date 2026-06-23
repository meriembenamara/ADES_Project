<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentClass extends Model
{
    protected $table = 'classes';

    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'class_id');
    }
}
