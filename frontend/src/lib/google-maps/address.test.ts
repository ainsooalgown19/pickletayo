import { describe, expect, it } from "vitest";
import { facilityLocationFromGoogle, type GoogleAddressComponent } from "./address";

function part(type: string, longText: string, shortText = longText): GoogleAddressComponent {
  return { types: [type], longText, shortText };
}

describe("Google Maps facility location mapping", () => {
  it("maps Philippine address components into the facility form", () => {
    const result = facilityLocationFromGoogle([
      part("street_number", "123"),
      part("route", "Ayala Avenue"),
      part("sublocality_level_1", "San Lorenzo"),
      part("locality", "Makati"),
      part("administrative_area_level_1", "Metro Manila", "NCR"),
      part("postal_code", "1223"),
    ], "123 Ayala Avenue, Makati", 14.5521, 121.0234, "PickleTayo Makati");

    expect(result).toEqual({
      addressLine1: "123 Ayala Avenue",
      barangay: "San Lorenzo",
      city: "Makati",
      province: "Metro Manila",
      postalCode: "1223",
      latitude: "14.5521000",
      longitude: "121.0234000",
      landmark: "PickleTayo Makati",
    });
  });

  it("uses the formatted address and administrative area when street and city are absent", () => {
    const result = facilityLocationFromGoogle([
      part("administrative_area_level_2", "Cebu City"),
      part("administrative_area_level_1", "Central Visayas"),
    ], "Cebu City, Cebu, Philippines", 10.3157, 123.8854);

    expect(result.addressLine1).toBe("Cebu City, Cebu, Philippines");
    expect(result.city).toBe("Cebu City");
    expect(result.province).toBe("Central Visayas");
  });
});
