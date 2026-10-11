package com.tarapickle.identity.application.port; public interface EmailPort { void sendVerification(String email,String token); void sendPasswordReset(String email,String token); }
