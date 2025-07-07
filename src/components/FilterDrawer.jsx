// Local: src/components/FilterDrawer.jsx - CORREÇÃO DO ERRO 'React.Children.only'

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  // SheetClose, // Removido o import explícito, pois não usaremos 'asChild' no botão 'Limpar'
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react"; 


export function FilterDrawer({
  selectedCategory,
  onCategoryClick,
  minRating,
  onRatingFilterClick,
  currentSort,
  onSortChange,
  onClearFilters,
  categories,
  ratingFilters,
  sortOptions,
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 px-4 py-2 text-base">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            Filtros e Ordenação
            {/* O BOTÃO 'X' PADRÃO do Sheet já está incluído pelo Shadcn/ui aqui.
                Removemos o 'Button' customizado que causava a duplicidade/erro. */}
          </SheetTitle>
          <SheetDescription>
            Ajuste suas preferências para encontrar o restaurante ideal.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Seção de Filtro por Categoria */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  onClick={() => onCategoryClick(category)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      : "bg-white text-muted-foreground border border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Seção de Filtro por Avaliação Mínima */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Avaliação Mínima</h2>
            <div className="flex flex-wrap gap-2">
              {ratingFilters.map(rating => (
                <Button
                  key={rating === "Todos" ? "Todos-Rating" : `rating-${rating}`}
                  onClick={() => onRatingFilterClick(rating === "Todos" ? 0 : rating)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${(minRating === 0 && rating === "Todos") || (minRating === rating && rating !== "Todos")
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      : "bg-white text-muted-foreground border border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >
                  {rating === "Todos" ? "Todos" : `${rating}+ Estrelas`}
                </Button>
              ))}
            </div>
          </div>

          {/* Seção de Ordenação */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Ordenar por</h2>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <Button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${currentSort === option.value
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      : "bg-white text-muted-foreground border border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de Ação na parte inferior do painel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-4">
          {/* REMOVIDO: SheetClose asChild do botão Limpar Todos. 
             Ele agora apenas limpa e não fecha o painel automaticamente por este botão. */}
          <Button onClick={onClearFilters} variant="outline" className="flex-1">
             Limpar Todos
          </Button>
          {/* Se quiser um botão "Aplicar" que FECHA o painel, ele sim usaria SheetClose asChild */}
          {/* Exemplo de botão Aplicar (opcional) que fecharia o Sheet
          <SheetClose asChild>
            <Button className="flex-1 bg-primary text-primary-foreground">
              Aplicar
            </Button>
          </SheetClose>
          */}
        </div>
      </SheetContent>
    </Sheet>
  );
}