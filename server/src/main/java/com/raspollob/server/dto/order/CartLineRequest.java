package com.raspollob.server.dto.order;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A product and quantity from the customer's cart. Prices are never taken from the client. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartLineRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    @NotNull
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 50, message = "You can order at most 50 of one item")
    private Integer quantity;
}
