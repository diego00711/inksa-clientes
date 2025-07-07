// Local: src/components/Layout.jsx

// Este componente recebe "children", que representa qualquer página
// que será renderizada dentro dele.
export function Layout({ children }) {
  return (
    // A div principal com a cor de fundo e altura mínima para a tela toda.
    <div className="bg-orange-50 min-h-screen">
      {/* Adicionamos um padding horizontal (px) e vertical (py)
          e um max-w para limitar a largura do conteúdo, centralizando-o com mx-auto.
          O md:px-8 e lg:px-12 aumentam o padding em telas maiores. */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}