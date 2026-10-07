package com.raspollob.server.exception;

/** Answered with HTTP 429: the caller tried too often and should wait before trying again. */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
