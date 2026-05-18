// Local: src/components/Layout.jsx

import { Outlet } from "react-router-dom"; // 1. Importamos o Outlet
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="bg-orange-50 min-h-screen">
      <Header />
      <main className="w-full max-w-screen-2xl mx-auto">
        {/* 2. O Outlet renderiza a página da rota atual (HomePage, etc) aqui dentro */}
        <Outlet />
      </main>
    </div>
  );
}