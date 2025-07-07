// Local: src/App.jsx - CORREÇÃO DO POSICIONAMENTO DO HEADER

import React from "react";
import { Routes, Route, Link } from "react-router-dom"; 
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage";
import { CartPage } from "./pages/CartPage";     
import { ProfilePage } from "./pages/ProfilePage"; 
import { Header } from "./components/Header"; 
import { ScrollToTopButton } from "./components/ScrollToTopButton"; 
import { CartProvider } from "./context/CartContext"; 


export default function App() {
  return (
    // O BrowserRouter (Router) no main.jsx já envolve tudo.
    // O CartProvider DEVE envolver TUDO que precisa do contexto do carrinho, INCLUINDO O HEADER.
    <> 
      {/* O CartProvider agora envolve o Header E o Layout (com as rotas) */}
      <CartProvider>
        <Header /> {/* Header agora está DENTRO do CartProvider */}
        
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurantes/:id" element={<RestaurantDetailsPage />} />
            <Route path="/carrinho" element={<CartPage />} />       
            <Route path="/perfil" element={<ProfilePage />} />       
            <Route path="*" element={
              <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">404 - Página Não Encontrada</h1>
                <p className="text-lg text-muted-foreground">Desculpe, a página que você procura não existe.</p>
                <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à Página Inicial</Link>
              </div>
            } /> 
          </Routes>
        </Layout>
      </CartProvider> {/* Fim do CartProvider */}

      <ScrollToTopButton /> 
    </>
  );
}