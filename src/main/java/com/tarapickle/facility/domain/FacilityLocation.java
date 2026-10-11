package com.tarapickle.facility.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "facility_locations") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FacilityLocation {
    @Id private UUID id;
    @Column(name = "facility_id", nullable = false, unique = true) private UUID facilityId;
    @Column(name = "address_line_1", nullable = false) private String addressLine1;
    @Column(name = "address_line_2") private String addressLine2;
    private String barangay;
    @Column(name = "city_municipality", nullable = false) private String city;
    @Column(nullable = false) private String province;
    @Column(name = "postal_code") private String postalCode;
    @Column(name = "country_code", nullable = false) private String countryCode;
    @Column(nullable = false, precision = 9, scale = 6) private BigDecimal latitude;
    @Column(nullable = false, precision = 9, scale = 6) private BigDecimal longitude;
    @Column(name = "provider_place_id") private String providerPlaceId;
    @Column(name = "directions_landmark") private String directionsLandmark;
    @Column(name = "is_verified", nullable = false) private boolean verified;

    public FacilityLocation(UUID id, UUID facilityId, String addressLine1, String addressLine2, String barangay, String city,
            String province, String postalCode, BigDecimal latitude, BigDecimal longitude, String directionsLandmark) {
        this.id=id; this.facilityId=facilityId; this.addressLine1=addressLine1; this.addressLine2=addressLine2;
        this.barangay=barangay; this.city=city; this.province=province; this.postalCode=postalCode;
        this.countryCode="PH"; this.latitude=latitude; this.longitude=longitude; this.directionsLandmark=directionsLandmark;
    }
}
