// Local: src/components/LoginForm.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (event) => {
    event.preventDefault();
    login();
    navigate("/");
  };

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="items-center text-center">
        {/* 1. Adicionamos um container flex para centralizar a imagem */}
        <div className="flex justify-center w-full mb-2">
          {/* 2. Aumentamos o tamanho do logo para w-24 (largura) */}
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
              <Link to="/recuperar-senha" className="ml-auto inline-block text-sm underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p className="text-muted-foreground">
          Não tem uma conta? <Link to="/cadastro" className="underline text-primary font-semibold">Cadastre-se</Link>
        </p>
      </CardFooter>
    </Card>
  );
}