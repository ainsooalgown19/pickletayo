package com.tarapickle.identity.domain.model; import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Table(name="password_reset_tokens") @NoArgsConstructor(access=AccessLevel.PROTECTED) public class PasswordResetToken extends OneTimeToken { public PasswordResetToken(UUID uid,String hash,Instant now,Instant expires){super(uid,hash,now,expires);} }
