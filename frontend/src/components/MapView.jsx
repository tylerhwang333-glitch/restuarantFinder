import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function pinIcon(emoji, active) {
  return L.divIcon({
    className: '',
    html: `<div class="flex h-9 w-9 items-center justify-center rounded-full border-2 ${
      active ? 'border-blue-600 bg-blue-600 scale-125' : 'border-white bg-slate-800'
    } text-base shadow-lg transition-transform">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

const userIcon = L.divIcon({
  className: '',
  html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.25)]"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView({ coords, restaurants, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // The map panel can be hidden (display:none) behind the mobile list/map
    // toggle, so Leaflet may init at zero size; recalculate whenever the
    // container's actual size changes (including going from 0 to visible).
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Center on the user once we know where they are.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords) return;
    map.setView([coords.lat, coords.lon], 14);
    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = L.marker([coords.lat, coords.lon], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('You are here');
  }, [coords]);

  // Sync restaurant markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set();
    restaurants.forEach((r) => {
      if (r.lat == null || r.lon == null) return;
      seen.add(r.id);
      const emoji = r.photo?.emoji || '🍽️';
      const isActive = r.id === selectedId;
      const existing = markersRef.current.get(r.id);
      if (existing) {
        existing.setIcon(pinIcon(emoji, isActive));
        existing.setZIndexOffset(isActive ? 500 : 0);
      } else {
        const marker = L.marker([r.lat, r.lon], { icon: pinIcon(emoji, isActive) })
          .addTo(map)
          .bindPopup(`<strong>${r.name}</strong>${r.address ? `<br/>${r.address}` : ''}`)
          .on('click', () => onSelect?.(r.id));
        markersRef.current.set(r.id, marker);
      }
    });

    // Remove markers for restaurants no longer in the list.
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [restaurants, selectedId, onSelect]);

  // Pan to the selected restaurant.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markersRef.current.get(selectedId);
    if (!map || !marker) return;
    map.panTo(marker.getLatLng());
    marker.openPopup();
  }, [selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
