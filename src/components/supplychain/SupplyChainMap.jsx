'use client';

import { useEffect, useRef } from 'react';

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

/**
 * Interactive Leaflet map showing supply chain checkpoint markers and route lines.
 * Props: { checkpoints: Array, height: number }
 */
export default function SupplyChainMap({ checkpoints = [], height = 380 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return;
      const LMap = L.default || L;
      fixLeafletIcons(LMap);

      const container = LMap.DomUtil.get(mapRef.current);
      if (container != null) container._leaflet_id = null;

      const map = LMap.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      // Standard OpenStreetMap tiles — reliable and properly attributed,
      // unlike the undocumented Google tile endpoint (rate-limited / ToS issues).
      LMap.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const layerGroup = LMap.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update markers when checkpoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      const LMap = L.default || L;
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      if (!checkpoints || checkpoints.length === 0) return;

      const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
      const bounds = [];
      const routeCoords = [];

      sorted.forEach((cp, i) => {
        if (cp.lat == null || cp.lng == null) return;

        const pos = [cp.lat, cp.lng];
        bounds.push(pos);
        routeCoords.push(pos);

        // Color by status
        const colorMap = {
          completed: '#ACD99C',
          current:   '#183D61',
          pending:   '#B8C1CA',
        };
        const color = colorMap[cp.status] || '#8D99A6';
        const radius = cp.status === 'current' ? 10 : 7;
        const weight = cp.status === 'current' ? 3 : 2;

        const marker = LMap.circleMarker(pos, {
          radius,
          color: '#FFFFFF',
          fillColor: color,
          fillOpacity: 0.9,
          weight,
        });

        const typeLabel = (cp.type || 'checkpoint').replace(/_/g, ' ');
        const statusLabel = cp.status === 'completed' ? 'Completed'
          : cp.status === 'current' ? 'In Progress'
          : 'Pending';

        let popupHtml = `
          <div style="font-family:var(--font-sans);min-width:160px">
            <strong style="font-size:13px;color:#1C2733">${cp.name}</strong>
            <div style="font-size:11px;color:#5D6B79;text-transform:capitalize;margin:4px 0 6px">${typeLabel}</div>
            <div style="font-size:11px">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};margin-right:4px;vertical-align:middle"></span>
              <span style="color:${color};font-weight:600">${statusLabel}</span>
            </div>
            ${cp.address ? `<div style="font-size:11px;color:#5D6B79;margin-top:4px">${cp.address}</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupHtml, { closeButton: false });
        layerGroup.addLayer(marker);

        // Add order label
        const label = LMap.divIcon({
          className: '',
          html: `<div style="
            background:${color};color:#fff;width:20px;height:20px;
            border-radius:50%;font-size:10px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);
            transform:translate(-10px,-10px);
          ">${i + 1}</div>`,
          iconSize: [0, 0],
        });
        LMap.marker(pos, { icon: label, interactive: false }).addTo(layerGroup);
      });

      // Draw route lines
      if (routeCoords.length > 1) {
        // Completed route (green)
        const completedIdx = sorted.findIndex(cp => cp.status === 'current');
        const completedEnd = completedIdx >= 0 ? completedIdx + 1 : sorted.filter(cp => cp.status === 'completed').length;

        if (completedEnd > 1) {
          const completedCoords = routeCoords.slice(0, completedEnd);
          LMap.polyline(completedCoords, {
            color: '#ACD99C',
            weight: 3,
            opacity: 0.8,
            dashArray: null,
          }).addTo(layerGroup);
        }

        // Pending route (dashed grey)
        if (completedEnd > 0 && completedEnd < routeCoords.length) {
          const pendingCoords = routeCoords.slice(completedEnd - 1);
          LMap.polyline(pendingCoords, {
            color: '#183D61',
            weight: 2,
            opacity: 0.3,
            dashArray: '8, 6',
          }).addTo(layerGroup);
        }
      }

      // Fit bounds
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      }
    });
  }, [checkpoints]);

  return (
    <div
      ref={mapRef}
      style={{
        height,
        width: '100%',
        background: '#F0F4F8',
      }}
    />
  );
}
