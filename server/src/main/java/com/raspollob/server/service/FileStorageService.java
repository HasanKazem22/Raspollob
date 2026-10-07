package com.raspollob.server.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 1200;
    private static final float COMPRESSION_QUALITY = 0.82f;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Strategy A: Compresses and resizes uploaded image to max 1200x1200 WebP (or optimized JPEG fallback).
     * Reduces 3-8MB files down to 80-150KB (90-95% disk saving).
     */
    public String storeFile(MultipartFile file) {
        return storeFile(file, MAX_WIDTH, MAX_HEIGHT);
    }

    /** Same as {@link #storeFile(MultipartFile)}, resized to fit within the given box (e.g. 400×400 for avatars). */
    public String storeFile(MultipartFile file, int maxWidth, int maxHeight) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files (JPEG, PNG, WEBP) are allowed.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFilename);
        }

        try {
            boolean supportsWebp = ImageIO.getImageWritersByFormatName("webp").hasNext();
            String targetFormat = supportsWebp ? "webp" : "jpg";
            String uniqueFilename = UUID.randomUUID().toString() + "." + targetFormat;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);

            // Strategy A: Resize & compress using Thumbnailator
            Thumbnails.of(file.getInputStream())
                    .size(maxWidth, maxHeight)
                    .outputFormat(targetFormat)
                    .outputQuality(COMPRESSION_QUALITY)
                    .toFile(targetLocation.toFile());

            log.info("Strategy A: Stored optimized image {} (original: {}, size: {} bytes)",
                    uniqueFilename, originalFilename, Files.size(targetLocation));

            return uniqueFilename;
        } catch (Exception ex) {
            log.error("Failed to process and compress image: {}", originalFilename, ex);
            throw new RuntimeException("Could not store image " + originalFilename + ". Error: " + ex.getMessage(), ex);
        }
    }

    /**
     * Strategy C: Automatic orphan/physical file deletion.
     * Prevents deleted product images from remaining on server disk.
     */
    public boolean deleteFile(String filename) {
        // Only files we stored ourselves; external URLs (e.g. https://...) are never touched
        if (!isLocalUpload(filename)) {
            return false;
        }

        try {
            String cleanName = filename;
            if (cleanName.contains("/")) {
                cleanName = cleanName.substring(cleanName.lastIndexOf('/') + 1);
            }
            if (cleanName.contains("\\")) {
                cleanName = cleanName.substring(cleanName.lastIndexOf('\\') + 1);
            }

            if (cleanName.contains("..")) {
                log.warn("Attempted path traversal in deleteFile: {}", filename);
                return false;
            }

            Path filePath = this.fileStorageLocation.resolve(cleanName).normalize();
            if (Files.exists(filePath)) {
                boolean deleted = Files.deleteIfExists(filePath);
                if (deleted) {
                    log.info("Strategy C: Cleaned up physical file from disk: {}", cleanName);
                }
                return deleted;
            }
        } catch (IOException ex) {
            log.error("Failed to delete physical file: {}", filename, ex);
        }
        return false;
    }

    public void deleteFiles(Collection<String> filenames) {
        if (filenames != null) {
            for (String file : filenames) {
                deleteFile(file);
            }
        }
    }

    /**
     * Deletes files once the surrounding transaction has committed, so a failed save never
     * leaves the database pointing at files that are already gone. Deletes immediately
     * when there is no active transaction.
     */
    public void deleteFilesAfterCommit(Collection<String> filenames) {
        if (filenames == null || filenames.isEmpty()) {
            return;
        }
        List<String> toDelete = List.copyOf(filenames);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deleteFiles(toDelete);
                }
            });
        } else {
            deleteFiles(toDelete);
        }
    }

    /** Folder that holds uploaded files. */
    public Path getStorageLocation() {
        return fileStorageLocation;
    }

    /** True for paths produced by {@link #storeFile} ("uuid.webp" or "/uploads/uuid.webp"). */
    public static boolean isLocalUpload(String url) {
        if (!StringUtils.hasText(url) || url.contains("://")) {
            return false;
        }
        String path = url.startsWith("/") ? url.substring(1) : url;
        return path.startsWith("uploads/") ? path.indexOf('/', "uploads/".length()) < 0 : !path.contains("/");
    }
}

