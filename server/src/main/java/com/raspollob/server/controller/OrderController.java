package com.raspollob.server.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.order.CheckoutRequest;
import com.raspollob.server.dto.order.OrderQuoteRequest;
import com.raspollob.server.dto.order.OrderQuoteResponse;
import com.raspollob.server.dto.order.OrderResponse;
import com.raspollob.server.service.OrderService;
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

    /** Order lookup for customers: order number + the phone used at checkout. */
    @GetMapping("/track")
    public ResponseEntity<ApiResponse<OrderResponse>> track(
            @RequestParam String orderNumber,
            @RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(orderService.track(orderNumber, phone), "Order found"));
    }
}
