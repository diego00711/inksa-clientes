// src/components/GoogleSignInButton.jsx
// Botão "Continuar com Google" via Google Identity Services (web).
// - Só aparece se VITE_GOOGLE_CLIENT_ID estiver configurado.
// - No app NATIVO (Capacitor) fica escondido por enquanto: o webview do Android
//   bloqueia o fluxo web do Google. O login nativo entra na Fase 2 (plugin
//   @codetrix-studio/capacitor-google-auth), sem mexer neste componente.
import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o Google")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o Google"));
    document.head.appendChild(s);
  });
}

export function GoogleSignInButton({ onCredential, onError, text = "signin_with" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || Capacitor.isNativePlatform()) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          callback: (resp) => {
            if (resp?.credential) onCredential?.(resp.credential);
          },
        });
        ref.current.innerHTML = "";
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text, // "signin_with" | "continue_with"
          shape: "pill",
          logo_alignment: "left",
          width: 300,
        });
      })
      .catch((e) => onError?.(e));
    return () => {
      cancelled = true;
    };
  }, [onCredential, onError, text]);

  // Env não configurado ou app nativo → não renderiza nada (login segue por e-mail/senha)
  if (!GOOGLE_CLIENT_ID || Capacitor.isNativePlatform()) return null;
  return <div ref={ref} className="flex justify-center" />;
}

export default GoogleSignInButton;
