// Local: src/pages/CartPage.jsx (VERSÃO COM CORREÇÃO PARA O FRETE)

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2, Loader2 } from "lucide-react";
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, createPaymentPreference, calculateDeliveryFee } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';
import { v4 as uuidv4 } from 'uuid';

export function CartPage() {
  const { cartItems, addItemToCart, removeItemFromCart, clearCart, subTotal } = useCart();
  const { isAuthenticated, userToken, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [feeError, setFeeError] = useState(null);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (cartItems.length === 0) {
        setDeliveryFee(0);
        return;
      }
      
      setIsCalculatingFee(true);
      setFeeError(null);
      
      try {
        const locationData = {
          client_latitude: -27.8153, 
          client_longitude: -50.3258, 
        };

        const restaurantId = cartItems[0]?.restaurant_id; 

        if (!restaurantId) {
          setFeeError("ID do restaurante não encontrado no carrinho.");
          setDeliveryFee(null);
          return;
        }

        console.log('🚚 Calculando frete para:', { restaurant_id: restaurantId, ...locationData });

        const feeData = await calculateDeliveryFee({
          restaurant_id: restaurantId,
          ...locationData,
        });

        console.log('📦 Resposta completa do frete:', feeData);

        // ✅ CORREÇÃO PRINCIPAL: Acessar o valor corretamente
        let finalFee = 0;
        
        if (feeData && feeData.status === 'success' && feeData.data) {
          // Estrutura nova: { status: 'success', data: { delivery_fee: 5.15 } }
          finalFee = feeData.data.delivery_fee;
        } else if (feeData && typeof feeData.delivery_fee === 'number') {
          // Estrutura alternativa: { delivery_fee: 5.15 }
          finalFee = feeData.delivery_fee;
        } else if (typeof feeData === 'number') {
          // Valor direto
          finalFee = feeData;
        }

        // Garantir que é um número válido
        finalFee = Number(finalFee) || 0;
        
        console.log('✅ Taxa de entrega definida:', finalFee);
        setDeliveryFee(finalFee);

      } catch (error) {
        console.error("❌ Erro ao calcular frete:", error);
        addToast('error', "Não foi possível calcular o frete.");
        setFeeError("Não foi possível calcular o frete.");
        setDeliveryFee(5.00); // Taxa padrão em caso de erro
      } finally {
        setIsCalculatingFee(false);
      }
    };

    fetchDeliveryFee();
  }, [cartItems, addToast]);

  const handleFinalizarPedido = async () => {
    if (!isAuthenticated) { 
      addToast('warning', 'Você precisa estar logado para fazer um pedido.');
      navigate('/login'); 
      return; 
    }
    if (cartItems.length === 0) { 
      addToast('warning', 'Seu carrinho está vazio!'); 
      return; 
    }
    const restaurantIds = [...new Set(cartItems.map(item => item.restaurant_id))];
    if (restaurantIds.length > 1) { 
      addToast('warning', 'Você só pode fazer pedidos de um restaurante por vez.'); 
      return; 
    }
    
    if (deliveryFee === null || isCalculatingFee || feeError) {
      addToast('error', 'Aguarde o cálculo do frete ou corrija os erros antes de finalizar o pedido.');
      return;
    }

    setIsProcessingOrder(true);
    try {
      const deliveryInfo = { 
        client_latitude: -27.8153, 
        client_longitude: -50.3258, 
        delivery_address: "Rua Exemplo Fixo, 123, Lages SC",
        delivery_fee: deliveryFee 
      };

      const realRestaurantId = restaurantIds[0];
      const realClientId = user.id;
      const realDeliveryId = "f85108d3-b07e-4eb4-bfbe-c7d070cd1b44";

      const orderUUID = uuidv4(); 

      const orderPayload = {
        id: orderUUID, 
        restaurant_id: realRestaurantId,
        client_id: realClientId,
        delivery_id: realDeliveryId,
        items: cartItems.map(item => ({ 
            menu_item_id: item.id, 
            quantity: item.quantity, 
            price: parseFloat(item.price ?? 0) 
        })),
        total_amount_items: subTotal, 
        ...deliveryInfo, 
      };

      const createdOrderResponse = await createOrder(orderPayload, userToken);
      
      const preferencePayload = {
        pedido_id: createdOrderResponse.id,
        cliente_email: "test_user_12345678@testuser.com", 
        itens: [
          ...cartItems.map(item => ({ 
            title: item.name,                            
            quantity: item.quantity,                       
            unit_price: parseFloat(item.price ?? 0)      
          })),
          { 
            title: "Taxa de Entrega",                    
            quantity: 1,                                   
            unit_price: createdOrderResponse.delivery_fee || deliveryFee || 0 
          }
        ],
      };

      const paymentPreference = await createPaymentPreference(preferencePayload);
      
      if (paymentPreference.checkout_link) {
        clearCart();
        window.location.href = paymentPreference.checkout_link; 
      } else { 
        throw new Error("Link de checkout não foi gerado."); 
      }

    } catch (error) {
      console.error('Erro ao finalizar pedido ou criar preferência de pagamento:', error); 
      addToast('error', error.message || 'Erro ao finalizar pedido: Verifique o console para mais detalhes.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRemoveItemCompletely = (itemId) => {
    if (window.confirm('Tem certeza que deseja remover este item completamente do carrinho?')) {
      removeItemFromCart(itemId);
    }
  };
  
  // ✅ CORREÇÃO: Garantir que deliveryFee é sempre um número para o cálculo
  const safeFee = Number(deliveryFee) || 0;
  const finalTotal = subTotal + safeFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-6 w-6" /></Button>
        <h1 className="text-3xl font-bold ml-4">Meu Carrinho</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="mx-auto h-24 w-24 text-gray-300" />
          <h2 className="mt-6 text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-gray-500">Adicione itens para continuar.</p>
          <Button asChild className="mt-6"><Link to="/">Ver restaurantes</Link></Button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
          <div className="space-y-6 mb-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <img src={item.image_url || '/inka-logo.png'} alt={item.name} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600">R$ {parseFloat(item.price ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => removeItemFromCart(item.id)}><MinusCircle className="h-5 w-5" /></Button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => addItemToCart(item)}><PlusCircle className="h-5 w-5" /></Button>
                </div>
                <div className="font-bold w-24 text-right">R$ {(parseFloat(item.price ?? 0) * item.quantity).toFixed(2)}</div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleRemoveItemCompletely(item.id)}><Trash2 className="h-5 w-5" /></Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-6 space-y-2">
            <div className="flex justify-between items-center text-gray-600">
              <span>Subtotal dos produtos</span>
              <span>R$ {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Frete</span>
              <span>
                {isCalculatingFee && <Loader2 className="h-4 w-4 animate-spin inline-block" />}
                {feeError && <span className="text-red-500">{feeError}</span>}
                {deliveryFee !== null && !isCalculatingFee && !feeError && (
                  <span>R$ {safeFee.toFixed(2)}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mt-2">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between mt-8 gap-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={clearCart} className="flex-1 text-red-500 border-red-500 hover:bg-red-500/10" disabled={isProcessingOrder}>
              Limpar Carrinho
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={handleFinalizarPedido} 
              disabled={isProcessingOrder || isCalculatingFee || feeError || deliveryFee === null}
            >
              {isProcessingOrder ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> ) : ( 'Finalizar Pedido e Pagar' )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
