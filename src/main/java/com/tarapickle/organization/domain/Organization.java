package com.tarapickle.organization.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "organizations") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Organization {
    @Id private UUID id;
    @Enumerated(EnumType.STRING) @Column(name = "organization_type", nullable = false) private OrganizationType type;
    @Column(name = "legal_name", nullable = false, length = 200) private String legalName;
    @Column(name = "display_name", nullable = false, length = 160) private String displayName;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private OrganizationStatus status;
    @Column(name = "owner_user_id", nullable = false) private UUID ownerUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version private long version;

    public Organization(UUID id, OrganizationType type, String legalName, String displayName, UUID ownerUserId, Instant now) {
        this.id = id; this.type = type; this.legalName = legalName; this.displayName = displayName;
        this.ownerUserId = ownerUserId; this.status = OrganizationStatus.ACTIVE; this.createdAt = now; this.updatedAt = now;
    }
}
