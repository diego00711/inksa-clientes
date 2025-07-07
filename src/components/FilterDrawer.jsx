// Local: src/components/FilterDrawer.jsx - CORREÇÃO FINAL PARA React.Children.only

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button"; // Ainda precisamos do Button para os filtros internos
import { SlidersHorizontal } from "lucide-react"; 

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
      {/* ALTERADO AQUI: REMOVIDO 'asChild' e o <Button> externo do SheetTrigger.
          As classes de estilo do botão foram aplicadas DIRETAMENTE no SheetTrigger. */}
      <SheetTrigger 
        // Classes que simulam um Button variant="outline" do Shadcn/ui
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-foreground h-10 px-4 py-2 text-base"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filtros
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center text-2xl font-bold">
            Filtros e Ordenação
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Ajuste suas preferências para encontrar o restaurante ideal.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Seção de Filtro por Categoria */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  onClick={() => onCategoryClick(category)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${selectedCategory === category
                      ? "bg-accent text-primary-foreground shadow-md hover:bg-accent/90" 
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
            <h2 className="text-xl font-bold mb-4 text-gray-800">Avaliação Mínima</h2>
            <div className="flex flex-wrap gap-2">
              {ratingFilters.map(rating => (
                <Button
                  key={rating === "Todos" ? "Todos-Rating" : `rating-${rating}`}
                  onClick={() => onRatingFilterClick(rating === "Todos" ? 0 : rating)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${(minRating === 0 && rating === "Todos") || (minRating === rating && rating !== "Todos")
                      ? "bg-accent text-primary-foreground shadow-md hover:bg-accent/90" 
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
            <h2 className="text-xl font-bold mb-4 text-gray-800">Ordenar por</h2>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <Button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`
                    whitespace-nowrap rounded-full px-4 py-1 text-sm font-medium
                    transition-all duration-200
                    ${currentSort === option.value
                      ? "bg-accent text-primary-foreground shadow-md hover:bg-accent/90" 
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
          <SheetClose asChild> 
             <Button onClick={onClearFilters} variant="outline" className="flex-1">
                Limpar Todos
             </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}