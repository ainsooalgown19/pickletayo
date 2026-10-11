package com.tarapickle.booking.domain;

import com.tarapickle.shared.application.ApplicationException;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="court_bookings") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class CourtBooking {
    @Id private UUID id;
    @Column(name="organization_id",nullable=false) private UUID organizationId;
    @Column(name="booking_reference",nullable=false,unique=true) private String reference;
    @Column(name="facility_id",nullable=false) private UUID facilityId;
    @Column(name="court_id",nullable=false) private UUID courtId;
    @Column(name="booked_by_user_id",nullable=false) private UUID bookedByUserId;
    @Column(name="booking_start",nullable=false) private Instant startsAt;
    @Column(name="booking_end",nullable=false) private Instant endsAt;
    @Enumerated(EnumType.STRING) @Column(name="booking_status",nullable=false) private BookingStatus status;
    @Column(name="subtotal_amount",nullable=false,precision=19,scale=4) private BigDecimal subtotalAmount;
    @Column(name="discount_amount",nullable=false,precision=19,scale=4) private BigDecimal discountAmount;
    @Column(name="total_amount",nullable=false,precision=19,scale=4) private BigDecimal totalAmount;
    @Column(name="currency_code",nullable=false) private String currencyCode;
    @Enumerated(EnumType.STRING) @Column(name="payment_status",nullable=false) private PaymentStatus paymentStatus;
    @Column(name="idempotency_key") private String idempotencyKey;
    @Column(name="hold_expires_at") private Instant holdExpiresAt;
    @Column(name="created_at",nullable=false) private Instant createdAt;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Version private long version;

    public CourtBooking(UUID id,String reference,UUID organizationId,UUID facilityId,UUID courtId,UUID userId,Instant startsAt,
            Instant endsAt,BigDecimal amount,String currencyCode,String idempotencyKey,Instant holdExpiresAt,Instant now) {
        if(!startsAt.isBefore(endsAt)) throw new IllegalArgumentException("Booking start must precede end.");
        this.id=id;this.reference=reference;this.organizationId=organizationId;this.facilityId=facilityId;this.courtId=courtId;
        this.bookedByUserId=userId;this.startsAt=startsAt;this.endsAt=endsAt;this.status=BookingStatus.HOLD;
        this.subtotalAmount=amount;this.discountAmount=BigDecimal.ZERO;this.totalAmount=amount;this.currencyCode=currencyCode;
        this.paymentStatus=PaymentStatus.UNPAID;this.idempotencyKey=idempotencyKey;this.holdExpiresAt=holdExpiresAt;this.createdAt=now;this.updatedAt=now;
    }

    public BookingStatus submitForPayment(Instant now) {
        requireLiveHold(now); BookingStatus previous=status; status=BookingStatus.PENDING_PAYMENT; updatedAt=now; return previous;
    }
    public BookingStatus cancel(Instant now) {
        if(status==BookingStatus.CANCELLED||status==BookingStatus.EXPIRED||status==BookingStatus.COMPLETED) throw invalidState();
        BookingStatus previous=status; status=BookingStatus.CANCELLED; holdExpiresAt=null; updatedAt=now; return previous;
    }
    public BookingStatus expire(Instant now) {
        if(status!=BookingStatus.HOLD&&status!=BookingStatus.PENDING_PAYMENT) return status;
        BookingStatus previous=status; status=BookingStatus.EXPIRED; holdExpiresAt=null; updatedAt=now; return previous;
    }
    public boolean holdExpired(Instant now) { return (status==BookingStatus.HOLD||status==BookingStatus.PENDING_PAYMENT)&&holdExpiresAt!=null&&!holdExpiresAt.isAfter(now); }
    private void requireLiveHold(Instant now) { if(status!=BookingStatus.HOLD||holdExpired(now)) throw invalidState(); }
    private ApplicationException invalidState() { return new ApplicationException(HttpStatus.CONFLICT,"INVALID_BOOKING_STATE","Booking cannot be changed from its current state."); }
}
