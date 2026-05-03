export interface Coordinates {
    lat: number;
    lng: number;
  }
  
  export function buildAddressString(parts: {
    address_line1?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  }) {
    return [
      parts.address_line1,
      parts.city,
      parts.state,
      parts.postal_code,
      parts.country,
    ]
      .filter(Boolean)
      .join(", ");
  }
  
  export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    const userAgent =
      process.env.NOMINATIM_USER_AGENT ??
      "Haul.co Academic Project elliotdelaney05@gmail.com";
  
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
  
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": userAgent,
        Referer: "https://haul.co",
      },
    });
  
    if (!res.ok) {
      console.error("Nominatim geocoding failed:", res.status);
      return null;
    }
  
    const data = await res.json();
  
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
  
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  }
  
  export async function getDrivingDistanceKm(
    from: Coordinates,
    to: Coordinates
  ): Promise<number | null> {
    const apiKey = process.env.ORS_API_KEY;
  
    if (!apiKey) {
      throw new Error("ORS_API_KEY is not set");
    }
  
    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ],
        }),
      }
    );
  
    if (!res.ok) {
      console.error("openrouteservice distance failed:", res.status);
      return null;
    }
  
    const data = await res.json();
    const metres = data?.routes?.[0]?.summary?.distance;
  
    if (typeof metres !== "number") {
      return null;
    }
  
    return metres / 1000;
  }