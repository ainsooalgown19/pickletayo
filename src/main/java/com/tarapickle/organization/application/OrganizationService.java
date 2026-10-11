package com.tarapickle.organization.application;

import com.tarapickle.identity.domain.repository.RoleRepository;
import com.tarapickle.identity.domain.repository.UserRepository;
import com.tarapickle.organization.api.OrganizationDtos.*;
import com.tarapickle.organization.domain.*;
import com.tarapickle.organization.infrastructure.*;
import com.tarapickle.shared.application.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class OrganizationService {
    private final OrganizationRepository organizations;
    private final OrganizationMemberRepository members;
    private final UserRepository users;
    private final RoleRepository roles;
    private final Clock clock;

    @Transactional
    public OrganizationResponse create(CreateOrganizationRequest request) {
        users.findById(request.ownerUserId()).orElseThrow(() -> ApplicationException.notFound("OWNER_NOT_FOUND", "Organization owner was not found."));
        var now = clock.instant();
        var organization = organizations.save(new Organization(UUID.randomUUID(), request.type(), request.legalName().strip(), request.displayName().strip(), request.ownerUserId(), now));
        String roleCode = request.type() == OrganizationType.CLUB ? "CLUB_ADMIN" : "COURT_OWNER";
        var role = roles.findByCode(roleCode).orElseThrow(() -> new IllegalStateException(roleCode + " role has not been seeded."));
        members.save(new OrganizationMember(UUID.randomUUID(), organization.getId(), request.ownerUserId(), role.getId(), now));
        return response(organization);
    }

    @Transactional(readOnly = true)
    public Page<OrganizationResponse> list(Pageable pageable) { return organizations.findAll(pageable).map(this::response); }

    @Transactional(readOnly = true)
    public Page<OrganizationResponse> mine(UUID userId,Pageable pageable) { return organizations.findActiveForUser(userId,pageable).map(this::response); }

    @Transactional(readOnly = true)
    public Organization require(UUID id) { return organizations.findById(id).orElseThrow(() -> ApplicationException.notFound("ORGANIZATION_NOT_FOUND", "Organization was not found.")); }

    @Transactional(readOnly = true)
    public boolean isMember(UUID organizationId, UUID userId) { return members.existsByOrganizationIdAndUserIdAndStatus(organizationId, userId, MembershipStatus.ACTIVE); }

    private OrganizationResponse response(Organization value) {
        return new OrganizationResponse(value.getId(), value.getType(), value.getLegalName(), value.getDisplayName(), value.getStatus(), value.getOwnerUserId(), value.getCreatedAt());
    }
}
