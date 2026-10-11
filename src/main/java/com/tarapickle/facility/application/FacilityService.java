package com.tarapickle.facility.application;

import com.tarapickle.facility.api.FacilityDtos.*;
import com.tarapickle.facility.domain.*;
import com.tarapickle.facility.infrastructure.*;
import com.tarapickle.organization.application.OrganizationService;
import com.tarapickle.shared.application.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.ZoneId;
import java.util.*;

@Service @RequiredArgsConstructor
public class FacilityService {
    private final FacilityRepository facilities;
    private final FacilityLocationRepository locations;
    private final CourtRepository courts;
    private final OrganizationService organizations;
    private final Clock clock;

    @Transactional
    public FacilityDetailResponse create(UUID organizationId, UUID actorId, boolean platformAdmin, CreateFacilityRequest request) {
        var organization = organizations.require(organizationId);
        authorize(organizationId, actorId, platformAdmin);
        if (facilities.existsByOrganizationIdAndBranchCodeIgnoreCase(organizationId, request.branchCode())) throw ApplicationException.conflict("BRANCH_CODE_EXISTS", "Branch code is already used by this organization.");
        try { ZoneId.of(request.timezone()); } catch (Exception invalid) { throw new ApplicationException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TIMEZONE", "Timezone must be a valid IANA timezone."); }
        var now=clock.instant(); var id=UUID.randomUUID();
        var facility=facilities.save(new Facility(id, organization.getId(), request.name().strip(), request.branchCode().strip().toUpperCase(Locale.ROOT), request.description(), request.contactNumber(), request.contactEmail(), request.timezone(), now));
        var l=request.location(); locations.save(new FacilityLocation(UUID.randomUUID(), id, l.addressLine1(), l.addressLine2(), l.barangay(), l.city(), l.province(), l.postalCode(), l.latitude(), l.longitude(), l.directionsLandmark()));
        return detail(facility);
    }

    @Transactional
    public CourtResponse addCourt(UUID facilityId, UUID actorId, boolean platformAdmin, CreateCourtRequest request) {
        var facility=require(facilityId, false); authorize(facility.getOrganizationId(), actorId, platformAdmin);
        if (courts.existsByFacilityIdAndCodeIgnoreCase(facilityId, request.code())) throw ApplicationException.conflict("COURT_CODE_EXISTS", "Court code is already used by this facility.");
        try {
            return court(courts.save(new Court(UUID.randomUUID(), facility.getOrganizationId(), facilityId, request.code().strip().toUpperCase(Locale.ROOT), request.name().strip(), request.type(), request.surfaceType().strip(), request.lighting(), request.baseHourlyRate(), clock.instant())));
        } catch (DataIntegrityViolationException conflict) { throw ApplicationException.conflict("COURT_CODE_EXISTS", "Court code is already used by this facility."); }
    }

    @Transactional
    public FacilityDetailResponse changeStatus(UUID facilityId, UUID actorId, boolean platformAdmin, FacilityStatus next) {
        var facility=require(facilityId, false); authorize(facility.getOrganizationId(), actorId, platformAdmin);
        if (next == FacilityStatus.ACTIVE && courts.findAllByFacilityIdOrderByName(facilityId).isEmpty()) throw new ApplicationException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY, "FACILITY_HAS_NO_COURTS", "Add at least one court before activating the facility.");
        facility.changeStatus(next, clock.instant()); return detail(facility);
    }

    @Transactional(readOnly=true)
    public Page<FacilitySummaryResponse> discover(String query, String city, CourtType type, Pageable pageable) {
        return facilities.discover(clean(query), clean(city), type == null ? null : type.name(), pageable).map(this::summary);
    }

    @Transactional(readOnly=true)
    public Page<FacilitySummaryResponse> manage(UUID organizationId,UUID actorId,boolean platformAdmin,Pageable pageable) {
        organizations.require(organizationId); authorize(organizationId,actorId,platformAdmin);
        return facilities.findAllByOrganizationId(organizationId,pageable).map(this::summary);
    }

    @Transactional(readOnly=true)
    public FacilityDetailResponse publicDetail(UUID id) { return detail(require(id, true)); }

    @Transactional(readOnly=true)
    public Facility managementFacility(UUID id,UUID actorId,boolean platformAdmin) { var facility=require(id,false); authorize(facility.getOrganizationId(),actorId,platformAdmin); return facility; }

    private Facility require(UUID id, boolean activeOnly) {
        var facility=facilities.findById(id).orElseThrow(() -> ApplicationException.notFound("FACILITY_NOT_FOUND", "Facility was not found."));
        if (activeOnly && facility.getStatus()!=FacilityStatus.ACTIVE) throw ApplicationException.notFound("FACILITY_NOT_FOUND", "Facility was not found.");
        return facility;
    }
    private void authorize(UUID organizationId, UUID actorId, boolean platformAdmin) {
        if (!platformAdmin && !organizations.isMember(organizationId, actorId)) throw ApplicationException.forbidden("ORGANIZATION_ACCESS_DENIED", "You cannot manage this organization.");
    }
    private String clean(String value) { return value == null ? "" : value.strip(); }
    private FacilitySummaryResponse summary(Facility facility) {
        var l=location(facility.getId()); var active=courts.findAllByFacilityIdOrderByName(facility.getId()).stream().filter(c->c.getStatus()==CourtStatus.ACTIVE).toList();
        BigDecimal starting=active.stream().map(Court::getBaseHourlyRate).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        return new FacilitySummaryResponse(facility.getId(), facility.getName(), facility.getStatus(), l.getCity(), l.getProvince(), l.getLatitude(), l.getLongitude(), active.size(), starting, "PHP");
    }
    private FacilityDetailResponse detail(Facility facility) {
        var l=location(facility.getId()); return new FacilityDetailResponse(facility.getId(), facility.getOrganizationId(), facility.getName(), facility.getBranchCode(), facility.getDescription(), facility.getStatus(), facility.getContactNumber(), facility.getContactEmail(), facility.getTimezone(), location(l), courts.findAllByFacilityIdOrderByName(facility.getId()).stream().map(this::court).toList(), facility.getCreatedAt());
    }
    private FacilityLocation location(UUID facilityId) { return locations.findByFacilityId(facilityId).orElseThrow(() -> new IllegalStateException("Facility location is missing.")); }
    private LocationResponse location(FacilityLocation l) { return new LocationResponse(l.getAddressLine1(), l.getAddressLine2(), l.getBarangay(), l.getCity(), l.getProvince(), l.getPostalCode(), l.getCountryCode(), l.getLatitude(), l.getLongitude(), l.getDirectionsLandmark(), l.isVerified()); }
    private CourtResponse court(Court c) { return new CourtResponse(c.getId(), c.getCode(), c.getName(), c.getType(), c.getSurfaceType(), c.getStatus(), c.isLighting(), c.getBaseHourlyRate(), c.getCurrencyCode()); }
}
