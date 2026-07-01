import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AddressService from '../services/addressService';

const LocationContext = createContext();

const AUTH_TOKEN_KEY = 'clientAuthToken';

/**
 * Estratégia de localização (resolve "Entrega a calcular" e a demora):
 *  1. Usa IMEDIATAMENTE o endereço cadastrado (padrão) do cliente — instantâneo,
 *     sem prompt de GPS. Isso já libera o cálculo do frete por distância.
 *  2. Em paralelo tenta o GPS; se o usuário permitir e for mais preciso, atualiza.
 *  3. Se não houver nem endereço nem GPS, marca erro (mostra "Ativar localização").
 */
export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [source, setSource] = useState(null); // 'address' | 'gps'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback: endereço padrão salvo do cliente
  const loadDefaultAddress = useCallback(async () => {
    // Só tenta se estiver logado (evita 401 desnecessário)
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return null;
    try {
      const list = await AddressService.list();
      if (!Array.isArray(list) || list.length === 0) return null;
      // A API já ordena is_default primeiro
      const def = list.find((a) => a.is_default) || list[0];
      const lat = Number(def?.latitude);
      const lng = Number(def?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let settledFromAddress = false;

    // 1) Endereço cadastrado — resposta rápida
    loadDefaultAddress().then((coords) => {
      if (!alive || !coords) return;
      settledFromAddress = true;
      setLocation(coords);
      setSource('address');
      setError(null);
      setLoading(false);
    });

    // 2) GPS em paralelo (mais preciso quando disponível)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!alive) return;
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setSource('gps');
          setError(null);
          setLoading(false);
        },
        (err) => {
          if (!alive) return;
          // GPS falhou/negado: se já temos endereço, ignora; senão marca erro
          if (!settledFromAddress) {
            setError(`Não foi possível obter sua localização: ${err.message}`);
            setLoading(false);
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
      );
    } else if (!settledFromAddress) {
      // Sem geolocalização e sem endereço ainda — aguarda o endereço ou marca erro
      setTimeout(() => {
        if (alive && !settledFromAddress) {
          setError('Geolocalização não suportada. Cadastre um endereço para calcular a entrega.');
          setLoading(false);
        }
      }, 2000);
    }

    return () => { alive = false; };
  }, [loadDefaultAddress]);

  // Permite forçar re-carregar (ex: após o cliente salvar um novo endereço)
  const refreshFromAddress = useCallback(async () => {
    const coords = await loadDefaultAddress();
    if (coords) {
      setLocation(coords);
      setSource('address');
      setError(null);
    }
    return coords;
  }, [loadDefaultAddress]);

  const value = { location, source, error, loading, refreshFromAddress };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
}
