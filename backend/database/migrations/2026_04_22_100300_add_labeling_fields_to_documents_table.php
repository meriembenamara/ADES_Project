<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->string('class_key', 120)->nullable()->after('file_path');
            $table->string('category_key', 120)->nullable()->after('class_key');
            $table->string('original_filename', 255)->nullable()->after('category_key');
            $table->unsignedBigInteger('file_size')->nullable()->after('original_filename');
            $table->string('mime_type', 120)->nullable()->after('file_size');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropColumn([
                'class_key',
                'category_key',
                'original_filename',
                'file_size',
                'mime_type',
            ]);
        });
    }
};
