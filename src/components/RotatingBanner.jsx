// RotatingBanner.jsx - Código com Posição de Texto Ajustável

import React, { useState, useEffect, useCallback } from 'react';

const RotatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ height: 300, width: 1200 });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://inksa-auth-flask-dev.onrender.com';

  const loadImage = (imageUrl ) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => resolve({ height: img.height, width: img.width });
      img.onerror = (err) => reject(err);
    });
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/banners/`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data)) {
          setBanners(data.data);
          if (data.data.length === 0) console.warn('⚠️ Nenhum banner para exibir');
        } else {
          setError('Formato de dados inesperado');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (banners.length > 0) {
      const currentBanner = banners[currentIndex];
      const cleanImageUrl = currentBanner.image_url?.replace(/\?+$/, '').replace(/\s+/g, '');

      if (cleanImageUrl) {
        setLoading(true);
        loadImage(cleanImageUrl)
          .then(dimensions => {
            const calculatedHeight = (window.innerWidth / dimensions.width) * dimensions.height;
            setImageDimensions({ height: Math.min(calculatedHeight, 450), width: dimensions.width });
          })
          .catch(() => setImageDimensions({ height: 300, width: 1200 }))
          .finally(() => setLoading(false));
      }
    }
  }, [currentIndex, banners]);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const goToPrevious = () => {
    const isFirstBanner = currentIndex === 0;
    const newIndex = isFirstBanner ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = useCallback(() => {
    const isLastBanner = currentIndex === banners.length - 1;
    const newIndex = isLastBanner ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, banners.length]);

  if (loading && banners.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '12px' }}>Carregando...</div>;
  }
  if (error) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '12px' }}>Erro ao carregar.</div>;
  }
  if (banners.length === 0 && !loading) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '12px' }}>Nenhum banner disponível.</div>;
  }

  const currentBanner = banners[currentIndex];
  const cleanImageUrl = currentBanner?.image_url?.replace(/\?+$/, '').replace(/\s+/g, '');

  // --- NOVA LÓGICA PARA POSICIONAMENTO DO TEXTO ---
  const getTextPositionStyles = (position) => {
    switch (position) {
      case 'left':
        return { justifyContent: 'flex-start', textAlign: 'left' };
      case 'right':
        return { justifyContent: 'flex-end', textAlign: 'right' };
      case 'center':
      default:
        return { justifyContent: 'center', textAlign: 'center' };
    }
  };

  // Pega a posição do banner atual, ou usa 'center' como padrão
  const textPosition = currentBanner?.text_position || 'center';
  const positionStyles = getTextPositionStyles(textPosition);
  // --- FIM DA NOVA LÓGICA ---

  return (
    <div style={{
      position: 'relative', width: '100%', height: `${imageDimensions.height}px`,
      marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', transition: 'height 0.3s ease-in-out'
    }}>
      {/* Container da Imagem */}
      <div style={{
        width: '100%', height: '100%', backgroundImage: `url(${cleanImageUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center'
      }} />

      {/* Container do Conteúdo - AGORA POSICIONADO DINAMICAMENTE */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', padding: '2rem',
        ...positionStyles // Aplica os estilos de posicionamento aqui
      }}>
        <div style={{
          color: 'white', zIndex: 2, background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px', backdropFilter: 'blur(5px)', padding: '2rem',
          // Garante que o box não ocupe a largura toda quando alinhado à esquerda/direita
          maxWidth: '500px' 
        }}>
          <h2 style={{
            fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', margin: 0
          }}>
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && currentBanner.subtitle !== 'EMPTY' && (
            <p style={{
              fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '1rem', opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', margin: '0.5rem 0 1rem 0'
            }}>
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.link_url && currentBanner.link_url !== 'text' && (
            <a href={currentBanner.link_url} style={{
                display: 'inline-block', background: '#ff6b35', color: 'white',
                padding: '0.75rem 1.5rem', borderRadius: '6px', textDecoration: 'none',
                fontWeight: '600', transition: 'background-color 0.3s ease'
              }}
              target="_blank" rel="noopener noreferrer"
              onMouseEnter={(e) => e.target.style.background = '#e55a2b'}
              onMouseLeave={(e) => e.target.style.background = '#ff6b35'}
            >
              Saiba Mais
            </a>
          )}
        </div>
      </div>
      
      {/* Setas e Indicadores (sem alterações) */}
      {banners.length > 1 && (
        <>
          <button onClick={goToPrevious} style={{...}}>&#10094;</button>
          <button onClick={goToNext} style={{...}}>&#10095;</button>
          <div style={{...}}>
            {banners.map((_, index) => (
              <button key={index} onClick={() => setCurrentIndex(index)} style={{...}} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RotatingBanner;
