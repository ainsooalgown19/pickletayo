package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="court_rate_rules") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class CourtRateRule {
    @Id private UUID id;
    @Column(name="court_id",nullable=false) private UUID courtId;
    @Column(name="rule_name",nullable=false) private String name;
    @Column(name="day_of_week") private Integer dayOfWeek;
    @Column(name="starts_at") private LocalTime startsAt;
    @Column(name="ends_at") private LocalTime endsAt;
    @Column(name="hourly_rate",nullable=false,precision=19,scale=4) private BigDecimal hourlyRate;
    @Column(name="effective_from") private LocalDate effectiveFrom;
    @Column(name="effective_until") private LocalDate effectiveUntil;
    @Column(nullable=false) private int priority;
    @Column(nullable=false) private boolean active;

    public CourtRateRule(UUID id,UUID courtId,String name,Integer dayOfWeek,LocalTime startsAt,LocalTime endsAt,BigDecimal hourlyRate,LocalDate effectiveFrom,LocalDate effectiveUntil,int priority) {
        this.id=id;this.courtId=courtId;this.name=name;this.dayOfWeek=dayOfWeek;this.startsAt=startsAt;this.endsAt=endsAt;
        this.hourlyRate=hourlyRate;this.effectiveFrom=effectiveFrom;this.effectiveUntil=effectiveUntil;this.priority=priority;this.active=true;
    }
    public boolean applies(LocalDate date,LocalTime time) {
        return active&&(dayOfWeek==null||dayOfWeek==date.getDayOfWeek().getValue())&&(effectiveFrom==null||!date.isBefore(effectiveFrom))&&
                (effectiveUntil==null||!date.isAfter(effectiveUntil))&&(startsAt==null||!time.isBefore(startsAt))&&(endsAt==null||time.isBefore(endsAt));
    }
}
