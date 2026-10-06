package com.raspollob.server.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderServicePhoneTest {

    @Test
    void phoneNumbersAreStoredInLocalFormat() {
        assertThat(OrderService.normalizePhone("+8801712345678")).isEqualTo("01712345678");
        assertThat(OrderService.normalizePhone("8801712345678")).isEqualTo("01712345678");
        assertThat(OrderService.normalizePhone("01712-345678")).isEqualTo("01712345678");
        assertThat(OrderService.normalizePhone("01712345678")).isEqualTo("01712345678");
    }
}
