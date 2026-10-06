package com.raspollob.server.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileStorageController {

    private final FileStorageService fileStorageService;

    @PreAuthorize("@perm.isStaff()")
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storeFile(file);
        // Expose as accessible relative URL pattern
        String fileUrl = "/uploads/" + filename;
        return ResponseEntity.ok(ApiResponse.success(fileUrl, "File uploaded and optimized successfully"));
    }
}

