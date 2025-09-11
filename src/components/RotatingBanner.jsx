import React, { useState, useEffect } from 'react';

const RotatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Troca a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
      console.log('🔍 Carregando banners de:', `${API_URL}/api/banners`);
      
      const response = await fetch(`${API_URL}/api/banners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Dados recebidos:', data);
      
      const activeBanners = Array.isArray(data.data) 
        ? data.data.filter(banner => banner.is_active) 
        : [];
      
      console.log('✅ Banners ativos:', activeBanners);
      
      if (activeBanners.length > 0) {
        setBanners(activeBanners);
      } else {
        setBanners(getDefaultBanners());
      }
    } catch (error) {
      console.error('❌ Erro ao carregar banners:', error);
      setBanners(getDefaultBanners());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultBanners = () => [
    {
      id: 'default-1',
      title: 'Bem-vindo ao Inksa Delivery!',
      subtitle: 'Peça comida deliciosa com facilidade',
      image_url: '/default-banner.jpg',
      link_url: '/',
      display_order: 0
    }
  ];

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank');
      } else {
        window.location.href = banner.link_url;
      }
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-64 bg-gray-200 rounded-lg animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-500">Carregando banners...</span>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-64 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo ao Inksa Delivery!</h2>
            <p className="text-xl">Encontre o melhor restaurante para você</p>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg">
      {/* Banner Principal */}
      <div 
        className="relative w-full h-full cursor-pointer group"
        onClick={() => handleBannerClick(currentBanner)}
      >
        {/* Imagem de Fundo */}
        <div className="absolute inset-0">
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.error('❌ Erro ao carregar imagem:', currentBanner.image_url);
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="256" viewBox="0 0 800 256"><rect width="800" height="256" fill="%23f97316"/><text x="400" y="140" text-anchor="middle" fill="white" font-size="32" font-weight="bold">Inksa Delivery</text><text x="400" y="180" text-anchor="middle" fill="white" font-size="18">Encontre o melhor restaurante para você</text></svg>';
            }}
            onLoad={() => {
              console.log('✅ Imagem carregada:', currentBanner.image_url);
            }}
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Conteúdo do Banner */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              {currentBanner.title}
            </h2>
            {currentBanner.subtitle && (
              <p className="text-lg md:text-xl opacity-90 drop-shadow-lg">
                {currentBanner.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Setas de Navegação */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicadores */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Informações de Debug (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <div>Banner {currentIndex + 1}/{banners.length}</div>
          <div>URL: {currentBanner.image_url}</div>
          <div>ID: {currentBanner.id}</div>
        </div>
      )}
    </div>
  );
};

export default RotatingBanner;
