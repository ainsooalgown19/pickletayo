package com.tarapickle.organization.api;

import com.tarapickle.organization.domain.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

public final class OrganizationDtos {
    private OrganizationDtos() {}
    public record CreateOrganizationRequest(@NotNull OrganizationType type, @NotBlank @Size(max=200) String legalName,
            @NotBlank @Size(max=160) String displayName, @NotNull UUID ownerUserId) {}
    public record OrganizationResponse(UUID organizationId, OrganizationType type, String legalName, String displayName,
            OrganizationStatus status, UUID ownerUserId, Instant createdAt) {}
}
