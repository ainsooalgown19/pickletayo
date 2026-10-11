package com.tarapickle.facility.api;

import com.tarapickle.facility.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

public final class FacilityDtos {
    private FacilityDtos() {}
    public record LocationRequest(@NotBlank @Size(max=200) String addressLine1, @Size(max=200) String addressLine2,
            @Size(max=120) String barangay, @NotBlank @Size(max=120) String city, @NotBlank @Size(max=120) String province,
            @Size(max=20) String postalCode, @NotNull @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude, @Size(max=1000) String directionsLandmark) {}
    public record CreateFacilityRequest(@NotBlank @Size(max=160) String name, @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{2,40}") String branchCode,
            @Size(max=5000) String description, @Size(max=40) String contactNumber, @Email @Size(max=320) String contactEmail,
            @NotBlank String timezone, @NotNull @Valid LocationRequest location) {}
    public record CreateCourtRequest(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String code, @NotBlank @Size(max=120) String name,
            @NotNull CourtType type, @NotBlank @Size(max=80) String surfaceType, boolean lighting,
            @NotNull @DecimalMin("0.00") BigDecimal baseHourlyRate) {}
    public record ChangeFacilityStatusRequest(@NotNull FacilityStatus status) {}
    public record OperatingHoursRequest(@Min(1) @Max(7) int dayOfWeek, boolean closed, LocalTime opensAt, LocalTime closesAt) {}
    public record CreateRateRuleRequest(@NotBlank @Size(max=120) String name, @Min(1) @Max(7) Integer dayOfWeek,
            LocalTime startsAt, LocalTime endsAt, @NotNull @DecimalMin("0.00") BigDecimal hourlyRate,
            LocalDate effectiveFrom, LocalDate effectiveUntil, int priority) {}
    public record CreateAvailabilityBlockRequest(@NotNull AvailabilityBlockType type,@NotNull Instant startsAt,@NotNull Instant endsAt,@Size(max=500) String reason) {}
    public record LocationResponse(String addressLine1, String addressLine2, String barangay, String city, String province,
            String postalCode, String countryCode, BigDecimal latitude, BigDecimal longitude, String directionsLandmark, boolean verified) {}
    public record CourtResponse(UUID courtId, String code, String name, CourtType type, String surfaceType, CourtStatus status,
            boolean lighting, BigDecimal baseHourlyRate, String currencyCode) {}
    public record FacilitySummaryResponse(UUID facilityId, String name, FacilityStatus status, String city, String province,
            BigDecimal latitude, BigDecimal longitude, int activeCourts, BigDecimal startingHourlyRate, String currencyCode) {}
    public record FacilityDetailResponse(UUID facilityId, UUID organizationId, String name, String branchCode, String description,
            FacilityStatus status, String contactNumber, String contactEmail, String timezone, LocationResponse location,
            List<CourtResponse> courts, Instant createdAt) {}
    public record AvailabilitySlotResponse(UUID courtId,String courtName,Instant startsAt,Instant endsAt,BigDecimal price,String currencyCode) {}
    public record FacilityAvailabilityResponse(UUID facilityId,LocalDate date,String timezone,int durationMinutes,List<AvailabilitySlotResponse> slots) {}
}
