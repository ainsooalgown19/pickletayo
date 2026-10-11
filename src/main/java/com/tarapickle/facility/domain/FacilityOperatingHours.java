package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import java.util.UUID;

@Entity @Table(name="facility_operating_hours") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class FacilityOperatingHours {
    @Id private UUID id;
    @Column(name="facility_id",nullable=false) private UUID facilityId;
    @Column(name="day_of_week",nullable=false) private int dayOfWeek;
    @Column(name="opens_at") private LocalTime opensAt;
    @Column(name="closes_at") private LocalTime closesAt;
    @Column(name="is_closed",nullable=false) private boolean closed;

    public FacilityOperatingHours(UUID id, UUID facilityId, int dayOfWeek, LocalTime opensAt, LocalTime closesAt, boolean closed) {
        this.id=id; this.facilityId=facilityId; change(dayOfWeek,opensAt,closesAt,closed);
    }
    public void change(int dayOfWeek, LocalTime opensAt, LocalTime closesAt, boolean closed) {
        if(dayOfWeek<1||dayOfWeek>7) throw new IllegalArgumentException("Day of week must be 1-7.");
        if(!closed&&(opensAt==null||closesAt==null||!opensAt.isBefore(closesAt))) throw new IllegalArgumentException("Open days require a valid opening period.");
        this.dayOfWeek=dayOfWeek; this.closed=closed; this.opensAt=closed?null:opensAt; this.closesAt=closed?null:closesAt;
    }
}
