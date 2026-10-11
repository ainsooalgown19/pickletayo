package com.tarapickle.facility.application;

import com.tarapickle.facility.api.FacilityDtos.*;
import com.tarapickle.facility.domain.*;
import com.tarapickle.facility.infrastructure.*;
import com.tarapickle.shared.application.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class AvailabilityService {
    private final FacilityService facilityService;
    private final FacilityRepository facilities;
    private final CourtRepository courts;
    private final OperatingHoursRepository hours;
    private final CourtRateRuleRepository rates;
    private final CourtAvailabilityBlockRepository blocks;
    private final Clock clock;

    @Transactional
    public void setHours(UUID facilityId,UUID actorId,boolean admin,OperatingHoursRequest request) {
        facilityService.managementFacility(facilityId,actorId,admin);
        var value=hours.findByFacilityIdAndDayOfWeek(facilityId,request.dayOfWeek()).orElseGet(()->new FacilityOperatingHours(UUID.randomUUID(),facilityId,request.dayOfWeek(),request.opensAt(),request.closesAt(),request.closed()));
        value.change(request.dayOfWeek(),request.opensAt(),request.closesAt(),request.closed()); hours.save(value);
    }

    @Transactional
    public void addRate(UUID courtId,UUID actorId,boolean admin,CreateRateRuleRequest request) {
        Court court=courts.findById(courtId).orElseThrow(()->ApplicationException.notFound("COURT_NOT_FOUND","Court was not found."));
        facilityService.managementFacility(court.getFacilityId(),actorId,admin);
        if(request.effectiveFrom()!=null&&request.effectiveUntil()!=null&&request.effectiveFrom().isAfter(request.effectiveUntil())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_RATE_DATES","Rate effective dates are invalid.");
        if(request.startsAt()!=null&&request.endsAt()!=null&&!request.startsAt().isBefore(request.endsAt())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_RATE_PERIOD","Rate time period is invalid.");
        rates.save(new CourtRateRule(UUID.randomUUID(),courtId,request.name().strip(),request.dayOfWeek(),request.startsAt(),request.endsAt(),request.hourlyRate(),request.effectiveFrom(),request.effectiveUntil(),request.priority()));
    }

    @Transactional
    public void addBlock(UUID courtId,UUID actorId,boolean admin,CreateAvailabilityBlockRequest request) {
        Court court=courts.findById(courtId).orElseThrow(()->ApplicationException.notFound("COURT_NOT_FOUND","Court was not found."));
        facilityService.managementFacility(court.getFacilityId(),actorId,admin);
        if(!request.startsAt().isBefore(request.endsAt())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_BLOCK_PERIOD","Availability block start must precede end.");
        blocks.save(new CourtAvailabilityBlock(UUID.randomUUID(),courtId,request.type(),request.startsAt(),request.endsAt(),request.reason(),actorId,clock.instant()));
    }

    @Transactional(readOnly=true)
    public FacilityAvailabilityResponse availability(UUID facilityId,LocalDate date,int durationMinutes) {
        if(durationMinutes<30||durationMinutes>240||durationMinutes%30!=0) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_DURATION","Duration must be 30-240 minutes in 30-minute increments.");
        Facility facility=facilities.findById(facilityId).filter(f->f.getStatus()==FacilityStatus.ACTIVE).orElseThrow(()->ApplicationException.notFound("FACILITY_NOT_FOUND","Facility was not found."));
        ZoneId zone=ZoneId.of(facility.getTimezone());
        FacilityOperatingHours schedule=hours.findByFacilityIdAndDayOfWeek(facilityId,date.getDayOfWeek().getValue()).orElse(null);
        if(schedule==null||schedule.isClosed()) return new FacilityAvailabilityResponse(facilityId,date,facility.getTimezone(),durationMinutes,List.of());
        Instant dayStart=date.atStartOfDay(zone).toInstant(); Instant dayEnd=date.plusDays(1).atStartOfDay(zone).toInstant();
        List<AvailabilitySlotResponse> result=new ArrayList<>(); Duration duration=Duration.ofMinutes(durationMinutes);
        for(Court court:courts.findAllByFacilityIdOrderByName(facilityId)) {
            if(court.getStatus()!=CourtStatus.ACTIVE) continue;
            List<CourtAvailabilityBlock> courtBlocks=blocks.overlaps(court.getId(),dayStart,dayEnd);
            for(LocalTime time=schedule.getOpensAt();!time.plusMinutes(durationMinutes).isAfter(schedule.getClosesAt());time=time.plusMinutes(30)) {
                LocalTime slotTime=time;
                Instant start=ZonedDateTime.of(date,slotTime,zone).toInstant(); Instant end=start.plus(duration);
                if(!start.isAfter(clock.instant())||courtBlocks.stream().anyMatch(b->b.overlaps(start,end))) continue;
                BigDecimal hourly=rates.findAllByCourtIdAndActiveTrueOrderByPriorityDesc(court.getId()).stream().filter(r->r.applies(date,slotTime)).map(CourtRateRule::getHourlyRate).findFirst().orElse(court.getBaseHourlyRate());
                BigDecimal price=hourly.multiply(BigDecimal.valueOf(durationMinutes)).divide(BigDecimal.valueOf(60),2,RoundingMode.HALF_UP);
                result.add(new AvailabilitySlotResponse(court.getId(),court.getName(),start,end,price,court.getCurrencyCode()));
            }
        }
        result.sort(Comparator.comparing(AvailabilitySlotResponse::startsAt).thenComparing(AvailabilitySlotResponse::courtName));
        return new FacilityAvailabilityResponse(facilityId,date,facility.getTimezone(),durationMinutes,List.copyOf(result));
    }
}
