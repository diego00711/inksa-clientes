// src/components/LiveTrackingMap.jsx
// Mapa de rastreamento em tempo real: mostra restaurante, destino do cliente
// e a posição ao vivo do entregador, com rota e ETA dinamico calculado pela
// distancia entregador -> destino. Reutiliza o mesmo stack (Leaflet) do app
// do entregador para manter consistencia.

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_URL, TILE_ATTRIBUTION } from '../lib/mapTiles';

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

// Distância em metros, só pra decidir se vale pedir a rota de novo.
function metros(aLat, aLng, bLat, bLng) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function LiveTrackingMap({ driver, restaurant, destination }) {
  const points = [driver, restaurant, destination].filter(Boolean);
  const center = driver || destination || restaurant || { lat: -27.2178, lng: -49.645 };

  // ── ROTA PELA RUA, NÃO LINHA RETA ──────────────────────────────────────────
  //
  // A linha era um traço direto do entregador ao destino: atravessava
  // quarteirão, rio e prédio. O cliente olhava e via o entregador "cortando
  // caminho" por onde não existe rua.
  //
  // Quem desenha a rota é o OSRM, o MESMO roteador que o app do entregador já
  // usa (inksa-entregadores/src/components/MapDisplay.jsx). Não é serviço novo
  // nem chave nova — é o mesmo, agora dos dois lados.
  //
  // ⚠️ É O SERVIDOR PÚBLICO DE DEMONSTRAÇÃO do projeto OSRM. Aguenta o volume
  // de hoje com folga, mas não tem compromisso de disponibilidade: pode
  // limitar ou sair do ar. Por isso a linha reta continua aqui como reserva —
  // se a rota não vier, o mapa desenha o traço e ninguém fica sem nada.
  const [rotaGeo, setRotaGeo] = useState(null);
  const pedidaDe = useRef(null);

  useEffect(() => {
    if (!driver || !destination) { setRotaGeo(null); return undefined; }
    const { lat: dLat, lng: dLng } = driver;
    const { lat: tLat, lng: tLng } = destination;

    // Só refaz quando o destino muda ou o entregador andou de verdade.
    // 120 m ≈ um quarteirão: abaixo disso a rota desenhada continua correta, e
    // pedir a cada respiro do GPS castigaria um servidor que é emprestado.
    const ref = pedidaDe.current;
    if (ref && ref.tLat === tLat && ref.tLng === tLng
        && metros(ref.dLat, ref.dLng, dLat, dLng) < 120) return undefined;
    pedidaDe.current = { dLat, dLng, tLat, tLng };

    let vivo = true;
    const ctrl = new AbortController();
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${tLng},${tLat}`
      + '?overview=full&geometries=geojson',
      { signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('osrm'))))
      .then((d) => {
        if (!vivo) return;
        const coords = d?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length) {
          setRotaGeo(coords.map(([lng, lat]) => [lat, lng]));
        }
      })
      .catch(() => { if (vivo) setRotaGeo(null); });  // cai na reserva
    return () => { vivo = false; ctrl.abort(); };
  }, [driver?.lat, driver?.lng, destination?.lat, destination?.lng]);

  const linhaReta =
    driver && destination
      ? [[driver.lat, driver.lng], [destination.lat, destination.lng]]
      : null;
  const routeLine = rotaGeo || linhaReta;
  // Traço pontilhado quando é a reserva (é estimativa); sólido quando é a rota
  // de verdade. A diferença conta ao cliente o que ele está vendo.
  const rotaReal = Boolean(rotaGeo);

  return (
    <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#FF6F00", weight: rotaReal ? 5 : 4,
                          opacity: rotaReal ? 0.85 : 0.6,
                          dashArray: rotaReal ? undefined : "8 8" }}
          />
        )}

        {restaurant && (
          <Marker position={[restaurant.lat, restaurant.lng]} icon={REST_ICON}>
            <Popup>Loja</Popup>
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
