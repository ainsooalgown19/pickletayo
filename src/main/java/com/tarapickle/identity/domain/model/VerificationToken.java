package com.tarapickle.identity.domain.model; import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Table(name="email_verification_tokens") @NoArgsConstructor(access=AccessLevel.PROTECTED) public class VerificationToken extends OneTimeToken { public VerificationToken(UUID uid,String hash,Instant now,Instant expires){super(uid,hash,now,expires);} }
