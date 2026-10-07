package com.raspollob.server.controller;

import com.raspollob.server.dto.AccountResponse;
import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.ChangePasswordRequest;
import com.raspollob.server.dto.UpdateAccountRequest;
import com.raspollob.server.entity.User;
import com.raspollob.server.dto.order.OrderResponse;
import com.raspollob.server.dto.order.OrderSummaryResponse;
import com.raspollob.server.service.AccountService;
import com.raspollob.server.service.OrderService;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** The signed-in user's own profile, password and photo. Any role may use it, only on itself. */
@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AccountController {

    private final AccountService accountService;
    private final OrderService orderService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AccountResponse>> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAccount(user.getId()), "Account"));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            @AuthenticationPrincipal User user, @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(accountService.updateAccount(user.getId(), request), "Profile saved"));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User user, @Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed"));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AccountResponse>> uploadAvatar(
            @AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(accountService.updateAvatar(user.getId(), file), "Photo updated"));
    }

    /** Orders placed while signed in to this account, newest first. */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderSummaryResponse>>> myOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(orderService.myOrders(user.getId(), page, size), "Your orders"));
    }

    /** One of this account's own orders (no phone number needed). */
    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> myOrder(@AuthenticationPrincipal User user, @PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.success(orderService.myOrder(user.getId(), orderNumber), "Order"));
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<ApiResponse<AccountResponse>> removeAvatar(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(accountService.removeAvatar(user.getId()), "Photo removed"));
    }
}
