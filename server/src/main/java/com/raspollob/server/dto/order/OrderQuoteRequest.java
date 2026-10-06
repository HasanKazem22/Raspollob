package com.raspollob.server.dto.order;

import com.raspollob.server.entity.enums.DeliveryZone;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Asks the server to price a cart: current prices, shipping and an optional promo code. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderQuoteRequest {

    @NotEmpty(message = "Your cart is empty")
    @Size(max = 50, message = "Too many different items in one order")
    @Valid
    private List<CartLineRequest> items;

    @NotNull(message = "Delivery area is required")
    private DeliveryZone deliveryZone;

    @Size(max = 40)
    private String promoCode;

    /** Used for the per-customer promo limit; optional until checkout */
    @Size(max = 20)
    private String phone;
}
