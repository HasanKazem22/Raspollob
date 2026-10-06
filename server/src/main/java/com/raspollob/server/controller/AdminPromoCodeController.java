package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.order.PromoCodeRequest;
import com.raspollob.server.dto.order.PromoCodeResponse;
import com.raspollob.server.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/promo-codes")
@RequiredArgsConstructor
public class AdminPromoCodeController {

    private final PromoCodeService promoCodeService;

    @PreAuthorize("@perm.has('order.subModules.promoCodes.isAccess')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PromoCodeResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(promoCodeService.list(), "Promo codes retrieved"));
    }

    @PreAuthorize("@perm.has('order.subModules.promoCodes.actions.create')")
    @PostMapping
    public ResponseEntity<ApiResponse<PromoCodeResponse>> create(@Valid @RequestBody PromoCodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(promoCodeService.create(request), "Promo code created"));
    }

    @PreAuthorize("@perm.has('order.subModules.promoCodes.actions.update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody PromoCodeRequest request) {
        return ResponseEntity.ok(ApiResponse.success(promoCodeService.update(id, request), "Promo code updated"));
    }

    @PreAuthorize("@perm.has('order.subModules.promoCodes.actions.delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        promoCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Promo code deleted"));
    }
}
