package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.repository.ContactMessageRepository;
import com.raspollob.server.repository.OrderRepository;
import com.raspollob.server.security.PermissionChecks;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Counts for the admin sidebar badges. Polled regularly, so it only runs two cheap COUNT queries.
 * Each count is only included for staff who may open that page (null otherwise).
 */
@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final OrderRepository orderRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final PermissionChecks perm;

    public record AdminCounts(Long newOrders, Long unreadMessages) {
    }

    @GetMapping("/counts")
    @PreAuthorize("@perm.isStaff()")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AdminCounts>> counts() {
        Long newOrders = perm.has("order.isAccess") ? orderRepository.countByStatus(OrderStatus.PENDING) : null;
        Long unread = perm.has("contactMessage.isAccess") ? contactMessageRepository.countByIsReadFalse() : null;
        return ResponseEntity.ok(ApiResponse.success(new AdminCounts(newOrders, unread), "Counts"));
    }
}
