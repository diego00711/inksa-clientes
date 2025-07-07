// Local: src/pages/ProfilePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, UserCircle2 } from "lucide-react";

export function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ChevronLeft className="h-6 w-6 text-accent" /> {/* Ícone Voltar na cor accent */}
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4 text-gray-800">Meu Perfil</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md text-center flex flex-col items-center"> {/* Adicionado flex para centralizar ícone */}
        <UserCircle2 className="h-24 w-24 text-gray-400 mx-auto mb-6" /> {/* Ícone maior de usuário */}
        <p className="text-lg text-muted-foreground mb-4">
          Bem-vindo à sua página de perfil!
        </p>
        <p className="text-md text-gray-600 mb-6">
          Aqui você poderá gerenciar suas informações, pedidos e favoritos.
        </p>
        <Link to="/">
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
            Voltar à Página Inicial
          </Button>
        </Link>
      </div>

      {/* Você pode adicionar mais seções aqui futuramente, como histórico de pedidos, endereços, etc. */}
    </div>
  );
}