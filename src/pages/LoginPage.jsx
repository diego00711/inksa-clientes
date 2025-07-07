// Local: src/pages/LoginPage.jsx

import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    // Usamos flexbox para centralizar o formulário na tela
    <div className="flex items-center justify-center min-h-screen">
      <LoginForm />
    </div>
  );
}