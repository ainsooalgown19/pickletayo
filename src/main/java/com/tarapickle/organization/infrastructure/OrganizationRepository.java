package com.tarapickle.organization.infrastructure;
import com.tarapickle.organization.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    @Query("select o from Organization o where o.id in (select m.organizationId from OrganizationMember m where m.userId=:userId and m.status=com.tarapickle.organization.domain.MembershipStatus.ACTIVE)")
    Page<Organization> findActiveForUser(@Param("userId") UUID userId,Pageable pageable);
}
