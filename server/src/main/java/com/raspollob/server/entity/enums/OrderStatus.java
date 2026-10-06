package com.raspollob.server.entity.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Order lifecycle. Allowed moves:
 * PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → RETURNED,
 * and CANCELLED from any state before SHIPPED.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    RETURNED;

    public Set<OrderStatus> allowedNext() {
        return switch (this) {
            case PENDING -> EnumSet.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> EnumSet.of(PROCESSING, CANCELLED);
            case PROCESSING -> EnumSet.of(SHIPPED, CANCELLED);
            case SHIPPED -> EnumSet.of(DELIVERED, RETURNED);
            case DELIVERED -> EnumSet.of(RETURNED);
            case CANCELLED, RETURNED -> EnumSet.noneOf(OrderStatus.class);
        };
    }

    public boolean canMoveTo(OrderStatus next) {
        return allowedNext().contains(next);
    }

    /** Orders in these states no longer hold stock or a promo-code use. */
    public boolean releasesInventory() {
        return this == CANCELLED || this == RETURNED;
    }
}
