<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labelings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('class_key', 120)->nullable();
            $table->string('category_key', 120)->nullable();
            $table->string('attribute_name', 180);
            $table->text('attribute_snippet')->nullable();
            $table->text('attribute_value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labelings');
    }
};
