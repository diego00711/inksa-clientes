// RotatingBanner.jsx - Versão Corrigida

import React, { useState, useEffect } from 'react';
import './RotatingBanner.css';

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
      <div className="banner-container loading">
        <div className="banner-skeleton">
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🚨 Banner error state:', error);
    return (
      <div className="banner-container error">
        <p>Erro ao carregar banners: {error}</p>
      </div>
    );
  }

  if (banners.length === 0) {
    console.warn('⚠️ No banners to display');
    return (
      <div className="banner-container empty">
        <p>Nenhum banner disponível no momento.</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  console.log('🎯 Current banner being displayed:', currentBanner);

  return (
    <div className="banner-container">
      <div 
        className="banner-slide"
        style={{
          backgroundImage: `url(${currentBanner.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="banner-content">
          <h2 className="banner-title">{currentBanner.title}</h2>
          {currentBanner.subtitle && currentBanner.subtitle !== 'EMPTY' && (
            <p className="banner-subtitle">{currentBanner.subtitle}</p>
          )}
          {currentBanner.link_url && currentBanner.link_url !== 'text' && (
            <a 
              href={currentBanner.link_url} 
              className="banner-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Saiba Mais
            </a>
          )}
        </div>
      </div>
      
      {banners.length > 1 && (
        <div className="banner-indicators">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
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
