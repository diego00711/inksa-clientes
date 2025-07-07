// Local: src/pages/CartPage.jsx - EXIBINDO ITENS E TOTAL DO CARRINHO

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
// Importe useCart, PlusCircle, MinusCircle, Trash2
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2 } from "lucide-react"; 
import { useCart } from '../context/CartContext'; // Importar useCart

export function CartPage() {
  // Use o hook useCart para acessar os dados e funções do carrinho
  const { cartItems, addItemToCart, removeItemFromCart, clearCart, cartTotal } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ChevronLeft className="h-6 w-6 text-accent" /> 
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4 text-gray-800">Seu Carrinho</h1>
      </div>

      {cartItems.length === 0 ? ( // Renderiza se o carrinho estiver vazio
        <div className="bg-white p-8 rounded-lg shadow-md text-center flex flex-col items-center">
          <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <p className="text-lg text-muted-foreground mb-4">
            Seu carrinho está vazio no momento.
          </p>
          <p className="text-md text-gray-600 mb-6">
            Que tal explorar nossos restaurantes e fazer seu primeiro pedido?
          </p>
          <Link to="/">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Ver Restaurantes
            </Button>
          </Link>
        </div>
      ) : ( // Renderiza se houver itens no carrinho
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-6 mb-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/60x60?text=Item'} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-md" 
                  />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botões de quantidade */}
                  <Button variant="ghost" size="icon" onClick={() => removeItemFromCart(item.id)}>
                    <MinusCircle className="h-5 w-5 text-accent hover:text-accent/80" />
                    <span className="sr-only">Remover um</span>
                  </Button>
                  <span className="font-bold text-lg">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => addItemToCart(item)}>
                    <PlusCircle className="h-5 w-5 text-accent hover:text-accent/80" />
                    <span className="sr-only">Adicionar um</span>
                  </Button>
                  {/* Botão de remover totalmente (lixeira) */}
                  <Button variant="ghost" size="icon" onClick={() => removeItemFromCart(item.id, true)}> {/* True para remover tudo */}
                    <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
                    <span className="sr-only">Remover item</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-4 mt-4">
            <span className="text-xl font-bold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-primary">R$ {cartTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between mt-6 gap-4">
            <Button variant="outline" onClick={clearCart} className="flex-1 text-red-500 border-red-500 hover:bg-red-500/10">
              Limpar Carrinho
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Finalizar Pedido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}