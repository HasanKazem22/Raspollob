package com.raspollob.server.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderQuoteResponse {

    private List<Line> lines;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal total;

    /** Applied promo code (normalized), or null */
    private String promoCode;
    /** Why the requested promo code was not applied, or null */
    private String promoError;

    /** Subtotal needed for free shipping, or null when disabled */
    private BigDecimal freeShippingThreshold;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Line {
        private Long productId;
        private String name;
        private String imageUrl;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal lineTotal;
        private Integer availableStock;
    }
}
