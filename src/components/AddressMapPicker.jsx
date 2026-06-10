// src/components/AddressMapPicker.jsx
// Mapa com marcador arrastável para o cliente marcar o ponto exato da entrega.
// Clicar no mapa ou arrastar o pino atualiza as coordenadas. Botão de
// geolocalização usa o Capacitor (mobile) com fallback para o navegador.

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = { lat: -27.2178, lng: -49.645 }; // Rio do Sul, SC

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  if (position) map.setView([position.lat, position.lng], map.getZoom() || 16, { animate: true });
  return null;
}

export default function AddressMapPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false);
  const pos = value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : null;
  const center = pos || DEFAULT_CENTER;

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      // Tenta Capacitor primeiro (build mobile); cai no navegador no web
      let coords;
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        coords = { lat: p.coords.latitude, lng: p.coords.longitude };
      } catch {
        coords = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("sem geolocalização"));
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            reject,
            { enableHighAccuracy: true, timeout: 10000 },
          );
        });
      }
      onChange(coords);
    } catch {
      // silencioso — usuário pode marcar manualmente
    } finally {
      setLocating(false);
    }
  }, [onChange]);

  return (
    <div className="relative">
      <div className="h-52 rounded-xl overflow-hidden border border-gray-200 relative z-0">
        <MapContainer center={[center.lat, center.lng]} zoom={pos ? 16 : 13} style={{ height: "100%", width: "100%" }} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onPick={onChange} />
          {pos && (
            <Marker
              position={[pos.lat, pos.lng]}
              draggable
              eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); onChange({ lat: ll.lat, lng: ll.lng }); } }}
            />
          )}
          <Recenter position={pos} />
        </MapContainer>
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="absolute bottom-3 right-3 z-10 bg-white shadow-md rounded-full px-3 py-2 text-sm font-medium flex items-center gap-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4 text-orange-500" />}
        Minha localização
      </button>
      <p className="text-xs text-gray-500 mt-1.5">Toque no mapa ou arraste o pino para marcar o ponto exato da entrega.</p>
    </div>
  );
}
