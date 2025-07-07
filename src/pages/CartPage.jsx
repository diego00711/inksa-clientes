// Local: src/pages/CartPage.jsx - ALTERE ESTE ARQUIVO

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ChevronLeft className="h-6 w-6 text-accent" /> {/* ALTERADO AQUI! */}
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4 text-gray-800">Seu Carrinho</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Seu carrinho está vazio no momento.
        </p>
        <p className="text-md text-gray-600 mb-6">
          Que tal explorar nossos restaurantes e fazer seu primeiro pedido?
        </p>
        <Link to="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Ver Restaurantes
          </Button>
        </Link>
      </div>
    </div>
  );
}