package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="court_availability_blocks") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class CourtAvailabilityBlock {
    @Id private UUID id;
    @Column(name="court_id",nullable=false) private UUID courtId;
    @Enumerated(EnumType.STRING) @Column(name="block_type",nullable=false) private AvailabilityBlockType type;
    @Column(name="starts_at",nullable=false) private Instant startsAt;
    @Column(name="ends_at",nullable=false) private Instant endsAt;
    private String reason;
    @Column(name="created_by_user_id",nullable=false) private UUID createdByUserId;
    @Column(name="created_at",nullable=false) private Instant createdAt;

    public CourtAvailabilityBlock(UUID id,UUID courtId,AvailabilityBlockType type,Instant startsAt,Instant endsAt,String reason,UUID actor,Instant now) {
        if(!startsAt.isBefore(endsAt)) throw new IllegalArgumentException("Availability block start must precede end.");
        this.id=id;this.courtId=courtId;this.type=type;this.startsAt=startsAt;this.endsAt=endsAt;this.reason=reason;this.createdByUserId=actor;this.createdAt=now;
    }
    public boolean overlaps(Instant start,Instant end) { return startsAt.isBefore(end)&&endsAt.isAfter(start); }
}
