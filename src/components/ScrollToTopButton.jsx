// Local: src/components/ScrollToTopButton.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react"; // Importar o ícone de seta para cima

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Função para rolar suavemente para o topo da página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Rola suavemente
    });
  };

  // Efeito para adicionar/remover o listener de scroll e controlar a visibilidade do botão
  useEffect(() => {
    // Função que verifica a posição do scroll
    const toggleVisibility = () => {
      // Se o scroll vertical for maior que 300px, o botão fica visível
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Adiciona o listener de scroll ao objeto window
    window.addEventListener('scroll', toggleVisibility);

    // Remove o listener de scroll quando o componente for desmontado para evitar vazamentos de memória
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []); // Array de dependências vazio significa que o efeito roda uma vez no mount e limpa no unmount

  return (
    <div className="fixed bottom-6 right-6 z-50"> {/* Posição fixa no canto inferior direito */}
      {isVisible && ( // Renderiza o botão apenas se isVisible for true
        <Button
          onClick={scrollToTop}
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <ArrowUp className="h-6 w-6" />
          <span className="sr-only">Voltar ao Topo</span>
        </Button>
      )}
    </div>
  );
}