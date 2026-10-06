package com.raspollob.server.service;

import com.raspollob.server.entity.PromoCode;
import com.raspollob.server.entity.enums.DiscountType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PromoCodeServiceTest {

    private static PromoCode promo(DiscountType type, String value, String maxDiscount) {
        return PromoCode.builder()
                .code("TEST")
                .discountType(type)
                .discountValue(new BigDecimal(value))
                .maxDiscountAmount(maxDiscount == null ? null : new BigDecimal(maxDiscount))
                .build();
    }

    @Test
    void percentageDiscountIsRoundedToTwoDecimals() {
        BigDecimal discount = PromoCodeService.calculateDiscount(
                promo(DiscountType.PERCENTAGE, "15", null), new BigDecimal("333.33"));
        assertThat(discount).isEqualByComparingTo("50.00");
    }

    @Test
    void percentageDiscountRespectsCap() {
        BigDecimal discount = PromoCodeService.calculateDiscount(
                promo(DiscountType.PERCENTAGE, "50", "200"), new BigDecimal("1000"));
        assertThat(discount).isEqualByComparingTo("200");
    }

    @Test
    void fixedDiscountNeverExceedsSubtotal() {
        BigDecimal discount = PromoCodeService.calculateDiscount(
                promo(DiscountType.FIXED, "500", null), new BigDecimal("300"));
        assertThat(discount).isEqualByComparingTo("300");
    }

    @Test
    void codesAreNormalizedToUpperCase() {
        assertThat(PromoCodeService.normalize("  eid25 ")).isEqualTo("EID25");
    }
}
