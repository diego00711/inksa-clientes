// RotatingBanner.jsx - Código Completo Corrigido

import React, { useState, useEffect } from 'react';

const RotatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL corrigida com /api/banners/
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://inksa-auth-flask-dev.onrender.com';

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('🔍 Iniciando busca de banners...');
        console.log('🔧 API_BASE_URL:', API_BASE_URL);
        
        // URL CORRIGIDA: /api/banners/ em vez de /banners
        const url = `${API_BASE_URL}/api/banners/`;
        console.log('📡 URL completa:', url);
        
        const response = await fetch(url);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw data from backend:', data);
        console.log('📦 Data type:', typeof data);
        
        // O backend retorna: {"status": "success", "data": [...]}
        if (data.status === 'success' && Array.isArray(data.data)) {
          console.log('✅ Banners encontrados:', data.data.length);
          console.log('📋 Banners data:', data.data);
          
          // Para clientes, todos os banners retornados já são ativos
          // O backend já filtra is_active=true para requisições não-admin
          console.log('✅ All banners from backend are active:', data.data.length);
          
          setBanners(data.data);
        } else {
          console.warn('⚠️ Estrutura de dados inesperada:', data);
          setError('Formato de dados inesperado');
        }
      } catch (error) {
        console.error('❌ Error fetching banners:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 4000); // Troca a cada 4 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (loading) {
    return (
      <div className="banner-container loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        background: '#f5f5f5',
        color: '#666',
        fontSize: '1.1rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div>Carregando banners...</div>
      </div>
    );
  }

  if (error) {
    console.error('🚨 Banner error state:', error);
    return (
      <div className="banner-container error" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        background: '#f5f5f5',
        color: '#666',
        fontSize: '1.1rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <p>Erro ao carregar banners: {error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    console.warn('⚠️ No banners to display');
    return (
      <div className="banner-container empty" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        background: '#f5f5f5',
        color: '#666',
        fontSize: '1.1rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <p>Nenhum banner disponível no momento.</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  console.log('🎯 Current banner being displayed:', currentBanner);
  
  // Limpar URL da imagem removendo ? extra no final
  const cleanImageUrl = currentBanner.image_url?.replace(/\?+$/, '');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '300px',
      marginBottom: '2rem',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <div 
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.5s ease-in-out',
          backgroundImage: `url(${cleanImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div style={{
          textAlign: 'center',
          color: 'white',
          zIndex: 2,
          padding: '2rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            margin: '0 0 0.5rem 0'
          }}>
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && currentBanner.subtitle !== 'EMPTY' && currentBanner.subtitle !== '' && (
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '1rem',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              margin: '0 0 1rem 0'
            }}>
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.link_url && currentBanner.link_url !== 'text' && currentBanner.link_url !== '/' && (
            <a 
              href={currentBanner.link_url} 
              style={{
                display: 'inline-block',
                background: '#ff6b35',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'background-color 0.3s ease'
              }}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) => e.target.style.background = '#e55a2b'}
              onMouseLeave={(e) => e.target.style.background = '#ff6b35'}
            >
              Saiba Mais
            </a>
          )}
        </div>
      </div>
      
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 3
        }}>
          {banners.map((_, index) => (
            <button
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RotatingBanner;
