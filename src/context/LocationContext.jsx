import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Cria o contexto
const LocationContext = createContext();

// 2. Cria o Provedor (Provider)
export function LocationProvider({ children }) {
  // Estados para guardar a localização, erros ou o estado de carregamento
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pede a localização assim que o componente é montado
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador.');
      setLoading(false);
      return;
    }

    // Função de sucesso: o que fazer quando o navegador nos dá a localização
    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLoading(false);
    };

    // Função de erro: o que fazer se o utilizador negar a permissão ou houver um erro
    const handleError = (error) => {
      setError(`Erro ao obter localização: ${error.message}`);
      setLoading(false);
    };

    // Pede ao navegador a localização do utilizador
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

  }, []); // O array vazio [] garante que isto só é executado uma vez

  // O valor que será partilhado com toda a aplicação
  const value = { location, error, loading };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// 3. Cria um "hook" personalizado para facilitar o uso do contexto
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
}