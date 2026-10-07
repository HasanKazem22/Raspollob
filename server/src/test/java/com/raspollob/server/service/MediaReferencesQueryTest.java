package com.raspollob.server.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Runs every "is this image still used?" query against the real schema. If a table or column is
 * renamed, this fails instead of the nightly clean-up silently skipping itself. Read-only.
 */
@SpringBootTest
class MediaReferencesQueryTest {

    @Autowired
    private MediaCleanupService mediaCleanup;

    @Test
    void everyImageReferenceQueryRuns() {
        assertThatCode(() -> mediaCleanup.referencedFileNames()).doesNotThrowAnyException();
    }
}
