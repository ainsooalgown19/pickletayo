package com.tarapickle.organization.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "organization_members") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrganizationMember {
    @Id private UUID id;
    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "role_id", nullable = false) private UUID roleId;
    @Enumerated(EnumType.STRING) @Column(name = "membership_status", nullable = false) private MembershipStatus status;
    @Column(name = "joined_at") private Instant joinedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    public OrganizationMember(UUID id, UUID organizationId, UUID userId, UUID roleId, Instant now) {
        this.id = id; this.organizationId = organizationId; this.userId = userId; this.roleId = roleId;
        this.status = MembershipStatus.ACTIVE; this.joinedAt = now; this.createdAt = now;
    }
}
