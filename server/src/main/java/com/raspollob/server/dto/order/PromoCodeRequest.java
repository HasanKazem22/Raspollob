package com.raspollob.server.dto.order;

import com.raspollob.server.entity.enums.DiscountType;
import jakarta.validation.constraints.*;
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
public class PromoCodeRequest {

    @NotBlank(message = "Code is required")
    @Size(min = 3, max = 40, message = "Code must be 3–40 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Code can only contain letters, numbers, - and _")
    private String code;

    @Size(max = 255)
    private String description;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount must be greater than 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0.00")
    private BigDecimal minOrderAmount;

    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;

    @Min(value = 1, message = "Usage limit must be at least 1")
    private Integer usageLimit;

    @NotNull
    @Min(value = 1, message = "Per-customer limit must be at least 1")
    private Integer perCustomerLimit;

    @NotNull
    private Boolean isActive;
}
