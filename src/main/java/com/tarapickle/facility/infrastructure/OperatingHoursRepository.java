package com.tarapickle.facility.infrastructure;
import com.tarapickle.facility.domain.FacilityOperatingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface OperatingHoursRepository extends JpaRepository<FacilityOperatingHours,UUID> {
    Optional<FacilityOperatingHours> findByFacilityIdAndDayOfWeek(UUID facilityId,int dayOfWeek);
    List<FacilityOperatingHours> findAllByFacilityIdOrderByDayOfWeek(UUID facilityId);
}
