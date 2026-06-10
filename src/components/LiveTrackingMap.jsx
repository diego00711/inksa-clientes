// src/components/LiveTrackingMap.jsx
// Mapa de rastreamento em tempo real: mostra restaurante, destino do cliente
// e a posição ao vivo do entregador, com rota e ETA dinamico calculado pela
// distancia entregador -> destino. Reutiliza o mesmo stack (Leaflet) do app
// do entregador para manter consistencia.

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige o bug classico dos icones default do Leaflet com bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Marcadores customizados com emoji (visual mais proximo dos grandes apps)
function emojiIcon(emoji, ring) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:38px;width:38px;height:38px;text-align:center;
      background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.25);
      border:2px solid ${ring};">${emoji}</div>`,
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

const DRIVER_ICON = emojiIcon("\u{1F6F5}", "#FF6F00"); // 🛵
const REST_ICON = emojiIcon("\u{1F3EA}", "#16a34a");   // 🏪
const DEST_ICON = emojiIcon("\u{1F4CD}", "#dc2626");   // 📍

// Distancia em km (Haversine)
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ETA em minutos a partir da distancia (velocidade urbana media ~22 km/h)
export function etaMinutes(driver, dest) {
  const km = haversineKm(driver, dest);
  if (km == null) return null;
  return Math.max(2, Math.round((km / 22) * 60));
}

// Enquadra o mapa em todos os pontos disponiveis e re-centra quando o
// entregador se move.
function FitBounds({ points, follow }) {
  const map = useMap();
  useMemo(() => {
    const valid = points.filter(Boolean);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 15, { animate: true });
    } else if (follow) {
      // segue o entregador mantendo o destino visivel
      map.fitBounds(valid.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 16 });
    } else {
      map.fitBounds(valid.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), follow]);
  return null;
}

export default function LiveTrackingMap({ driver, restaurant, destination }) {
  const points = [driver, restaurant, destination].filter(Boolean);
  const center = driver || destination || restaurant || { lat: -27.2178, lng: -49.645 };

  // Linha da rota: entregador -> destino (foco do cliente)
  const routeLine =
    driver && destination
      ? [[driver.lat, driver.lng], [destination.lat, destination.lng]]
      : null;

  return (
    <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#FF6F00", weight: 4, opacity: 0.7, dashArray: "8 8" }}
          />
        )}

        {restaurant && (
          <Marker position={[restaurant.lat, restaurant.lng]} icon={REST_ICON}>
            <Popup>Restaurante</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DEST_ICON}>
            <Popup>Voce</Popup>
          </Marker>
        )}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={DRIVER_ICON}>
            <Popup>Entregador</Popup>
          </Marker>
        )}

        <FitBounds points={points} follow={!!driver} />
      </MapContainer>
    </div>
  );
}
