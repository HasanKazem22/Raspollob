package com.raspollob.server.dto.order;

import com.raspollob.server.entity.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCodeResponse {
    private Long id;
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private Integer usageLimit;
    private Integer usedCount;
    private Integer perCustomerLimit;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
