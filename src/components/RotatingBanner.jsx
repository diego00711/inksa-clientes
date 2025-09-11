// src/components/RotatingBanner.jsx - Versão com debug melhorado

import React, { useState, useEffect } from 'react';

const RotatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      console.log('🔍 Buscando banners...');
      
      // URL do backend em produção
      const baseURL = 'https://inksa-auth-flask-dev.onrender.com';
      
      const response = await fetch(`${baseURL}/api/banners`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      // Garantir que data é um array
      const bannersArray = Array.isArray(data) ? data : [];
      console.log('📋 Todos os banners:', bannersArray);
      
      // Mostrar status de cada banner
      bannersArray.forEach((banner, index) => {
        console.log(`Banner ${index + 1}:`, {
          titulo: banner.titulo,
          ativo: banner.ativo,
          id: banner.id
        });
      });
      
      // Filtrar apenas banners ativos (aceita tanto boolean true quanto string "true")
      const activeBanners = bannersArray.filter(banner => {
        return banner && (banner.ativo === true || banner.ativo === "true" || banner.ativo === 1);
      });
      console.log('✅ Banners ativos:', activeBanners);
      console.log(`📊 Total: ${bannersArray.length} banners, ${activeBanners.length} ativos`);
      
      setBanners(activeBanners);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao buscar banners:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Rotação automática dos banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const handleImageError = (e, bannerTitle) => {
    console.error(`❌ Erro ao carregar imagem do banner: ${bannerTitle}`, e);
    e.target.style.display = 'none';
  };

  const handleImageLoad = (bannerTitle) => {
    console.log(`✅ Imagem carregada com sucesso: ${bannerTitle}`);
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <div>Carregando banners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        backgroundColor: '#ffebee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '2rem',
        color: '#c62828'
      }}>
        <div>
          <p>Erro ao carregar banners: {error}</p>
          <button 
            onClick={fetchBanners}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h2>Bem-vindo ao Inksa Delivery!</h2>
          <p>Pizza, burger e muito mais com facilidade</p>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
            Encontre o melhor restaurante para você
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '300px',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '2rem'
    }}>
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentBanner ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        >
          <img
            src={banner.image_url}    // Campo correto do backend
            alt={banner.title}        // Campo correto do backend
            onLoad={() => handleImageLoad(banner.title)}
            onError={(e) => handleImageError(e, banner.title)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Overlay com informações do banner */}
          {banner.title && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              color: 'white',
              padding: '2rem 1rem 1rem',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                {banner.title}        {/* Campo correto do backend */}
              </h2>
              {banner.subtitle && (
                <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>
                  {banner.subtitle}   {/* Campo correto do backend */}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Indicadores de paginação */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px'
        }}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentBanner ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RotatingBanner;
