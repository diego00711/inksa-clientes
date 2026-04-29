// Local: src/pages/CartPage.jsx (NOVA VERSÃO - Backend cria pedido + preferência)

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2, Loader2 } from "lucide-react";
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentPreference, calculateDeliveryFee } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';
import ClientService from '../services/clientService';

export function CartPage() {
  const { cartItems, addItemToCart, removeItemFromCart, clearCart, subTotal } = useCart();
  const { isAuthenticated, userToken, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [feeError, setFeeError] = useState(null);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);

  useEffect(() => {
    ClientService.getProfile().then(setClientProfile).catch(() => {});
  }, []);

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
          client_latitude: clientProfile?.latitude || clientProfile?.lat || 0,
          client_longitude: clientProfile?.longitude || clientProfile?.lng || 0,
        };

        const restaurantId = cartItems[0]?.restaurant_id;

        if (!restaurantId) {
          setFeeError("ID do restaurante não encontrado no carrinho.");
          setDeliveryFee(null);
          return;
        }

        const feeData = await calculateDeliveryFee({
          restaurant_id: restaurantId,
          ...locationData,
        });

        let finalFee = 0;
        let distance = 0;

        if (feeData && feeData.status === 'success' && feeData.data) {
          finalFee = feeData.data.delivery_fee;
          distance = feeData.data.distance_km || 0;
        } else if (feeData && typeof feeData.delivery_fee === 'number') {
          finalFee = feeData.delivery_fee;
          distance = feeData.distance_km || 0;
        } else if (typeof feeData === 'number') {
          finalFee = feeData;
        }

        finalFee = Number(finalFee) || 0;
        distance = Number(distance) || 0;

        setDeliveryFee(finalFee);
        setDeliveryDistance(distance);

      } catch (error) {
        addToast('error', "Não foi possível calcular o frete.");
        setFeeError("Não foi possível calcular o frete.");
        setDeliveryFee(5.00);
      } finally {
        setIsCalculatingFee(false);
      }
    };

    fetchDeliveryFee();
  }, [cartItems, addToast, clientProfile]);

  const handleFinalizarPedido = async () => {
    // ✅ VALIDAÇÕES
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

    if (!user || !user.email) {
      addToast('error', 'Erro: Email do usuário não encontrado. Por favor, faça login novamente.');
      return;
    }

    if (!user.id) {
      addToast('error', 'Erro: ID do usuário não encontrado. Por favor, faça login novamente.');
      return;
    }

    setIsProcessingOrder(true);
    
    try {
      const restaurantId = restaurantIds[0];
      const clientId = user.id;
      
      // 🚀 NOVO FLUXO: Enviar TODOS os dados para criar_preferencia
      // O backend vai criar o pedido E a preferência em uma única transação!
      const preferencePayload = {
        // 📋 DADOS DO PEDIDO
        client_id: clientId,
        restaurant_id: restaurantId,
        
        // 📦 ITENS (produtos + taxa de entrega)
        itens: [
          ...cartItems.map(item => ({ 
            title: item.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.price ?? 0),
            menu_item_id: item.id // ✅ Incluir ID do menu item para referência
          })),
          { 
            title: "Taxa de Entrega",
            quantity: 1,
            unit_price: deliveryFee || 0
          }
        ],
        
        // 💰 VALORES
        total_amount_items: subTotal,
        delivery_fee: deliveryFee || 0,
        total_amount: subTotal + (deliveryFee || 0),
        
        // 📍 ENDEREÇO E LOCALIZAÇÃO
        delivery_address: clientProfile?.address || clientProfile?.full_address || '',
        client_latitude: clientProfile?.latitude || clientProfile?.lat || 0,
        client_longitude: clientProfile?.longitude || clientProfile?.lng || 0,
        delivery_distance_km: deliveryDistance || 0,
        
        // 📝 OBSERVAÇÕES (opcional)
        notes: "", // TODO: Adicionar campo de observações se necessário
        
        // 📧 EMAIL PARA MERCADO PAGO
        cliente_email: user.email,
        
        // 🔗 URLs DE RETORNO
        urls_retorno: {
          sucesso: `${window.location.origin}/pagamento/sucesso`,
          falha: `${window.location.origin}/pagamento/falha`,
          pendente: `${window.location.origin}/pagamento/pendente`
        }
      };

      // 🚀 ÚNICA CHAMADA: Backend cria pedido + preferência
      const paymentResponse = await createPaymentPreference(preferencePayload);
      
      if (paymentResponse.checkout_link) {
        // ✅ Salvar o ID do pedido no localStorage (para tracking)
        if (paymentResponse.pedido_id) {
          localStorage.setItem('last_order_id', paymentResponse.pedido_id);
        }
        
        // ✅ Limpar o carrinho
        clearCart();
        
        // ✅ Redirecionar para o Mercado Pago
        window.location.href = paymentResponse.checkout_link;
      } else { 
        throw new Error("Link de checkout não foi gerado pelo servidor."); 
      }

    } catch (error) {
      const errorMessage = error.response?.data?.erro || error.message || 'Erro ao finalizar pedido.';
      addToast('error', errorMessage);
      
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRemoveItemCompletely = (itemId) => {
    if (window.confirm('Tem certeza que deseja remover este item completamente do carrinho?')) {
      removeItemFromCart(itemId);
    }
  };
  
  const safeFee = Number(deliveryFee) || 0;
  const finalTotal = subTotal + safeFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold ml-4">Meu Carrinho</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="mx-auto h-24 w-24 text-gray-300" />
          <h2 className="mt-6 text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-gray-500">Adicione itens para continuar.</p>
          <Button asChild className="mt-6">
            <Link to="/">Ver restaurantes</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
          <div className="space-y-6 mb-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <img 
                  src={item.image_url || '/inka-logo.png'} 
                  alt={item.name} 
                  className="w-20 h-20 rounded-md object-cover" 
                />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600">R$ {parseFloat(item.price ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItemFromCart(item.id)}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => addItemToCart(item)}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="font-bold w-24 text-right">
                  R$ {(parseFloat(item.price ?? 0) * item.quantity).toFixed(2)}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-red-500" 
                  onClick={() => handleRemoveItemCompletely(item.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
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
            {deliveryDistance && deliveryDistance > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Distância</span>
                <span>{deliveryDistance.toFixed(1)} km</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold mt-2">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between mt-8 gap-4 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={clearCart} 
              className="flex-1 text-red-500 border-red-500 hover:bg-red-500/10" 
              disabled={isProcessingOrder}
            >
              Limpar Carrinho
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={handleFinalizarPedido} 
              disabled={isProcessingOrder || isCalculatingFee || feeError || deliveryFee === null}
            >
              {isProcessingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processando...
                </>
              ) : (
                'Finalizar Pedido e Pagar'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
