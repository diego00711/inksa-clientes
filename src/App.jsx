// Local: src/App.jsx - Adicionar as novas rotas

import React from "react";
import { Routes, Route, Link } from "react-router-dom"; // Link já deveria estar aqui
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage";
import { CartPage } from "./pages/CartPage";     // NOVO: Importar CartPage
import { ProfilePage } from "./pages/ProfilePage"; // NOVO: Importar ProfilePage
import { Header } from "./components/Header";
import { ScrollToTopButton } from "./components/ScrollToTopButton";

export default function App() {
  return (
    <> 
      <Header /> 
      
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurantes/:id" element={<RestaurantDetailsPage />} />
          <Route path="/carrinho" element={<CartPage />} />       {/* NOVO: Rota para o Carrinho */}
          <Route path="/perfil" element={<ProfilePage />} />       {/* NOVO: Rota para o Perfil */}
          {/* Rota para páginas não encontradas (404) */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">404 - Página Não Encontrada</h1>
              <p className="text-lg text-muted-foreground">Desculpe, a página que você procura não existe.</p>
              <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à Página Inicial</Link>
            </div>
          } /> 
        </Routes>
      </Layout>

      <ScrollToTopButton /> 
    </>
  );
}