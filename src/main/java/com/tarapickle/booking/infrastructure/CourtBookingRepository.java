package com.tarapickle.booking.infrastructure;
import com.tarapickle.booking.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import java.time.Instant;
import java.util.*;
public interface CourtBookingRepository extends JpaRepository<CourtBooking,UUID> {
 Optional<CourtBooking> findByBookedByUserIdAndIdempotencyKey(UUID userId,String idempotencyKey);
 Page<CourtBooking> findAllByBookedByUserId(UUID userId,Pageable pageable);
 List<CourtBooking> findTop100ByStatusInAndHoldExpiresAtBefore(Collection<BookingStatus> statuses,Instant cutoff);
}
