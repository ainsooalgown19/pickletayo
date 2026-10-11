package com.tarapickle.booking.infrastructure;
import com.tarapickle.booking.domain.BookingStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface BookingStatusHistoryRepository extends JpaRepository<BookingStatusHistory,UUID> {}
