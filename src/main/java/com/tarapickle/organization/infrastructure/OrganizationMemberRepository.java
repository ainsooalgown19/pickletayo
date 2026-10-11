package com.tarapickle.organization.infrastructure;
import com.tarapickle.organization.domain.OrganizationMember;
import com.tarapickle.organization.domain.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    boolean existsByOrganizationIdAndUserIdAndStatus(UUID organizationId, UUID userId, MembershipStatus status);
}
