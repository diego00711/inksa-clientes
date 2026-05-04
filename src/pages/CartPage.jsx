// Local: src/pages/CartPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2, Loader2 } from "lucide-react";
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentPreference, calculateDeliveryFee } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';
import ClientService from '../services/clientService';

const PAYMENT_OPTIONS = [
  { id: 'credit', label: 'Cartão de Crédito', icon: '💳' },
  { id: 'debit',  label: 'Cartão de Débito',  icon: '💳' },
  { id: 'pix',    label: 'PIX',               icon: '📱' },
  { id: 'cash',   label: 'Dinheiro',           icon: '💵' },
];

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

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');

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

    // Validate change_for for cash with change
    if (paymentMethod === 'cash' && needsChange) {
      const changeVal = parseFloat(changeFor);
      if (!changeVal || changeVal <= finalTotal) {
        addToast('warning', `O valor do troco deve ser maior que R$ ${finalTotal.toFixed(2)}.`);
        return;
      }
    }

    setIsProcessingOrder(true);

    try {
      const restaurantId = restaurantIds[0];
      const clientId = user.id;
      const safeFeeLocal = Number(deliveryFee) || 0;

      const basePayload = {
        client_id: clientId,
        restaurant_id: restaurantId,
        itens: [
          ...cartItems.map(item => ({
            title: item.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.price ?? 0),
            menu_item_id: item.id,
          })),
          {
            title: "Taxa de Entrega",
            quantity: 1,
            unit_price: safeFeeLocal,
          }
        ],
        total_amount_items: subTotal,
        delivery_fee: safeFeeLocal,
        total_amount: subTotal + safeFeeLocal,
        delivery_address: clientProfile?.address || clientProfile?.full_address || '',
        client_latitude: clientProfile?.latitude || clientProfile?.lat || 0,
        client_longitude: clientProfile?.longitude || clientProfile?.lng || 0,
        delivery_distance_km: deliveryDistance || 0,
        notes: '',
        cliente_email: user.email,
      };

      if (paymentMethod === 'cash') {
        const cashPayload = {
          ...basePayload,
          payment_method: 'cash',
          change_for: needsChange ? parseFloat(changeFor) || 0 : 0,
        };

        const response = await createPaymentPreference(cashPayload);

        if (response.pedido_id) {
          localStorage.setItem('last_order_id', response.pedido_id);
          clearCart();
          addToast('success', `Pedido confirmado! Pague R$ ${(subTotal + safeFeeLocal).toFixed(2)} em dinheiro ao entregador.`);
          navigate(`/pedido/${response.pedido_id}/acompanhar`);
        } else {
          throw new Error("Erro ao criar pedido em dinheiro.");
        }
        return;
      }

      // Online payment (MP) flow
      const preferencePayload = {
        ...basePayload,
        payment_method: paymentMethod, // 'credit', 'debit', or 'pix'
        urls_retorno: {
          sucesso: `${window.location.origin}/pagamento/sucesso`,
          falha: `${window.location.origin}/pagamento/falha`,
          pendente: `${window.location.origin}/pagamento/pendente`,
        },
      };

      const paymentResponse = await createPaymentPreference(preferencePayload);

      if (paymentResponse.checkout_link) {
        if (paymentResponse.pedido_id) {
          localStorage.setItem('last_order_id', paymentResponse.pedido_id);
        }
        clearCart();
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

          {/* Totals */}
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

          {/* Payment method selector */}
          <div className="border-t pt-6 mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Forma de pagamento</h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setPaymentMethod(id); setNeedsChange(false); setChangeFor(''); }}
                  className={`flex items-center gap-2 p-4 rounded-lg border-2 text-left transition-all
                    ${paymentMethod === id
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                <p className="text-sm font-medium text-yellow-800">Precisa de troco?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNeedsChange(false)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                      ${!needsChange
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedsChange(true)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all
                      ${needsChange
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Sim
                  </button>
                </div>
                {needsChange && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Troco para R$</label>
                    <input
                      type="number"
                      min={finalTotal + 0.01}
                      step="0.01"
                      value={changeFor}
                      onChange={e => setChangeFor(e.target.value)}
                      placeholder={`Ex: ${(Math.ceil(finalTotal / 10) * 10).toFixed(2)}`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor maior que R$ {finalTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
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
              ) : paymentMethod === 'cash' ? (
                '💵 Confirmar Pedido'
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
