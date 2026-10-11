package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "courts") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Court {
    @Id private UUID id;
    @Column(name="organization_id", nullable=false) private UUID organizationId;
    @Column(name="facility_id", nullable=false) private UUID facilityId;
    @Column(name="court_code", nullable=false) private String code;
    @Column(name="court_name", nullable=false) private String name;
    @Enumerated(EnumType.STRING) @Column(name="court_type", nullable=false) private CourtType type;
    @Column(name="surface_type", nullable=false) private String surfaceType;
    @Enumerated(EnumType.STRING) @Column(name="court_status", nullable=false) private CourtStatus status;
    @Column(name="has_lighting", nullable=false) private boolean lighting;
    @Column(name="base_hourly_rate", nullable=false, precision=19, scale=4) private BigDecimal baseHourlyRate;
    @Column(name="currency_code", nullable=false) private String currencyCode;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    @Version private long version;

    public Court(UUID id, UUID organizationId, UUID facilityId, String code, String name, CourtType type, String surfaceType,
            boolean lighting, BigDecimal baseHourlyRate, Instant now) {
        this.id=id; this.organizationId=organizationId; this.facilityId=facilityId; this.code=code; this.name=name;
        this.type=type; this.surfaceType=surfaceType; this.status=CourtStatus.ACTIVE; this.lighting=lighting;
        this.baseHourlyRate=baseHourlyRate; this.currencyCode="PHP"; this.createdAt=now; this.updatedAt=now;
    }
}
