package com.raspollob.server.dto;

/** Shared Bean Validation patterns (keep in sync with gui/lib/phone.ts). */
public final class ValidationPatterns {

    /** Bangladeshi mobile number: 01[3-9]XXXXXXXX (11 digits), optionally prefixed with +88 / 88 */
    public static final String BD_PHONE = "^(?:\\+?88)?01[3-9]\\d{8}$";

    public static final String BD_PHONE_MESSAGE = "Enter a valid 11-digit mobile number (e.g. 01712345678)";

    private ValidationPatterns() {
    }
}
