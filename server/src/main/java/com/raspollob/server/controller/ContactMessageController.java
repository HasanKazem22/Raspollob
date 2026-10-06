package com.raspollob.server.controller;

import com.raspollob.server.dto.ContactMessageRequest;
import com.raspollob.server.dto.ContactMessageResponse;
import com.raspollob.server.service.ContactMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ContactMessageController {

    private final ContactMessageService service;

    @PreAuthorize("@perm.has('storefront.actions.sendMessage')")
    @PostMapping("/api/v1/contact")
    public ResponseEntity<Void> submitMessage(@Valid @RequestBody ContactMessageRequest request) {
        service.submitMessage(request);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("@perm.has('contactMessage.isAccess')")
    @GetMapping("/api/v1/admin/contact")
    public ResponseEntity<List<ContactMessageResponse>> getAllMessages() {
        return ResponseEntity.ok(service.getAllMessages());
    }

    @PreAuthorize("@perm.has('contactMessage.actions.update')")
    @PatchMapping("/api/v1/admin/contact/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
