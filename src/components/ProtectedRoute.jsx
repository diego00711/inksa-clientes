// Local: src/components/ProtectedRoute.jsx

// A LINHA QUE FALTAVA ESTÁ AQUI:
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Este componente atua como um "segurança"
export function ProtectedRoute({ children }) {
  // 1. Ele pergunta ao nosso "cérebro" (AuthContext) se o usuário está logado
  const { isAuthenticated } = useAuth();

  // 2. Se o usuário NÃO estiver logado...
  if (!isAuthenticated) {
    // ...nós o redirecionamos para a página de login.
    return <Navigate to="/login" replace />;
  }

  // 3. Se estiver logado, ele simplesmente mostra a página solicitada (children).
  return children;
}