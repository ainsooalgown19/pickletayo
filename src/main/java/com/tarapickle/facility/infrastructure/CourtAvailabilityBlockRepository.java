package com.tarapickle.facility.infrastructure;
import com.tarapickle.facility.domain.CourtAvailabilityBlock;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;
public interface CourtAvailabilityBlockRepository extends JpaRepository<CourtAvailabilityBlock,UUID> {
    @Query("select b from CourtAvailabilityBlock b where b.courtId=:courtId and b.startsAt<:end and b.endsAt>:start")
    List<CourtAvailabilityBlock> overlaps(@Param("courtId")UUID courtId,@Param("start")Instant start,@Param("end")Instant end);
}
