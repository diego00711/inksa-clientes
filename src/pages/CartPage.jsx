// src/pages/CartPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2, Loader2 } from "lucide-react";
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentPreference, calculateDeliveryFee } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';
import ClientService from '../services/clientService';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { CLIENT_API_URL } from '../services/api';

export function CartPage() {
  const { cartItems, addItemToCart, removeItemFromCart, clearCart, subTotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [feeError, setFeeError] = useState(null);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');

  // Cash order confirmation state
  const [cashOrderConfirmed, setCashOrderConfirmed] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  useEffect(() => {
    ClientService.getProfile().then(setClientProfile).catch(() => {});
  }, []);

  // Fetch restaurant info to check accepts_cash
  useEffect(() => {
    const restaurantId = cartItems[0]?.restaurant_id;
    if (!restaurantId) return;
    fetch(`${CLIENT_API_URL}/api/restaurants/${restaurantId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setRestaurantInfo(data?.data || null))
      .catch(() => {});
  }, [cartItems]);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (cartItems.length === 0) { setDeliveryFee(0); return; }
      setIsCalculatingFee(true);
      setFeeError(null);
      try {
        const restaurantId = cartItems[0]?.restaurant_id;
        if (!restaurantId) { setFeeError("ID do restaurante não encontrado."); setDeliveryFee(null); return; }
        const feeData = await calculateDeliveryFee({
          restaurant_id: restaurantId,
          client_latitude: clientProfile?.latitude || clientProfile?.lat || 0,
          client_longitude: clientProfile?.longitude || clientProfile?.lng || 0,
        });
        let finalFee = 0, distance = 0;
        if (feeData?.status === 'success' && feeData?.data) {
          finalFee = feeData.data.delivery_fee;
          distance = feeData.data.distance_km || 0;
        } else if (typeof feeData?.delivery_fee === 'number') {
          finalFee = feeData.delivery_fee;
          distance = feeData.distance_km || 0;
        } else if (typeof feeData === 'number') {
          finalFee = feeData;
        }
        setDeliveryFee(Number(finalFee) || 0);
        setDeliveryDistance(Number(distance) || 0);
      } catch {
        addToast('error', "Não foi possível calcular o frete.");
        setFeeError("Não foi possível calcular o frete.");
        setDeliveryFee(5.00);
      } finally {
        setIsCalculatingFee(false);
      }
    };
    fetchDeliveryFee();
  }, [cartItems, addToast, clientProfile]);

  const safeFee = Number(deliveryFee) || 0;
  const finalTotal = subTotal + safeFee;
  const acceptsCash = restaurantInfo?.accepts_cash ?? true;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setNeedsChange(false);
    setChangeFor('');
  };

  const handleFinalizarPedido = async () => {
    if (!isAuthenticated) {
      addToast('warning', 'Você precisa estar logado para fazer um pedido.');
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) { addToast('warning', 'Seu carrinho está vazio!'); return; }
    const restaurantIds = [...new Set(cartItems.map(item => item.restaurant_id))];
    if (restaurantIds.length > 1) { addToast('warning', 'Apenas um restaurante por pedido.'); return; }
    if (deliveryFee === null || isCalculatingFee || feeError) {
      addToast('error', 'Aguarde o cálculo do frete antes de finalizar.'); return;
    }
    if (!user?.email || !user?.id) {
      addToast('error', 'Erro: dados do usuário não encontrados. Faça login novamente.'); return;
    }
    if (paymentMethod === 'cash' && needsChange) {
      const changeVal = parseFloat(changeFor);
      if (!changeVal || changeVal <= finalTotal) {
        addToast('warning', `O valor do troco deve ser maior que R$ ${finalTotal.toFixed(2)}.`); return;
      }
    }

    setIsProcessingOrder(true);
    try {
      const restaurantId = restaurantIds[0];
      const itens = [
        ...cartItems.map(item => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.price ?? 0),
          menu_item_id: item.id,
        })),
        { title: 'Taxa de Entrega', quantity: 1, unit_price: safeFee },
      ];
      const basePayload = {
        client_id: user.id,
        restaurant_id: restaurantId,
        itens,
        total_amount_items: subTotal,
        delivery_fee: safeFee,
        total_amount: finalTotal,
        delivery_address: clientProfile?.address || clientProfile?.full_address || '',
        client_latitude: clientProfile?.latitude || clientProfile?.lat || 0,
        client_longitude: clientProfile?.longitude || clientProfile?.lng || 0,
        delivery_distance_km: deliveryDistance || 0,
        notes: '',
        cliente_email: user.email,
      };

      if (paymentMethod === 'cash') {
        const response = await createPaymentPreference({
          ...basePayload,
          payment_method: 'cash',
          change_for: needsChange ? parseFloat(changeFor) || 0 : 0,
        });
        if (response.pedido_id) {
          localStorage.setItem('last_order_id', response.pedido_id);
          clearCart();
          setConfirmedTotal(finalTotal);
          setConfirmedOrderId(response.pedido_id);
          setCashOrderConfirmed(true);
        } else {
          throw new Error("Erro ao criar pedido em dinheiro.");
        }
        return;
      }

      // Online MP flow
      const paymentResponse = await createPaymentPreference({
        ...basePayload,
        payment_method: paymentMethod,
        urls_retorno: {
          sucesso: `${window.location.origin}/pagamento/sucesso`,
          falha: `${window.location.origin}/pagamento/falha`,
          pendente: `${window.location.origin}/pagamento/pendente`,
        },
      });
      if (paymentResponse.checkout_link) {
        if (paymentResponse.pedido_id) localStorage.setItem('last_order_id', paymentResponse.pedido_id);
        clearCart();
        window.location.href = paymentResponse.checkout_link;
      } else {
        throw new Error("Link de checkout não gerado pelo servidor.");
      }
    } catch (error) {
      addToast('error', error.message || 'Erro ao finalizar pedido.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Remover este item do carrinho?')) removeItemFromCart(itemId);
  };

  // ── Cash confirmation screen ───────────────────────────────────────────────
  if (cashOrderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="text-7xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Pedido Confirmado!</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
          <p className="text-gray-700 mb-2">
            Pague <span className="font-black text-2xl text-yellow-700">R$ {confirmedTotal.toFixed(2)}</span>
          </p>
          <p className="text-gray-600 text-sm">em dinheiro ao entregador na entrega</p>
          {needsChange && changeFor && (
            <p className="text-xs text-gray-500 mt-3">
              O entregador levará troco para R$ {parseFloat(changeFor).toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {confirmedOrderId && (
            <Button
              className="w-full"
              onClick={() => navigate(`/pedido/${confirmedOrderId}/acompanhar`)}
            >
              Acompanhar Pedido
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

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
          <Button asChild className="mt-6"><Link to="/">Ver restaurantes</Link></Button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
          {/* Cart items */}
          <div className="space-y-6 mb-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <img src={item.image_url || '/inka-logo.png'} alt={item.name}
                  className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600">R$ {parseFloat(item.price ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => removeItemFromCart(item.id)}>
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => addItemToCart(item)}>
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="font-bold w-24 text-right">
                  R$ {(parseFloat(item.price ?? 0) * item.quantity).toFixed(2)}
                </div>
                <Button variant="ghost" size="icon"
                  className="text-gray-400 hover:text-red-500" onClick={() => handleRemoveItem(item.id)}>
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
                {deliveryFee !== null && !isCalculatingFee && !feeError && `R$ ${safeFee.toFixed(2)}`}
              </span>
            </div>
            {deliveryDistance > 0 && (
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
          <PaymentMethodSelector
            selected={paymentMethod}
            onChange={handlePaymentMethodChange}
            acceptsCash={acceptsCash}
            total={finalTotal}
            needsChange={needsChange}
            onNeedsChangeToggle={setNeedsChange}
            changeFor={changeFor}
            onChangeForChange={setChangeFor}
          />

          {/* Actions */}
          <div className="flex justify-between mt-8 gap-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={clearCart}
              className="flex-1 text-red-500 border-red-500 hover:bg-red-500/10"
              disabled={isProcessingOrder}>
              Limpar Carrinho
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleFinalizarPedido}
              disabled={isProcessingOrder || isCalculatingFee || !!feeError || deliveryFee === null}
            >
              {isProcessingOrder ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
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
