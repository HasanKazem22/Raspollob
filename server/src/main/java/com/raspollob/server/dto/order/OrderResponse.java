package com.raspollob.server.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.raspollob.server.entity.enums.DeliveryZone;
import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.entity.enums.PaymentMethod;
import com.raspollob.server.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Full order. Admin-only fields (adminNote, history authors) are null in customer views. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;
    /** Statuses the order may move to next (admin view only) */
    private List<OrderStatus> allowedNextStatuses;

    private AddressDto shippingAddress;
    private Boolean billingSameAsShipping;
    private AddressDto billingAddress;
    private DeliveryZone deliveryZone;

    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionId;
    private String paymentSenderNumber;

    private List<Item> items;
    private Integer itemCount;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal total;
    private String promoCode;

    private String customerNote;
    private String adminNote;
    /** Username of the customer account, or null for guest orders (admin view only) */
    private String customerUsername;

    private List<HistoryEntry> history;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Long productId;
        private String productName;
        private String sku;
        private String imageUrl;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal lineTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class HistoryEntry {
        private OrderStatus status;
        private PaymentStatus paymentStatus;
        private String note;
        private String changedBy;
        private LocalDateTime createdAt;
    }
}
