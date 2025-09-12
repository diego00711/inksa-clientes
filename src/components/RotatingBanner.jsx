// RotatingBanner.jsx - VERSÃO CORRIGIDA PARA ALINHAMENTO DE TEXTO

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
        loadImage(cleanImageUrl)
          .then(dimensions => {
            const calculatedHeight = (window.innerWidth / dimensions.width) * dimensions.height;
            setImageDimensions({ height: Math.min(calculatedHeight, 450), width: dimensions.width });
          })
          .catch(() => setImageDimensions({ height: 300, width: 1200 }));
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
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  if (loading && banners.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '12px' }}>Carregando...</div>;
  }
  if (error) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '12px' }}>Erro ao carregar.</div>;
  }
  if (banners.length === 0 && !loading) {
    return null; // Ou um placeholder, se preferir
  }

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null; // Evita erro se banners estiver vazio
  
  const cleanImageUrl = currentBanner.image_url?.replace(/\?+$/, '').replace(/\s+/g, '');

  // --- LÓGICA DE ESTILO CORRIGIDA ---
  const getTextContainerStyles = (position) => {
    let justifyContent = 'center';
    if (position === 'left') justifyContent = 'flex-start';
    if (position === 'right') justifyContent = 'flex-end';
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: justifyContent, // Aplica o alinhamento horizontal aqui
      padding: '2rem',
      zIndex: 2,
    };
  };

  const getTextBoxStyles = (position) => {
    let textAlign = 'center';
    if (position === 'left') textAlign = 'left';
    if (position === 'right') textAlign = 'right';

    return {
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(5px)',
      padding: '2rem',
      borderRadius: '8px',
      color: 'white',
      maxWidth: '500px',
      width: '100%',
      textAlign: textAlign, // Aplica o alinhamento do texto interno aqui
    };
  };

  const textPosition = currentBanner.text_position || 'center';
  const textContainerStyles = getTextContainerStyles(textPosition);
  const textBoxStyles = getTextBoxStyles(textPosition);
  // --- FIM DA LÓGICA CORRIGIDA ---

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: `${imageDimensions.height}px`,
      marginBottom: '2rem',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'height 0.3s ease-in-out',
      backgroundImage: `url(${cleanImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Contêiner que posiciona o bloco de texto */}
      <div style={textContainerStyles}>
        {/* O bloco de texto em si */}
        <div style={textBoxStyles}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: '0 0 0.5rem 0' }}>
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && currentBanner.subtitle !== 'EMPTY' && (
            <p style={{ fontSize: '1.1rem', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', margin: '0 0 1rem 0' }}>
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.link_url && currentBanner.link_url !== 'text' && (
            <a href={currentBanner.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#ff6b35', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
              Saiba Mais
            </a>
          )}
        </div>
      </div>
      
      {/* Setas e Indicadores (sem alterações) */}
      {banners.length > 1 && (
        <>
          <button onClick={goToPrevious} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10094;</button>
          <button onClick={goToNext} style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10095;</button>
          <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 3 }}>
            {banners.map((_, index) => (
              <button key={index} onClick={() => setCurrentIndex(index)} style={{ width: '12px', height: '12px', borderRadius: '50%', background: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RotatingBanner;
