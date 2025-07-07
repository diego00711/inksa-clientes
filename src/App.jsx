// Local: src/App.jsx - VERSÃO CORRIGIDA DEFINITIVA

// Remova import { BrowserRouter as Router } daqui. Mantenha apenas Routes e Route.
import { Routes, Route } from "react-router-dom"; 
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage"; 
import { Header } from "./components/Header"; 
import { Layout } from "./components/Layout"; 
import { ScrollToTopButton } from "./components/ScrollToTopButton"; // Importe este também

function App() {
  return (
    // Remova <Router> e </Router> daqui! Use um Fragmento (<>...</>)
    <> 
      <Header /> 

      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurantes/:id" element={<RestaurantDetailsPage />} /> 
        </Routes>
      </Layout>

      <ScrollToTopButton /> 
    </>
  );
}

export default App;