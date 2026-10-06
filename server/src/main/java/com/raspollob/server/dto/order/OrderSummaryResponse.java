package com.raspollob.server.dto.order;

import com.raspollob.server.entity.enums.OrderStatus;
import com.raspollob.server.entity.enums.PaymentMethod;
import com.raspollob.server.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Lightweight row for the admin orders table. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryResponse {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String city;
    private Integer itemCount;
    private BigDecimal total;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
}
