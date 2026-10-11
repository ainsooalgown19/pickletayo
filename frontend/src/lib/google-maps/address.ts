export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types: string[];
};

export type FacilityLocationFields = {
  addressLine1: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  landmark: string;
};

function component(components: GoogleAddressComponent[], type: string, short = false) {
  const match = components.find((item) => item.types.includes(type));
  if (!match) return "";
  return short
    ? match.shortText ?? match.short_name ?? match.longText ?? match.long_name ?? ""
    : match.longText ?? match.long_name ?? match.shortText ?? match.short_name ?? "";
}

export function facilityLocationFromGoogle(
  components: GoogleAddressComponent[],
  formattedAddress: string,
  latitude: number,
  longitude: number,
  displayName = "",
): FacilityLocationFields {
  const street = [
    component(components, "subpremise"),
    component(components, "street_number"),
    component(components, "route"),
  ].filter(Boolean).join(" ");

  return {
    addressLine1: street || component(components, "premise") || formattedAddress,
    barangay: component(components, "sublocality_level_1") || component(components, "sublocality") || component(components, "neighborhood"),
    city: component(components, "locality") || component(components, "postal_town") || component(components, "administrative_area_level_2"),
    province: component(components, "administrative_area_level_1"),
    postalCode: component(components, "postal_code"),
    latitude: latitude.toFixed(7),
    longitude: longitude.toFixed(7),
    landmark: displayName,
  };
}
