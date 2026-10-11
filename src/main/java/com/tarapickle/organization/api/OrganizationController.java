package com.tarapickle.organization.api;

import com.tarapickle.organization.api.OrganizationDtos.*;
import com.tarapickle.organization.application.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/organizations") @RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService service;

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public OrganizationResponse create(@Valid @RequestBody CreateOrganizationRequest request) { return service.create(request); }

    @GetMapping @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public Page<OrganizationResponse> list(@PageableDefault(size = 20, sort = "displayName") Pageable pageable) { return service.list(pageable); }

    @GetMapping("/mine")
    public Page<OrganizationResponse> mine(@AuthenticationPrincipal Jwt jwt,@PageableDefault(size=50,sort="displayName") Pageable pageable) { return service.mine(UUID.fromString(jwt.getSubject()),pageable); }
}
