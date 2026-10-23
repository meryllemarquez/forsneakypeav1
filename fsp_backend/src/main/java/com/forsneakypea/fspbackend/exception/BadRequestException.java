package com.forsneakypea.fspbackend.exception;

/** Request is understood but invalid (HTTP 400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
