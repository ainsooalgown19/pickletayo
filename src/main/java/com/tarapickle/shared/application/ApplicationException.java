package com.tarapickle.shared.application;

import org.springframework.http.HttpStatus;

public class ApplicationException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApplicationException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }

    public static ApplicationException notFound(String code, String message) {
        return new ApplicationException(HttpStatus.NOT_FOUND, code, message);
    }

    public static ApplicationException conflict(String code, String message) {
        return new ApplicationException(HttpStatus.CONFLICT, code, message);
    }

    public static ApplicationException forbidden(String code, String message) {
        return new ApplicationException(HttpStatus.FORBIDDEN, code, message);
    }
}
