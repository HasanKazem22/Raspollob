package com.raspollob.server.entity.enums;

public enum PaymentMethod {
    COD,
    BKASH,
    NAGAD,
    ROCKET;

    /** Mobile-banking payments are made before delivery and need a transaction ID. */
    public boolean isOnline() {
        return this != COD;
    }
}
