package com.raspollob.server.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.order.CheckoutRequest;
import com.raspollob.server.dto.order.OrderQuoteRequest;
import com.raspollob.server.dto.order.OrderQuoteResponse;
import com.raspollob.server.dto.order.OrderResponse;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.exception.TooManyRequestsException;
import com.raspollob.server.security.FailedAttemptLimiter;
import com.raspollob.server.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Storefront checkout. Open to guests; orders are linked to the account when signed in. */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final FailedAttemptLimiter orderTrackingLimiter;

    /** Server-side pricing for the checkout page (current prices, shipping, promo). */
    @PostMapping("/quote")
    public ResponseEntity<ApiResponse<OrderQuoteResponse>> quote(@Valid @RequestBody OrderQuoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.quote(request), "Quote calculated"));
    }

    @PreAuthorize("@perm.has('storefront.actions.placeOrder')")
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(@Valid @RequestBody CheckoutRequest request) {
        OrderResponse order = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(order, "Order placed successfully"));
    }

    /**
     * Order lookup for customers: order number + the phone used at checkout.
     * Wrong combinations are counted per IP, so order numbers can't be found by trying many.
     */
    @GetMapping("/track")
    public ResponseEntity<ApiResponse<OrderResponse>> track(
            @RequestParam String orderNumber,
            @RequestParam String phone,
            HttpServletRequest request) {
        String caller = request.getRemoteAddr(); // real client IP behind Nginx (forward-headers-strategy)
        if (orderTrackingLimiter.isBlocked(caller)) {
            throw new TooManyRequestsException("Too many attempts. Please wait a few minutes and try again.");
        }
        try {
            return ResponseEntity.ok(ApiResponse.success(orderService.track(orderNumber, phone), "Order found"));
        } catch (ResourceNotFoundException e) {
            orderTrackingLimiter.recordFailure(caller);
            throw e;
        }
    }
}
