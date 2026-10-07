package com.raspollob.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Keeps the uploads folder from filling up:
 * <ul>
 *   <li>{@link #deleteIfUnused}: when an image is removed or replaced, its file is deleted once the change is
 *       saved, unless something else still shows it (another product size, an old order, a banner…).</li>
 *   <li>{@link #removeOrphans}: every night, deletes upload files nothing refers to any more, such as photos
 *       uploaded in a form that was then cancelled.</li>
 * </ul>
 * Both work from one list of every place an image can be stored ({@link #REFERENCES}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MediaCleanupService {

    /**
     * Every column that can point at an uploaded file. ADD NEW IMAGE FIELDS HERE, or the nightly
     * clean-up will treat their files as unused.
     */
    static final List<String> REFERENCES = List.of(
            "SELECT image_url FROM product_images",
            "SELECT image_url FROM order_items",
            "SELECT image_url FROM categories",
            "SELECT avatar_url FROM users",
            "SELECT image_url FROM store_config_hero_images",
            "SELECT store_logo FROM store_config",
            "SELECT promo_banner_image FROM store_config",
            "SELECT offer_image FROM store_config",
            "SELECT profile_image FROM customer_reviews");

    /** Files younger than this are never swept: someone may be filling in a form with them right now. */
    static final Duration GRACE_PERIOD = Duration.ofHours(24);

    private final JdbcTemplate jdbc;
    private final FileStorageService fileStorage;

    /** File names ("uuid.webp") that something in the database still refers to. */
    public Set<String> referencedFileNames() {
        Set<String> names = new HashSet<>();
        for (String query : REFERENCES) {
            for (String url : jdbc.queryForList(query, String.class)) {
                String name = fileName(url);
                if (name != null) {
                    names.add(name);
                }
            }
        }
        return names;
    }

    /**
     * Last path segment of a stored image reference ("/uploads/a.webp", "a.webp", even a full URL).
     * Deliberately generous: an extra name only keeps a file, it never deletes one.
     */
    static String fileName(String url) {
        if (!StringUtils.hasText(url)) {
            return null;
        }
        String clean = url.trim();
        int query = clean.indexOf('?');
        if (query >= 0) {
            clean = clean.substring(0, query);
        }
        int slash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
        String name = slash >= 0 ? clean.substring(slash + 1) : clean;
        return name.isEmpty() ? null : name;
    }

    /**
     * Deletes these uploaded files once the current transaction commits, skipping any that are still
     * used anywhere. External URLs are never touched. Runs immediately outside a transaction.
     */
    public void deleteIfUnused(Collection<String> urls) {
        List<String> candidates = urls.stream()
                .filter(Objects::nonNull)
                .filter(FileStorageService::isLocalUpload)
                .distinct()
                .toList();
        if (candidates.isEmpty()) {
            return;
        }
        Runnable cleanup = () -> {
            try {
                Set<String> used = referencedFileNames();
                List<String> unused = candidates.stream().filter(url -> !used.contains(fileName(url))).toList();
                fileStorage.deleteFiles(unused);
            } catch (Exception e) {
                // Never fail the user's save over housekeeping; the nightly sweep will catch it
                log.warn("Image clean-up skipped: {}", e.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    cleanup.run();
                }
            });
        } else {
            cleanup.run();
        }
    }

    /** Nightly sweep (default 03:30 store time) of upload files nothing refers to. */
    @Scheduled(cron = "${app.uploads.cleanup-cron:0 30 3 * * *}")
    public void removeOrphans() {
        int removed = removeOrphans(Instant.now());
        if (removed > 0) {
            log.info("Upload clean-up removed {} unused file(s)", removed);
        }
    }

    int removeOrphans(Instant now) {
        Set<String> used;
        try {
            used = referencedFileNames();
        } catch (Exception e) {
            // Without a reliable list of used files, deleting anything would be a guess
            log.warn("Upload clean-up skipped: could not read image references ({})", e.getMessage());
            return 0;
        }

        Instant cutoff = now.minus(GRACE_PERIOD);
        int removed = 0;
        try (Stream<Path> files = Files.list(fileStorage.getStorageLocation())) {
            for (Path file : files.filter(Files::isRegularFile).toList()) {
                String name = file.getFileName().toString();
                if (used.contains(name) || name.startsWith(".")) {
                    continue;
                }
                try {
                    if (Files.getLastModifiedTime(file).toInstant().isBefore(cutoff) && Files.deleteIfExists(file)) {
                        removed++;
                    }
                } catch (IOException e) {
                    log.warn("Could not remove unused upload {}: {}", name, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.warn("Upload clean-up skipped: could not list the uploads folder ({})", e.getMessage());
        }
        return removed;
    }
}
