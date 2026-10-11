package com.tarapickle.facility.infrastructure;
import com.tarapickle.facility.domain.FacilityLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface FacilityLocationRepository extends JpaRepository<FacilityLocation, UUID> { Optional<FacilityLocation> findByFacilityId(UUID facilityId); }
