package com.tarapickle.identity.domain.model;
import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Table(name="user_credentials") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class UserCredential { @Id @Column(name="user_id") private UUID userId; @Column(name="password_hash",nullable=false) private String passwordHash; @Column(name="password_changed_at",nullable=false) private Instant passwordChangedAt; @Version private long version; public UserCredential(UUID id,String hash,Instant now){userId=id;passwordHash=hash;passwordChangedAt=now;} public void changePassword(String hash,Instant now){passwordHash=hash;passwordChangedAt=now;} }
