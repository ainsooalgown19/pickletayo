package com.tarapickle.identity.domain.model;
import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Table(name="users") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class User { @Id private UUID id; @Column(nullable=false,length=320) private String email; @Column(name="given_name",nullable=false,length=100) private String givenName; @Column(name="family_name",nullable=false,length=100) private String familyName; @Enumerated(EnumType.STRING) @Column(nullable=false,length=32) private AccountStatus status; @Column(name="email_verified_at") private Instant emailVerifiedAt; @Column(name="created_at",nullable=false) private Instant createdAt; @Column(name="updated_at",nullable=false) private Instant updatedAt; @Version private long version;
  public User(UUID id,String email,String givenName,String familyName,Instant now){this.id=id;this.email=email;this.givenName=givenName;this.familyName=familyName;this.status=AccountStatus.PENDING_VERIFICATION;this.createdAt=now;this.updatedAt=now;}
  public void verifyEmail(Instant now){if(status!=AccountStatus.PENDING_VERIFICATION) throw new IllegalStateException("Account cannot be verified"); emailVerifiedAt=now;status=AccountStatus.ACTIVE;updatedAt=now;}
  public void suspend(Instant now){if(status!=AccountStatus.ACTIVE)throw new IllegalStateException("Only active accounts may be suspended");status=AccountStatus.SUSPENDED;updatedAt=now;}
  public void close(Instant now){status=AccountStatus.CLOSED;updatedAt=now;}
  public void updateName(String givenName,String familyName,Instant now){this.givenName=givenName.strip();this.familyName=familyName.strip();this.updatedAt=now;}
}
