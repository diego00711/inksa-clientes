// src/components/RotatingBanner.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../services/restaurantService';

export function RotatingBanner() {
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar banners do Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        // Se não houver banners no banco, usar banner padrão
        if (!data || data.length === 0) {
          setBanners([{
            id: 'default',
            title: 'Ganhe Recompensas Incríveis!',
            subtitle: 'Acumule pontos em cada pedido e troque por descontos exclusivos.',
            image_url: '/banner-gamificacao.jpg',
            link_url: '/gamificacao'
          }]);
        } else {
          setBanners(data);
        }
      } catch (err) {
        console.error('Erro ao buscar banners:', err);
        setError(err.message);
        // Banner fallback em caso de erro
        setBanners([{
          id: 'fallback',
          title: 'Bem-vindo ao Inksa Delivery!',
          subtitle: 'Os melhores restaurantes na palma da sua mão.',
          image_url: '/banner-gamificacao.jpg',
          link_url: '/'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Rotação automática dos banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % banners.length
      );
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [banners.length]);

  // Navegação manual
  const goToPrevious = () => {
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentBannerIndex((prevIndex) => 
      (prevIndex + 1) % banners.length
    );
  };

  const goToSlide = (index) => {
    setCurrentBannerIndex(index);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg mb-12 bg-gray-300 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Carregando banner...</div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  const BannerContent = () => (
    <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg mb-12 group">
      {/* Imagem de fundo */}
      <img
        src={currentBanner.image_url}
        alt={currentBanner.title}
        className="w-full h-full object-cover brightness-[.4] transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.target.src = '/banner-gamificacao.jpg'; // Fallback image
        }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />
      
      {/* Conteúdo do banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-white text-4xl font-extrabold mb-2 drop-shadow-lg max-w-3xl">
          {currentBanner.title}
        </h2>
        {currentBanner.subtitle && (
          <p className="text-white text-lg max-w-md drop-shadow-lg">
            {currentBanner.subtitle}
          </p>
        )}
      </div>

      {/* Navegação anterior/próximo (apenas se houver múltiplos banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicadores de slide (apenas se houver múltiplos banners) */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentBannerIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Indicador de tempo de rotação */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{
              width: '100%',
              animation: 'progress 10s linear infinite'
            }}
          />
        </div>
      )}
    </div>
  );

  // Se o banner tem link, envolver em Link, senão renderizar apenas o conteúdo
  if (currentBanner.link_url) {
    return (
      <Link to={currentBanner.link_url} className="block cursor-pointer">
        <BannerContent />
      </Link>
    );
  }

  return <BannerContent />;
}

// CSS personalizado para a animação de progresso
const styles = `
  @keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
