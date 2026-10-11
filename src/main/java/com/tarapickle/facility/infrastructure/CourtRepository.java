package com.tarapickle.facility.infrastructure;
import com.tarapickle.facility.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CourtRepository extends JpaRepository<Court, UUID> {
    List<Court> findAllByFacilityIdOrderByName(UUID facilityId);
    boolean existsByFacilityIdAndCodeIgnoreCase(UUID facilityId, String code);
}
