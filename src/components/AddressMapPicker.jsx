// src/components/AddressMapPicker.jsx
// Mapa com marcador arrastável para o cliente marcar o ponto exato da entrega.
// Clicar no mapa ou arrastar o pino atualiza as coordenadas. Botão de
// geolocalização usa o Capacitor (mobile) com fallback para o navegador.

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import { useToast } from "../context/ToastContext";
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
  const { addToast } = useToast();
  const pos = value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : null;
  const center = pos || DEFAULT_CENTER;

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      // Tenta Capacitor primeiro (build mobile); cai no navegador no web
      let coords;
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        // Pede permissão explicitamente antes (Android 13+)
        try { await Geolocation.requestPermissions(); } catch {}
        const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
        coords = { lat: p.coords.latitude, lng: p.coords.longitude };
      } catch (capErr) {
        coords = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("Seu navegador não suporta localização"));
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            (err) => {
              const msg = err.code === 1
                ? "Permissão de localização negada. Habilite nas configurações do app."
                : err.code === 2
                ? "Não foi possível obter sua localização. Verifique o GPS."
                : err.code === 3
                ? "Tempo esgotado ao buscar localização. Tente de novo."
                : "Erro ao buscar localização.";
              reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 15000 },
          );
        });
      }
      onChange(coords);
      addToast("success", "Localização capturada! Confira o pino no mapa.");
    } catch (err) {
      addToast("error", err?.message || "Não foi possível obter sua localização. Toque no mapa pra marcar manualmente.");
    } finally {
      setLocating(false);
    }
  }, [onChange, addToast]);

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
