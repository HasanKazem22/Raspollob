package com.raspollob.server.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FileStorageServiceTest {

    @Test
    void ownUploadsAreLocal() {
        assertThat(FileStorageService.isLocalUpload("/uploads/3f2c.webp")).isTrue();
        assertThat(FileStorageService.isLocalUpload("uploads/3f2c.webp")).isTrue();
        assertThat(FileStorageService.isLocalUpload("3f2c.webp")).isTrue();
    }

    @Test
    void externalUrlsAndOtherPathsAreNeverDeleted() {
        assertThat(FileStorageService.isLocalUpload("https://images.unsplash.com/photo-1?w=800")).isFalse();
        assertThat(FileStorageService.isLocalUpload("/uploads/nested/file.webp")).isFalse();
        assertThat(FileStorageService.isLocalUpload("/etc/passwd")).isFalse();
        assertThat(FileStorageService.isLocalUpload("")).isFalse();
        assertThat(FileStorageService.isLocalUpload(null)).isFalse();
    }
}
