package com.tarapickle.facility.api;

import com.tarapickle.facility.api.FacilityDtos.*;
import com.tarapickle.facility.application.FacilityService;
import com.tarapickle.facility.domain.CourtType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.time.LocalDate;

@RestController @RequiredArgsConstructor
public class FacilityController {
    private final FacilityService service;
    private final com.tarapickle.facility.application.AvailabilityService availability;

    @GetMapping("/api/v1/facilities")
    public Page<FacilitySummaryResponse> discover(@RequestParam(required=false) String query, @RequestParam(required=false) String city,
            @RequestParam(required=false) CourtType courtType, @PageableDefault(size=20, sort="facility_name") Pageable pageable) {
        return service.discover(query, city, courtType, pageable);
    }
    @GetMapping("/api/v1/facilities/{facilityId}")
    public FacilityDetailResponse detail(@PathVariable UUID facilityId) { return service.publicDetail(facilityId); }
    @GetMapping("/api/v1/facilities/{facilityId}/availability")
    public FacilityAvailabilityResponse availability(@PathVariable UUID facilityId,@RequestParam LocalDate date,@RequestParam(defaultValue="60") int durationMinutes) { return availability.availability(facilityId,date,durationMinutes); }

    @PostMapping("/api/v1/organizations/{organizationId}/facilities") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public FacilityDetailResponse create(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt, @PathVariable UUID organizationId,
            @Valid @RequestBody CreateFacilityRequest request) { return service.create(organizationId, uid(jwt), admin(jwt), request); }

    @GetMapping("/api/v1/organizations/{organizationId}/facilities")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public Page<FacilitySummaryResponse> manage(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,@PathVariable UUID organizationId,@PageableDefault(size=50,sort="name") Pageable pageable) { return service.manage(organizationId,uid(jwt),admin(jwt),pageable); }

    @PostMapping("/api/v1/facilities/{facilityId}/courts") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public CourtResponse addCourt(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt, @PathVariable UUID facilityId,
            @Valid @RequestBody CreateCourtRequest request) { return service.addCourt(facilityId, uid(jwt), admin(jwt), request); }

    @PatchMapping("/api/v1/facilities/{facilityId}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public FacilityDetailResponse status(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt, @PathVariable UUID facilityId,
            @Valid @RequestBody ChangeFacilityStatusRequest request) { return service.changeStatus(facilityId, uid(jwt), admin(jwt), request.status()); }

    @PutMapping("/api/v1/facilities/{facilityId}/operating-hours")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hours(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,@PathVariable UUID facilityId,@Valid @RequestBody OperatingHoursRequest request) { availability.setHours(facilityId,uid(jwt),admin(jwt),request); }

    @PostMapping("/api/v1/courts/{courtId}/rate-rules") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public void rate(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,@PathVariable UUID courtId,@Valid @RequestBody CreateRateRuleRequest request) { availability.addRate(courtId,uid(jwt),admin(jwt),request); }

    @PostMapping("/api/v1/courts/{courtId}/availability-blocks") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','COURT_OWNER','STAFF')")
    public void block(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,@PathVariable UUID courtId,@Valid @RequestBody CreateAvailabilityBlockRequest request) { availability.addBlock(courtId,uid(jwt),admin(jwt),request); }

    private UUID uid(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
    private boolean admin(Jwt jwt) { var roles=jwt.getClaimAsStringList("roles"); return roles!=null && roles.contains("PLATFORM_ADMIN"); }
}
