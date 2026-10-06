package com.raspollob.server.exception;

/**
 * Thrown when a requested resource does not exist (or is not publicly visible).
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
