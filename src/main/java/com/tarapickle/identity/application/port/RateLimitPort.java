package com.tarapickle.identity.application.port;
/** Extension point for a distributed production rate limiter. Implementations should key by operation and privacy-preserving client/account identifiers. */
public interface RateLimitPort { boolean allow(String operation,String clientKey); }
