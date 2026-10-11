package com.tarapickle.facility.infrastructure;

import com.tarapickle.facility.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {
    boolean existsByOrganizationIdAndBranchCodeIgnoreCase(UUID organizationId, String branchCode);
    Page<Facility> findAllByOrganizationId(UUID organizationId,Pageable pageable);
    @Query(value = """
        select distinct f.* from facilities f
        join facility_locations l on l.facility_id=f.id
        left join courts c on c.facility_id=f.id and c.court_status='ACTIVE'
        where f.facility_status='ACTIVE'
          and (coalesce(:query,'')='' or lower(f.facility_name) like lower(concat('%',:query,'%')) or lower(l.city_municipality) like lower(concat('%',:query,'%')))
          and (coalesce(:city,'')='' or lower(l.city_municipality)=lower(:city))
          and (:courtType is null or c.court_type=:courtType)
        """, countQuery = """
        select count(distinct f.id) from facilities f
        join facility_locations l on l.facility_id=f.id
        left join courts c on c.facility_id=f.id and c.court_status='ACTIVE'
        where f.facility_status='ACTIVE'
          and (coalesce(:query,'')='' or lower(f.facility_name) like lower(concat('%',:query,'%')) or lower(l.city_municipality) like lower(concat('%',:query,'%')))
          and (coalesce(:city,'')='' or lower(l.city_municipality)=lower(:city))
          and (:courtType is null or c.court_type=:courtType)
        """, nativeQuery = true)
    Page<Facility> discover(@Param("query") String query, @Param("city") String city, @Param("courtType") String courtType, Pageable pageable);
}
