/**
 * Helper to fetch coordinates and bounding boxes from OpenStreetMap Nominatim API.
 * Nominatim requires a valid Use-Agent.
 */
export async function searchLocation(query: string) {
  if (!query) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "NewsBI-Pulse/1.0",
        },
      }
    );

    if (!res.ok) throw new Error("Nominatim API error");

    const data = await res.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        boundingbox: result.boundingbox, // [latMin, latMax, lonMin, lonMax]
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}
