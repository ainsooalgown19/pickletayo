package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "facilities") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Facility {
    @Id private UUID id;
    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(name = "facility_name", nullable = false, length = 160) private String name;
    @Column(name = "branch_code", nullable = false, length = 40) private String branchCode;
    private String description;
    @Enumerated(EnumType.STRING) @Column(name = "facility_status", nullable = false) private FacilityStatus status;
    @Column(name = "contact_number") private String contactNumber;
    @Column(name = "contact_email") private String contactEmail;
    @Column(nullable = false) private String timezone;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version private long version;

    public Facility(UUID id, UUID organizationId, String name, String branchCode, String description, String contactNumber, String contactEmail, String timezone, Instant now) {
        this.id = id; this.organizationId = organizationId; this.name = name; this.branchCode = branchCode;
        this.description = description; this.contactNumber = contactNumber; this.contactEmail = contactEmail;
        this.timezone = timezone; this.status = FacilityStatus.DRAFT; this.createdAt = now; this.updatedAt = now;
    }

    public void changeStatus(FacilityStatus next, Instant now) {
        if (status == FacilityStatus.CLOSED && next != FacilityStatus.CLOSED) throw new IllegalStateException("Closed facilities cannot be reopened.");
        status = next; updatedAt = now;
    }
}
