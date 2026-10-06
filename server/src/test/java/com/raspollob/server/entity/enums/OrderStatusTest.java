package com.raspollob.server.entity.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {

    @Test
    void happyPathMovesForwardOneStepAtATime() {
        assertThat(OrderStatus.PENDING.canMoveTo(OrderStatus.CONFIRMED)).isTrue();
        assertThat(OrderStatus.CONFIRMED.canMoveTo(OrderStatus.PROCESSING)).isTrue();
        assertThat(OrderStatus.PROCESSING.canMoveTo(OrderStatus.SHIPPED)).isTrue();
        assertThat(OrderStatus.SHIPPED.canMoveTo(OrderStatus.DELIVERED)).isTrue();
    }

    @Test
    void cannotSkipStepsOrGoBackwards() {
        assertThat(OrderStatus.PENDING.canMoveTo(OrderStatus.SHIPPED)).isFalse();
        assertThat(OrderStatus.DELIVERED.canMoveTo(OrderStatus.PENDING)).isFalse();
    }

    @Test
    void cancellationOnlyBeforeShipping() {
        assertThat(OrderStatus.PROCESSING.canMoveTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.SHIPPED.canMoveTo(OrderStatus.CANCELLED)).isFalse();
    }

    @Test
    void terminalStatesHaveNoNextStatus() {
        assertThat(OrderStatus.CANCELLED.allowedNext()).isEmpty();
        assertThat(OrderStatus.RETURNED.allowedNext()).isEmpty();
    }

    @Test
    void onlyCancelledAndReturnedReleaseInventory() {
        for (OrderStatus status : OrderStatus.values()) {
            boolean expected = status == OrderStatus.CANCELLED || status == OrderStatus.RETURNED;
            assertThat(status.releasesInventory()).as(status.name()).isEqualTo(expected);
        }
    }
}
