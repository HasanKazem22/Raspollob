package com.raspollob.server.controller;

import com.raspollob.server.dto.StoreConfigRequest;
import com.raspollob.server.dto.StoreConfigResponse;
import com.raspollob.server.service.StoreConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequiredArgsConstructor
public class StoreConfigController {

    private final StoreConfigService service;

    @GetMapping("/api/v1/config/store")
    public ResponseEntity<StoreConfigResponse> getStoreConfig() {
        return ResponseEntity.ok(service.getStoreConfig());
    }

    @PreAuthorize("@perm.has('home.actions.update')")
    @PutMapping("/api/v1/admin/config/store")
    public ResponseEntity<StoreConfigResponse> updateStoreConfig(@jakarta.validation.Valid @RequestBody StoreConfigRequest request) {
        return ResponseEntity.ok(service.updateStoreConfig(request));
    }
}
