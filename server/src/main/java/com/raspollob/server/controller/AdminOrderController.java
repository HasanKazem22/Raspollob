package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.order.*;
import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @PreAuthorize("@perm.has('order.isAccess')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderSummaryResponse>>> search(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(orderService.search(status, query, page, size), "Orders retrieved"));
    }

    /** Several orders at once for printing their delivery slips together: ?ids=12,15,18 (max 50). */
    @PreAuthorize("@perm.has('order.actions.printSlip')")
    @GetMapping("/slips")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> slips(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getForSlips(ids), "Orders for printing"));
    }

    @PreAuthorize("@perm.has('order.isAccess')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getForAdmin(id), "Order retrieved"));
    }

    @PreAuthorize("@perm.has('order.actions.update')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updateStatus(id, request), "Order status updated"));
    }

    @PreAuthorize("@perm.has('order.actions.updatePayment')")
    @PatchMapping("/{id}/payment")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePayment(
            @PathVariable Long id, @Valid @RequestBody PaymentStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updatePaymentStatus(id, request), "Payment status updated"));
    }

    @PreAuthorize("@perm.has('order.actions.update')")
    @PatchMapping("/{id}/note")
    public ResponseEntity<ApiResponse<OrderResponse>> updateNote(
            @PathVariable Long id, @Valid @RequestBody AdminNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updateAdminNote(id, request), "Note saved"));
    }
}
