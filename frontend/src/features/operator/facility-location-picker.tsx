"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { facilityLocationFromGoogle, type FacilityLocationFields, type GoogleAddressComponent } from "@/lib/google-maps/address";

type LatLng = { lat: () => number; lng: () => number };
type MapListener = { remove: () => void };
type MapInstance = {
  addListener: (name: string, listener: (event: { latLng?: LatLng }) => void) => MapListener;
  fitBounds: (bounds: unknown) => void;
  setCenter: (position: { lat: number; lng: number } | LatLng) => void;
  setZoom: (zoom: number) => void;
};
type MarkerInstance = { map: MapInstance | null; position: { lat: number; lng: number } | LatLng | null };
type GeocoderResult = { address_components: GoogleAddressComponent[]; formatted_address: string };
type GeocoderInstance = { geocode: (request: { location: LatLng }) => Promise<{ results: GeocoderResult[] }> };
type GooglePlace = {
  addressComponents?: GoogleAddressComponent[];
  displayName?: string;
  formattedAddress?: string;
  location?: LatLng;
  viewport?: unknown;
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};
type AutocompleteElement = HTMLElement & { placeholder: string; includedRegionCodes?: string[] };
type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; zoom: number; mapId: string; streetViewControl: boolean; mapTypeControl: boolean }) => MapInstance;
    Geocoder: new () => GeocoderInstance;
    marker: { AdvancedMarkerElement: new (options: { map?: MapInstance | null; position?: { lat: number; lng: number } | LatLng; title: string }) => MarkerInstance };
    places: { PlaceAutocompleteElement: new (options?: { includedRegionCodes?: string[] }) => AutocompleteElement };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    pickleTayoGoogleMaps?: Promise<GoogleMapsApi>;
  }
}

const emptyLocation: FacilityLocationFields = { addressLine1: "", barangay: "", city: "", province: "", postalCode: "", latitude: "", longitude: "", landmark: "" };

function loadGoogleMaps(apiKey: string) {
  if (window.google) return Promise.resolve(window.google);
  if (window.pickleTayoGoogleMaps) return window.pickleTayoGoogleMaps;

  window.pickleTayoGoogleMaps = new Promise<GoogleMapsApi>((resolve, reject) => {
    const callbackName = "__pickleTayoGoogleMapsReady";
    const globals = window as unknown as Record<string, unknown>;
    globals[callbackName] = () => {
      delete globals[callbackName];
      if (window.google) resolve(window.google);
      else reject(new Error("Google Maps did not initialize."));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => { delete globals[callbackName]; reject(new Error("Google Maps could not be loaded.")); };
    document.head.appendChild(script);
  });

  return window.pickleTayoGoogleMaps;
}

export function FacilityLocationPicker() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState(emptyLocation);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!apiKey || !autocompleteRef.current || !mapRef.current) return;
    let disposed = false;
    let mapClick: MapListener | undefined;
    let autocomplete: AutocompleteElement | undefined;
    let selectListener: EventListener | undefined;

    void loadGoogleMaps(apiKey).then((google) => {
      if (disposed || !autocompleteRef.current || !mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, { center: { lat: 14.5995, lng: 120.9842 }, zoom: 11, mapId, streetViewControl: false, mapTypeControl: false });
      const geocoder = new google.maps.Geocoder();
      let marker: MarkerInstance | null = null;
      const updateMarker = (position: LatLng | { lat: number; lng: number }) => {
        if (!marker) marker = new google.maps.marker.AdvancedMarkerElement({ map, position, title: "Facility location" });
        else { marker.map = map; marker.position = position; }
        map.setCenter(position);
        map.setZoom(17);
      };

      autocomplete = new google.maps.places.PlaceAutocompleteElement({ includedRegionCodes: ["ph"] });
      autocomplete.placeholder = "Search an address or facility in the Philippines";
      autocompleteRef.current.replaceChildren(autocomplete);
      selectListener = (event: Event) => {
        const prediction = (event as Event & { placePrediction: { toPlace: () => GooglePlace } }).placePrediction;
        const place = prediction.toPlace();
        void place.fetchFields({ fields: ["addressComponents", "displayName", "formattedAddress", "location", "viewport"] }).then(() => {
          if (!place.location) return;
          setLocation(facilityLocationFromGoogle(place.addressComponents ?? [], place.formattedAddress ?? "", place.location.lat(), place.location.lng(), place.displayName ?? ""));
          updateMarker(place.location);
          if (place.viewport) map.fitBounds(place.viewport);
        });
      };
      autocomplete.addEventListener("gmp-select", selectListener);

      mapClick = map.addListener("click", (event) => {
        if (!event.latLng) return;
        const selected = event.latLng;
        updateMarker(selected);
        void geocoder.geocode({ location: selected }).then(({ results }) => {
          const result = results[0];
          if (!result) return;
          setLocation(facilityLocationFromGoogle(result.address_components, result.formatted_address, selected.lat(), selected.lng()));
        });
      });
    }).catch((cause) => setMapError(cause instanceof Error ? cause.message : "Google Maps could not be loaded."));

    return () => {
      disposed = true;
      mapClick?.remove();
      if (autocomplete && selectListener) autocomplete.removeEventListener("gmp-select", selectListener);
    };
  }, [apiKey, mapId]);

  function update(name: keyof FacilityLocationFields, value: string) {
    setLocation((current) => ({ ...current, [name]: value }));
  }

  return <div className="facility-location-picker">
    {apiKey ? <>
      <div className="map-search-label"><Search size={16}/><span>Search Google Maps</span></div>
      <div className="google-place-search" ref={autocompleteRef}/>
      <div className="facility-map" ref={mapRef} aria-label="Choose the facility location on Google Maps"/>
      <small className="map-help">Select a search result or click the map to fill the address and coordinates.</small>
      {mapError && <div className="form-error" role="alert">{mapError} You can still enter the location manually.</div>}
    </> : <div className="map-setup-notice"><MapPin/><div><strong>Google Maps setup required</strong><span>Add the public Maps API key to activate address search and map selection. Manual fields remain available.</span></div></div>}
    <label>Address<input name="addressLine1" required value={location.addressLine1} onChange={(event) => update("addressLine1", event.target.value)}/></label>
    <div className="form-row"><label>Barangay<input name="barangay" value={location.barangay} onChange={(event) => update("barangay", event.target.value)}/></label><label>City<input name="city" required value={location.city} onChange={(event) => update("city", event.target.value)}/></label></div>
    <div className="form-row"><label>Province<input name="province" required value={location.province} onChange={(event) => update("province", event.target.value)}/></label><label>Postal code<input name="postalCode" value={location.postalCode} onChange={(event) => update("postalCode", event.target.value)}/></label></div>
    <div className="form-row"><label>Latitude<input name="latitude" type="number" step="any" required value={location.latitude} onChange={(event) => update("latitude", event.target.value)}/></label><label>Longitude<input name="longitude" type="number" step="any" required value={location.longitude} onChange={(event) => update("longitude", event.target.value)}/></label></div>
    <label>Directions/landmark<input name="landmark" value={location.landmark} onChange={(event) => update("landmark", event.target.value)}/></label>
  </div>;
}
