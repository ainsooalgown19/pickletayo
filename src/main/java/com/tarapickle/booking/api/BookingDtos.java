package com.tarapickle.booking.api;
import com.tarapickle.booking.domain.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public final class BookingDtos {
 private BookingDtos(){}
 public record CreateHoldRequest(@NotNull UUID courtId,@NotNull @Future Instant startsAt,@NotNull @Future Instant endsAt){}
 public record BookingResponse(UUID bookingId,String reference,UUID facilityId,UUID courtId,Instant startsAt,Instant endsAt,
   BookingStatus status,BigDecimal subtotalAmount,BigDecimal discountAmount,BigDecimal totalAmount,String currencyCode,
   PaymentStatus paymentStatus,Instant holdExpiresAt,Instant createdAt){}
}
