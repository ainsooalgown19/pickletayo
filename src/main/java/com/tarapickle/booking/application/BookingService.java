package com.tarapickle.booking.application;

import com.tarapickle.booking.api.BookingDtos.*;
import com.tarapickle.booking.domain.*;
import com.tarapickle.booking.infrastructure.*;
import com.tarapickle.facility.domain.*;
import com.tarapickle.facility.infrastructure.*;
import com.tarapickle.shared.application.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class BookingService {
 private final CourtBookingRepository bookings; private final BookingStatusHistoryRepository history;
 private final CourtRepository courts; private final FacilityRepository facilities; private final OperatingHoursRepository hours;
 private final CourtRateRuleRepository rates; private final CourtAvailabilityBlockRepository blocks; private final Clock clock;

 @Transactional
 public BookingResponse hold(UUID userId,String idempotencyKey,CreateHoldRequest request){
  if(idempotencyKey==null||idempotencyKey.isBlank()||idempotencyKey.length()>120) throw new ApplicationException(HttpStatus.BAD_REQUEST,"IDEMPOTENCY_KEY_REQUIRED","A valid Idempotency-Key header is required.");
  var existing=bookings.findByBookedByUserIdAndIdempotencyKey(userId,idempotencyKey); if(existing.isPresent()) return response(existing.get());
  Instant now=clock.instant(); if(!request.startsAt().isAfter(now)||!request.startsAt().isBefore(request.endsAt())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_BOOKING_PERIOD","Booking period must be valid and in the future.");
  long minutes=Duration.between(request.startsAt(),request.endsAt()).toMinutes(); if(minutes<30||minutes>240||minutes%30!=0) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_DURATION","Booking duration must be 30-240 minutes in 30-minute increments.");
  Court court=courts.findById(request.courtId()).filter(c->c.getStatus()==CourtStatus.ACTIVE).orElseThrow(()->ApplicationException.notFound("COURT_NOT_FOUND","Court was not found."));
  Facility facility=facilities.findById(court.getFacilityId()).filter(f->f.getStatus()==FacilityStatus.ACTIVE).orElseThrow(()->ApplicationException.notFound("FACILITY_NOT_FOUND","Facility was not found."));
  ZoneId zone=ZoneId.of(facility.getTimezone()); ZonedDateTime localStart=request.startsAt().atZone(zone); ZonedDateTime localEnd=request.endsAt().atZone(zone);
  if(!localStart.toLocalDate().equals(localEnd.minusNanos(1).toLocalDate())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"BOOKING_CROSSES_DAY","Booking must start and end on the same local date.");
  var schedule=hours.findByFacilityIdAndDayOfWeek(facility.getId(),localStart.getDayOfWeek().getValue()).orElseThrow(()->new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"FACILITY_CLOSED","Facility is closed at the requested time."));
  if(schedule.isClosed()||localStart.toLocalTime().isBefore(schedule.getOpensAt())||localEnd.toLocalTime().isAfter(schedule.getClosesAt())) throw new ApplicationException(HttpStatus.UNPROCESSABLE_ENTITY,"OUTSIDE_OPERATING_HOURS","Requested time is outside facility operating hours.");
  if(!blocks.overlaps(court.getId(),request.startsAt(),request.endsAt()).isEmpty()) throw ApplicationException.conflict("COURT_BLOCKED","Court is unavailable for the requested time.");
  BigDecimal hourly=rates.findAllByCourtIdAndActiveTrueOrderByPriorityDesc(court.getId()).stream().filter(r->r.applies(localStart.toLocalDate(),localStart.toLocalTime())).map(CourtRateRule::getHourlyRate).findFirst().orElse(court.getBaseHourlyRate());
  BigDecimal amount=hourly.multiply(BigDecimal.valueOf(minutes)).divide(BigDecimal.valueOf(60),2,RoundingMode.HALF_UP);
  String reference="PT-"+now.atZone(ZoneOffset.UTC).toLocalDate().toString().replace("-","")+"-"+UUID.randomUUID().toString().substring(0,8).toUpperCase(Locale.ROOT);
  CourtBooking booking=new CourtBooking(UUID.randomUUID(),reference,facility.getOrganizationId(),facility.getId(),court.getId(),userId,request.startsAt(),request.endsAt(),amount,"PHP",idempotencyKey.strip(),now.plus(Duration.ofMinutes(10)),now);
  try { booking=bookings.saveAndFlush(booking); } catch(DataIntegrityViolationException conflict){ throw ApplicationException.conflict("COURT_ALREADY_BOOKED","Court is no longer available for the requested time."); }
  history.save(new BookingStatusHistory(UUID.randomUUID(),booking.getId(),null,BookingStatus.HOLD,userId,"Booking hold created",now)); return response(booking);
 }

 @Transactional public BookingResponse submit(UUID userId,UUID bookingId){CourtBooking b=owned(userId,bookingId);Instant now=clock.instant();BookingStatus from=b.submitForPayment(now);history.save(new BookingStatusHistory(UUID.randomUUID(),b.getId(),from,b.getStatus(),userId,"Submitted for payment",now));return response(b);}
 @Transactional public BookingResponse cancel(UUID userId,UUID bookingId){CourtBooking b=owned(userId,bookingId);Instant now=clock.instant();BookingStatus from=b.cancel(now);history.save(new BookingStatusHistory(UUID.randomUUID(),b.getId(),from,b.getStatus(),userId,"Cancelled by player",now));return response(b);}
 @Transactional(readOnly=true) public Page<BookingResponse> list(UUID userId,Pageable pageable){return bookings.findAllByBookedByUserId(userId,pageable).map(this::response);}
 @Transactional(readOnly=true) public BookingResponse get(UUID userId,UUID bookingId){return response(owned(userId,bookingId));}
 @Scheduled(fixedDelayString="${pickletayo.booking.hold-expiry-scan-ms:30000}") @Transactional public void expireHolds(){Instant now=clock.instant();for(CourtBooking b:bookings.findTop100ByStatusInAndHoldExpiresAtBefore(List.of(BookingStatus.HOLD,BookingStatus.PENDING_PAYMENT),now)){BookingStatus from=b.expire(now);history.save(new BookingStatusHistory(UUID.randomUUID(),b.getId(),from,b.getStatus(),null,"Booking hold expired",now));}}
 private CourtBooking owned(UUID userId,UUID id){return bookings.findById(id).filter(b->b.getBookedByUserId().equals(userId)).orElseThrow(()->ApplicationException.notFound("BOOKING_NOT_FOUND","Booking was not found."));}
 private BookingResponse response(CourtBooking b){return new BookingResponse(b.getId(),b.getReference(),b.getFacilityId(),b.getCourtId(),b.getStartsAt(),b.getEndsAt(),b.getStatus(),b.getSubtotalAmount(),b.getDiscountAmount(),b.getTotalAmount(),b.getCurrencyCode(),b.getPaymentStatus(),b.getHoldExpiresAt(),b.getCreatedAt());}
}
