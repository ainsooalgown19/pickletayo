package com.tarapickle.identity.application; public record EmailRequested(Kind kind,String email,String token){public enum Kind{VERIFICATION,RESET}}
