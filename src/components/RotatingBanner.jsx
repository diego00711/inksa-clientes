// RotatingBanner.jsx - Código Modificado com Setas e Altura Dinâmica

import React, { useState, useEffect, useCallback } from 'react';

const RotatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NOVO: Estado para armazenar as dimensões da imagem atual
  const [imageDimensions, setImageDimensions] = useState({ height: 300, width: 1200 });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://inksa-auth-flask-dev.onrender.com';

  // NOVO: Função para carregar uma imagem e obter suas dimensões
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
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data)) {
          setBanners(data.data);
          if (data.data.length === 0) {
             console.warn('⚠️ Nenhum banner para exibir');
          }
        } else {
          console.warn('⚠️ Estrutura de dados inesperada:', data);
          setError('Formato de dados inesperado');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar banners:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [API_BASE_URL]);

  // Efeito para carregar as dimensões da imagem do banner atual
  useEffect(() => {
    if (banners.length > 0) {
      const currentBanner = banners[currentIndex];
      const cleanImageUrl = currentBanner.image_url?.replace(/\?+$/, '').replace(/\s+/g, '');

      if (cleanImageUrl) {
        setLoading(true);
        loadImage(cleanImageUrl)
          .then(dimensions => {
            // Define a altura, mas limita a um valor máximo para não distorcer o layout
            const calculatedHeight = (window.innerWidth / dimensions.width) * dimensions.height;
            setImageDimensions({ height: Math.min(calculatedHeight, 450), width: dimensions.width });
          })
          .catch(() => {
            // Se a imagem falhar, usa uma altura padrão
            setImageDimensions({ height: 300, width: 1200 });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [currentIndex, banners]);


  // Efeito para a rotação automática
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 4000); // Troca a cada 4 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // NOVO: Funções para navegar entre os banners
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
    return (
      <div className="banner-container loading" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px',
        background: '#f5f5f5', color: '#666', fontSize: '1.1rem', borderRadius: '12px', marginBottom: '2rem'
      }}>
        <div>Carregando banners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="banner-container error" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px',
        background: '#f5f5f5', color: '#666', fontSize: '1.1rem', borderRadius: '12px', marginBottom: '2rem'
      }}>
        <p>Erro ao carregar banners: {error}</p>
      </div>
    );
  }

  if (banners.length === 0 && !loading) {
    return (
      <div className="banner-container empty" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px',
        background: '#f5f5f5', color: '#666', fontSize: '1.1rem', borderRadius: '12px', marginBottom: '2rem'
      }}>
        <p>Nenhum banner disponível no momento.</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  const cleanImageUrl = currentBanner?.image_url?.replace(/\?+$/, '').replace(/\s+/g, '');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      // ALTURA DINÂMICA: Usa a altura calculada da imagem
      height: `${imageDimensions.height}px`,
      marginBottom: '2rem',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'height 0.3s ease-in-out' // Transição suave da altura
    }}>
      {/* Container da Imagem e Conteúdo */}
      <div 
        style={{
          width: '100%', height: '100%', position: 'relative', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s ease-in-out',
          backgroundImage: `url(${cleanImageUrl})`, backgroundSize: 'cover',
          backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Conteúdo sobreposto (título, subtítulo, etc.) */}
        <div style={{
          textAlign: 'center', color: 'white', zIndex: 2, padding: '2rem',
          background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', backdropFilter: 'blur(5px)'
        }}>
          <h2 style={{
            fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', margin: '0 0 0.5rem 0'
          }}>
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && currentBanner.subtitle !== 'EMPTY' && currentBanner.subtitle !== '' && (
            <p style={{
              fontSize: '1.1rem', marginBottom: '1rem', opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', margin: '0 0 1rem 0'
            }}>
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.link_url && currentBanner.link_url !== 'text' && currentBanner.link_url !== '/' && (
            <a 
              href={currentBanner.link_url} 
              style={{
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
      
      {/* NAVEGAÇÃO POR SETAS - SÓ APARECE SE HOUVER MAIS DE 1 BANNER */}
      {banners.length > 1 && (
        <>
          {/* Seta Esquerda */}
          <button
            onClick={goToPrevious}
            style={{
              position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.4)', color: 'white', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              fontSize: '1.5rem', cursor: 'pointer', zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
            aria-label="Banner Anterior"
          >
            &#10094;
          </button>
          {/* Seta Direita */}
          <button
            onClick={goToNext}
            style={{
              position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.4)', color: 'white', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              fontSize: '1.5rem', cursor: 'pointer', zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
            aria-label="Próximo Banner"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Indicadores de Posição (Bolinhas) */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.5rem', zIndex: 3
        }}>
          {banners.map((_, index) => (
            <button
              key={index}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                border: 'none', cursor: 'pointer', transition: 'background-color 0.3s ease'
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
