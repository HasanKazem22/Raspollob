package com.raspollob.server.service;

import com.raspollob.server.entity.CustomerReview;
import com.raspollob.server.entity.StoreConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MediaCleanupServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-06T21:30:00Z");

    @TempDir
    Path uploads;

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private MediaCleanupService cleanup;
    private final List<String> referenced = new ArrayList<>();

    @BeforeEach
    void setUp() {
        cleanup = new MediaCleanupService(jdbc, new FileStorageService(uploads.toString()));
        // Every reference query returns the same list; enough to model "used somewhere"
        when(jdbc.queryForList(anyString(), eq(String.class))).thenAnswer(inv -> referenced);
    }

    @Test
    void nightlySweepRemovesOnlyOldUnusedFiles() throws IOException {
        Path used = file("used.webp", Duration.ofDays(3));
        Path orphan = file("orphan.webp", Duration.ofDays(3));
        Path fresh = file("fresh.webp", Duration.ofHours(1)); // e.g. a form being filled in right now
        referenced.add("/uploads/used.webp");

        int removed = cleanup.removeOrphans(NOW);

        assertThat(removed).isEqualTo(1);
        assertThat(used).exists();
        assertThat(fresh).exists();
        assertThat(orphan).doesNotExist();
    }

    @Test
    void sweepDeletesNothingWhenTheDatabaseCantBeRead() throws IOException {
        Path orphan = file("orphan.webp", Duration.ofDays(3));
        when(jdbc.queryForList(anyString(), eq(String.class))).thenThrow(new DataAccessResourceFailureException("down"));

        assertThat(cleanup.removeOrphans(NOW)).isZero();
        assertThat(orphan).exists();
    }

    @Test
    void removedImageIsDeletedUnlessStillShownElsewhere() throws IOException {
        Path banner = file("banner.webp", Duration.ZERO);
        Path shared = file("shared.webp", Duration.ZERO);
        referenced.add("shared.webp"); // e.g. an old order still shows this photo

        cleanup.deleteIfUnused(List.of("/uploads/banner.webp", "/uploads/shared.webp", "https://cdn.example/x.webp"));

        assertThat(banner).doesNotExist();
        assertThat(shared).exists();
    }

    @Test
    void readsFileNamesFromAnyStoredForm() {
        assertThat(MediaCleanupService.fileName("/uploads/a.webp")).isEqualTo("a.webp");
        assertThat(MediaCleanupService.fileName("a.webp")).isEqualTo("a.webp");
        assertThat(MediaCleanupService.fileName("http://localhost:8085/uploads/a.webp?v=2")).isEqualTo("a.webp");
        assertThat(MediaCleanupService.fileName("  ")).isNull();
    }

    @Test
    void storeSettingsListEveryImageTheyShow() {
        StoreConfig c = new StoreConfig();
        c.setStoreLogo("/uploads/logo.webp");
        c.setPromoBannerImage("/uploads/promo.webp");
        c.setOfferImage("/uploads/offer.webp");
        c.getHeroBannerImages().add("/uploads/hero1.webp");
        c.getCustomerReviews().add(CustomerReview.builder().profileImage("/uploads/review.webp").build());

        assertThat(StoreConfigService.imagesOf(c)).containsExactlyInAnyOrder(
                "/uploads/logo.webp", "/uploads/promo.webp", "/uploads/offer.webp",
                "/uploads/hero1.webp", "/uploads/review.webp");
    }

    private Path file(String name, Duration age) throws IOException {
        Path path = uploads.resolve(name);
        Files.writeString(path, "x");
        Files.setLastModifiedTime(path, FileTime.from(NOW.minus(age)));
        return path;
    }
}
