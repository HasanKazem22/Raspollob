package com.raspollob.server.exception;

/**
 * A request that is well-formed but breaks a business rule
 * (out of stock, invalid promo code, illegal status change, ...).
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}; the message is shown to the user.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
