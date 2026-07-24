// Local: src/components/LoginForm.jsx - VERSÃO FINAL E CORRIGIDA

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. Importamos o useAuth
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Capacitor } from "@capacitor/core";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth(); // 2. Pegamos a função de login do nosso contexto

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 3. Usamos a função de login do contexto!
      // Ela vai chamar o AuthService e atualizar o estado global.
      await login(email, password);
      
      // Se o login for bem-sucedido, o AuthContext atualiza o estado,
      // e o ProtectedRoute vai nos redirecionar automaticamente.
      // O navigate("/") aqui é um bônus, mas o redirecionamento principal
      // acontece por causa da mudança de estado.
      navigate("/"); 

    } catch (err) {
      console.error("Falha no login:", err);
      setError(err.message || "E-mail ou senha inválidos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      navigate("/");
    } catch (err) {
      console.error("Falha no login com Google:", err);
      setError(err.message || "Não foi possível entrar com o Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && !Capacitor.isNativePlatform();

  return (
    <Card className="w-full max-w-sm shadow-lg mx-4">
      <CardHeader className="items-center text-center">
        <div className="flex justify-center w-full mb-2">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="w-24 h-auto" />
        </div>
        <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
        <CardDescription>
          Bem-vindo de volta!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Senha</Label>
              <Link to="/forgot-password" className="ml-auto inline-block text-sm underline">
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <p className="text-sm font-medium text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={(e) => setError(e?.message || "Falha ao carregar o Google.")}
              text="signin_with"
            />
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p className="text-muted-foreground">
          Não tem uma conta? <Link to="/register" className="underline text-primary font-semibold">Cadastre-se</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
