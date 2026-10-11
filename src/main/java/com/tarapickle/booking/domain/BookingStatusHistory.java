package com.tarapickle.booking.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="booking_status_history") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class BookingStatusHistory {
 @Id private UUID id; @Column(name="booking_id",nullable=false) private UUID bookingId;
 @Enumerated(EnumType.STRING) @Column(name="from_status") private BookingStatus fromStatus;
 @Enumerated(EnumType.STRING) @Column(name="to_status",nullable=false) private BookingStatus toStatus;
 @Column(name="changed_by_user_id") private UUID changedByUserId; private String reason;
 @Column(name="changed_at",nullable=false) private Instant changedAt;
 public BookingStatusHistory(UUID id,UUID bookingId,BookingStatus from,BookingStatus to,UUID actor,String reason,Instant at){this.id=id;this.bookingId=bookingId;fromStatus=from;toStatus=to;changedByUserId=actor;this.reason=reason;changedAt=at;}
}
