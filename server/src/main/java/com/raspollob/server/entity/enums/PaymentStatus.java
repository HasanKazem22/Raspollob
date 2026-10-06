package com.raspollob.server.entity.enums;

public enum PaymentStatus {
    /** Cash on delivery, not collected yet */
    UNPAID,
    /** Customer submitted a mobile-banking transaction ID; staff must verify it */
    PENDING_VERIFICATION,
    PAID,
    /** Transaction ID could not be verified */
    FAILED,
    REFUNDED
}
