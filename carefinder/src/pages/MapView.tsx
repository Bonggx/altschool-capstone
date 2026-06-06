import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitals();
  }, []);

  async function fetchHospitals() {
    const { data } = await supabase
      .from("hospitals")
      .select("id, name, city, state, latitude, longitude, ownership_type, average_rating")
      .eq("is_approved", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    if (data) setHospitals(data);
    setLoading(false);
  }

  useEffect(() => {
    if (loading || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [8.6753, 9.082],
      zoom: 5.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      hospitals.forEach((h) => {
        if (!h.latitude || !h.longitude) return;

        // Visible circular marker
        const el = document.createElement("div");
        el.style.cssText = `
          width: 18px;
          height: 18px;
          background: ${h.ownership_type === "public" ? "#3b82f6" : "#f43f6e"};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        `;

        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
          .setHTML(`
            <div style="font-family: DM Sans, sans-serif; padding: 6px 2px;">
              <p style="font-weight: 700; font-size: 13px; color: #111; margin: 0 0 2px;">${h.name}</p>
              <p style="font-size: 11px; color: #888; margin: 0 0 8px;">${h.city}, ${h.state}</p>
              <a href="/hospital/${h.id}" style="font-size: 12px; color: #e0184d; font-weight: 600; text-decoration: none;">
                View details →
              </a>
            </div>
          `);

        new mapboxgl.Marker(el)
          .setLngLat([h.longitude, h.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Try to fly to user location
      navigator.geolocation?.getCurrentPosition((pos) => {
        map.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 10,
          duration: 1500,
        });
      });
    });

    return () => { map.current?.remove(); map.current = null; };
  }, [loading, hospitals]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center gap-6 px-4 py-2.5 bg-white border-b border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border-2 border-white shadow-sm" /> Public hospital
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand-500 inline-block border-2 border-white shadow-sm" /> Private hospital
        </span>
        {loading
          ? <span className="text-brand-400 animate-pulse">Loading hospitals...</span>
          : <span>{hospitals.length} hospitals on map</span>
        }
        <button
          onClick={() => navigate("/search")}
          className="ml-auto text-brand-600 font-medium hover:text-brand-800 transition-colors"
        >
          Search hospitals →
        </button>
      </div>
      <div ref={mapContainer} className="flex-1 w-full" />
    </div>
  );
}
