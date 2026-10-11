package com.tarapickle.booking.domain;
import org.junit.jupiter.api.Test; import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
class CourtBookingTest {
 @Test void holdCanMoveToPendingPaymentWithoutLosingItsExpiry(){Instant now=Instant.parse("2026-09-27T00:00:00Z");CourtBooking b=booking(now);b.submitForPayment(now.plusSeconds(30));assertThat(b.getStatus()).isEqualTo(BookingStatus.PENDING_PAYMENT);assertThat(b.getHoldExpiresAt()).isEqualTo(now.plusSeconds(600));}
 @Test void pendingPaymentExpiresWhenItsHoldWindowEnds(){Instant now=Instant.parse("2026-09-27T00:00:00Z");CourtBooking b=booking(now);b.submitForPayment(now.plusSeconds(30));b.expire(now.plusSeconds(601));assertThat(b.getStatus()).isEqualTo(BookingStatus.EXPIRED);assertThat(b.getHoldExpiresAt()).isNull();}
 @Test void expiredHoldCannotMoveToPayment(){Instant now=Instant.parse("2026-09-27T00:00:00Z");CourtBooking b=booking(now);assertThatThrownBy(()->b.submitForPayment(now.plusSeconds(601))).isInstanceOf(RuntimeException.class);}
 private CourtBooking booking(Instant now){return new CourtBooking(UUID.randomUUID(),"PT-TEST",UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),now.plusSeconds(3600),now.plusSeconds(7200),new BigDecimal("500.00"),"PHP","test-key",now.plusSeconds(600),now);}
}
