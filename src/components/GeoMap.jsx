'use client';

import { useEffect, useRef } from 'react';

// Fix Leaflet's broken default icon URLs in Next.js
let iconFixed = false;
function fixLeafletIcons(L) {
  if (iconFixed) return;
  iconFixed = true;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

export default function GeoMap({ lat, lng, city = 'your location', verifying = false, resultVerdict = null, locations = null, height = 220 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null); // Used to hold all markers/circles so they can be cleared easily

  // 1. Initialize Map ONCE
  useEffect(() => {
    let isMounted = true;
    let LMap;

    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return;

      fixLeafletIcons(L.default || L);
      LMap = L.default || L;

      // Clean up any existing map instance on this DOM node if it somehow survived
      const container = LMap.DomUtil.get(mapRef.current);
      if (container != null) {
        container._leaflet_id = null;
      }

      const map = LMap.map(mapRef.current, {
        center: [20.5937, 78.9629], // Default India
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      // Standard OpenStreetMap tiles — reliable and properly attributed.
      // The previous undocumented Google tile endpoint was rate-limited / blocked,
      // which left the map area blank.
      LMap.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Create a layer group to easily manage markers
      const layerGroup = LMap.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      
      mapInstanceRef.current = map;

      // Invalidate size once after a tiny delay just in case container CSS takes a moment
      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []); // NO dependencies! Initialize only once.

  // 2. Update Map Markers when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    // We must dynamically import Leaflet again to get access to L inside this effect
    import('leaflet').then((L) => {
      const LMap = L.default || L;
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;

      // Clear existing markers
      layerGroup.clearLayers();

      if (locations && locations.length > 0) {
        // Global Dashboard Heatmap Mode
        const bounds = [];
        locations.forEach(loc => {
           if (!loc.lat || !loc.lng) return;
           const color = loc.verdict === 'verified' ? '#183D61' : loc.verdict === 'suspicious' ? '#B45309' : '#B91C1C';
           const marker = LMap.circleMarker([loc.lat, loc.lng], {
             radius: 8,
             color: '#ffffff',
             fillColor: color,
             fillOpacity: 0.8,
             weight: 2
           }).bindPopup(`<b>${loc.city || 'Scan Location'}</b><br/>Verdict: <span style="text-transform: capitalize; color: ${color}">${loc.verdict}</span>`);
           
           layerGroup.addLayer(marker);
           bounds.push([loc.lat, loc.lng]);
        });
        
        if (bounds.length > 0) {
           map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 }); 
        }
      } else if (lat && lng) {
        // Single Scanner Mode
        map.setView([lat, lng], 10);
        
        const marker = LMap.marker([lat, lng]);
        
        let label = `<b>Scanning from</b><br/>${city}`;
        if (resultVerdict) {
          label = resultVerdict === 'verified' ? 'Scan complete — Verified'
            : resultVerdict === 'suspicious' ? 'Scan complete — Suspicious'
            : 'Scan complete — Counterfeit risk';
          label += `<br/>${city}`;
        }
        
        marker.bindPopup(label, { closeButton: false }).openPopup();
        layerGroup.addLayer(marker);

        const colorMap = {
          verified:    { color: '#183D61', fill: '#183D61' },
          suspicious:  { color: '#B45309', fill: '#B45309' },
          counterfeit: { color: '#B91C1C', fill: '#B91C1C' },
        };
        const col = verifying
          ? { color: '#ACD99C', fill: '#ACD99C' }
          : colorMap[resultVerdict] || { color: '#8D99A6', fill: '#8D99A6' };

        const circle = LMap.circle([lat, lng], {
          radius: 12000,
          color: col.color,
          fillColor: col.fill,
          fillOpacity: 0.15,
          weight: 2,
        });
        layerGroup.addLayer(circle);
      }
    });
  }, [lat, lng, city, locations, verifying, resultVerdict]);

  return (
    <div style={{ position: 'relative', height: height, width: '100%' }}>
      {/* Status overlay */}
      {verifying && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
          padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
          color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-color)', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ACD99C', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
          Checking distribution zones…
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          background: '#f1f5f9',
        }}
      />
    </div>
  );
}
