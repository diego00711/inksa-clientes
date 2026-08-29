// src/pages/CartPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, PlusCircle, MinusCircle, Trash2, Loader2, MapPin, ChevronDown, LocateFixed, X } from "lucide-react";
import { useCart, chaveDaLinha } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentPreference, calculateDeliveryFee } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import ClientService from '../services/clientService';
import AddressService, { formatAddress } from '../services/addressService';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import CardPaymentModal from '../components/CardPaymentModal';
import PixPaymentModal from '../components/PixPaymentModal';
import { obterCoordenadas } from '../utils/localizacao';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { PENDING_COUPON_KEY } from '../components/StoreCoupons';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

export function CartPage() {
  const { cartItems, addItemToCart, removeItemFromCart, clearCart, subTotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [feeError, setFeeError] = useState(null);
  // Quem pode levar ESTE peso. Vem junto do frete (mesma chamada, mesmo peso).
  //   capazes = existem cadastrados com veículo suficiente, no raio. Zero aqui
  //             é ESTRUTURAL: esperar não resolve, ninguém vai poder pegar.
  //   online  = quantos desses estão disponíveis agora. Zero aqui é temporário.
  // A diferença separa "não dá" de "pode demorar" — e só a primeira bloqueia.
  const [capazes, setCapazes] = useState(null);
  const [capazesOnline, setCapazesOnline] = useState(null);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  // Endereços salvos
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressList, setShowAddressList] = useState(false);
  // Localização atual (GPS): pro cliente pedir de onde está, mesmo sem endereço
  // salvo ali (ex.: está em outra cidade). Quando setada, tem prioridade.
  const [currentLoc, setCurrentLoc] = useState(null); // {lat, lng, address}
  // Número e complemento de quem entrega na localização atual. O GPS marca a
  // RUA; a porta quem diz é a pessoa. Sem isso o entregador chega na calçada
  // certa sem saber em qual casa tocar — e entrega que não acontece custa o
  // frete, o tempo dele e o pedido do cliente.
  const [complementoGps, setComplementoGps] = useState('');
  const [locatingNow, setLocatingNow] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');

  // Coupon state — se o cliente clicou "Usar" num cupom na página da loja, o
  // código já vem preenchido aqui (ele não precisa decorar nem voltar lá).
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return localStorage.getItem(PENDING_COUPON_KEY) || '';
    } catch {
      return '';
    }
  });
  const [couponData, setCouponData] = useState(null); // {valid, discount_amount, message}
  const [couponLoading, setCouponLoading] = useState(false);
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState([]);

  // Observação do cliente pro pedido (ex: "sem cebola"). Chega no restaurante
  // (modal de detalhes + comanda impressa). O backend já grava em orders.notes.
  const [notes, setNotes] = useState('');

  // CPF pro pagamento online (exigência do PIX). Só entra em cena se o perfil
  // ainda não tem — o backend salva no primeiro uso e nunca mais pergunta.
  const [pedindoCpf, setPedindoCpf] = useState(false);
  const [cpfInput, setCpfInput] = useState('');
  const cpfDigitos = cpfInput.replace(/\D/g, '');
  const cpfSalvo = !!(clientProfile?.cpf || '').replace(/\D/g, '');

  // Cash order confirmation state
  const [cashOrderConfirmed, setCashOrderConfirmed] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  // Card-in-app (MP Bricks) state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [pixModal, setPixModal] = useState(null); // {pix, orderId, amount, checkoutLink}
  const [cardPayload, setCardPayload] = useState(null);

  // Provider de pagamento ativo no backend ('mercadopago' | 'asaas').
  // O cartão in-app (MP Bricks) só funciona no MP; com Asaas tudo online vai
  // pelo checkout hospedado (checkout_link), que aceita PIX e cartão.
  const [payProvider, setPayProvider] = useState('mercadopago');

  useEffect(() => {
    fetch(`${CLIENT_API_URL}/api/pagamentos/config`)
      .then((r) => r.json())
      .then((d) => { if (d?.provider) setPayProvider(d.provider); })
      .catch(() => {});
    ClientService.getProfile().then(setClientProfile).catch(() => {});
    AddressService.list()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => {});
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;

  // Coordenadas e endereço de entrega: LOCALIZAÇÃO ATUAL (GPS) tem prioridade;
  // senão, endereço salvo selecionado; senão, endereço principal do perfil.
  // NULL quando não há coordenada, nunca 0. `client_profiles` NÃO tem coluna de
  // latitude/longitude (só `client_addresses`), então o fallback pro perfil era
  // sempre undefined e o valor final virava 0 — que o backend lê como falsy e
  // responde 400 "coordenadas obrigatórias". Com o antigo fallback de R$ 5 isso
  // passava batido; agora vira erro visível, então precisa ser um erro que
  // explica o que fazer.
  const deliveryLat = currentLoc?.lat ?? selectedAddress?.latitude ?? null;
  const deliveryLng = currentLoc?.lng ?? selectedAddress?.longitude ?? null;
  const semCoordenada = deliveryLat == null || deliveryLng == null
    || Number(deliveryLat) === 0 || Number(deliveryLng) === 0;
  // Usando a localização atual, o complemento é OBRIGATÓRIO e entra no
  // endereço que o entregador recebe. Endereço salvo já tem número próprio.
  const faltaComplemento = !!currentLoc && complementoGps.trim().length < 2;
  const deliveryAddressStr = currentLoc
    ? [currentLoc.address, complementoGps.trim()].filter(Boolean).join(' — ')
    : (selectedAddress
      ? formatAddress(selectedAddress)
      : (clientProfile?.address || clientProfile?.full_address || ''));

  // Pega a localização atual do aparelho (Capacitor no app, navegador no web) e
  // faz reverse-geocode pra um endereço legível. Vira o destino da entrega.
  const useCurrentLocation = async () => {
    setLocatingNow(true);
    try {
      const coords = await obterCoordenadas();
      // Endereço para o ENTREGADOR ler, não para o banco de dados guardar.
      //
      // Antes vinha o `display_name` cru do Nominatim — "123, Rua X, Bairro,
      // Lages, Região Geográfica Imediata de Lages, Santa Catarina, Região
      // Sul, 88523-480, Brasil". Quem está de moto na chuva não lê isso. E
      // quando o serviço falhava, o entregador recebia literalmente um par de
      // coordenadas como endereço.
      // A geocodificação reversa passa pelo NOSSO backend, não direto no
      // Nominatim. O serviço deles exige User-Agent identificando quem chama
      // — coisa que o navegador não deixa definir num fetch —, então a
      // chamada direta era uso não identificado de um serviço comunitário,
      // sujeito a bloqueio silencioso. No backend também tem cache, e no dia
      // em que virar provedor pago a chave não vai no bundle do app.
      let address = `Minha localização (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
      try {
        const r = await fetch(
          `${CLIENT_API_URL}/api/public/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`,
        );
        if (r.ok) {
          const j = await r.json();
          if (j?.data?.endereco) address = j.data.endereco;
        }
      } catch { /* sem reverse-geocode -> usa as coords */ }
      setCurrentLoc({ ...coords, address });
      setShowAddressList(false);
      addToast('success', 'Usando sua localização atual para a entrega.');
    } catch (e) {
      addToast('error', e?.message || 'Não foi possível obter sua localização.');
    } finally {
      setLocatingNow(false);
    }
  };

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
      // Sem coordenada nem adianta chamar: o backend responde 400 e o cliente
      // lê um "erro" genérico sem saber o que fazer. Melhor dizer a ele.
      if (semCoordenada) {
        setFeeError('Escolha um endereço de entrega para calcular o frete.');
        setDeliveryFee(null);
        setDeliveryDistance(0);
        setIsCalculatingFee(false);
        return;
      }
      setIsCalculatingFee(true);
      setFeeError(null);
      try {
        const restaurantId = cartItems[0]?.restaurant_id;
        if (!restaurantId) { setFeeError("ID da loja não encontrado."); setDeliveryFee(null); return; }
        const feeData = await calculateDeliveryFee({
          restaurant_id: restaurantId,
          client_latitude: deliveryLat,
          client_longitude: deliveryLng,
          // Só id e quantidade: o servidor busca o PESO no catálogo. Mandar o
          // peso daqui seria deixar o cliente escolher o próprio frete.
          // Sem isso, pedido de 60kg de ração seria cotado como se coubesse
          // numa moto.
          items: cartItems.map((i) => ({
            menu_item_id: i.id ?? i.menu_item_id,
            quantity: i.quantity ?? 1,
          })),
        });
        // Loja de entrega própria que não alcança este endereço: para aqui.
        // deliveryFee fica null, e o botão de finalizar já é bloqueado por isso.
        if (feeData?.error === 'fora_da_area') {
          setFeeError(feeData.message || 'Esta loja não entrega no seu endereço.');
          setDeliveryFee(null);
          setDeliveryDistance(0);
          return;
        }
        // Qualquer coisa que não seja um cálculo bom bloqueia o checkout. Antes
        // o serviço devolvia "sucesso" com R$ 5 fixo em cima de falha, e o
        // pedido fechava com o frete errado sem ninguém perceber.
        if (feeData?.status !== 'success' || !feeData?.data) {
          setFeeError(feeData?.message || 'Não foi possível calcular o frete.');
          setDeliveryFee(null);
          setDeliveryDistance(0);
          return;
        }
        setDeliveryFee(Number(feeData.data.delivery_fee) || 0);
        setDeliveryDistance(Number(feeData.data.delivery_distance_km) || 0);
        // null = loja de entrega própria (não depende de entregador nosso) ou
        // a checagem falhou. Nos dois casos não mostra nada: aviso que a gente
        // não tem certeza é pior que aviso nenhum.
        setCapazes(feeData.data.entregadores_capazes ?? null);
        setCapazesOnline(feeData.data.entregadores_online ?? null);
      } catch {
        addToast('error', "Não foi possível calcular o frete.");
        setFeeError("Não foi possível calcular o frete.");
        setDeliveryFee(null);
      } finally {
        setIsCalculatingFee(false);
      }
    };
    fetchDeliveryFee();
  }, [cartItems, addToast, deliveryLat, deliveryLng, semCoordenada]);

  const safeFee = Number(deliveryFee) || 0;
  const couponDiscount = (couponData?.valid && Number(couponData?.discount_amount) > 0)
    ? Number(couponData.discount_amount)
    : 0;
  const finalTotal = Math.max(0, subTotal + safeFee - couponDiscount);
  const acceptsCash = restaurantInfo?.accepts_cash ?? true;
  // Só bloqueia quando o backend confirma que está fechado (is_open === false).
  // Se o campo vier ausente, trata como aberto pra não travar o checkout à toa —
  // o servidor tem a trava autoritativa de qualquer forma.
  const restauranteFechado = restaurantInfo?.is_open === false;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setNeedsChange(false);
    setChangeFor('');
  };

  // Cupons que ESTE cliente pode usar NESTE carrinho, já com o valor de cada um.
  //
  // Entra um cupom por pedido, e antes disto o cliente não tinha como saber
  // nem disso nem do que tinha na mão: o convidado ganhava frete grátis, chegava
  // numa loja em promoção e escolhia às cegas — quando sabia que havia escolha.
  useEffect(() => {
    const restaurantId = cartItems[0]?.restaurant_id;
    // Sem conta não há cupom pessoal nem como saber quem é: pular a chamada
    // evita um 401 inútil a cada mudança do carrinho.
    if (!isAuthenticated || !restaurantId || subTotal <= 0) { setCuponsDisponiveis([]); return; }
    let vivo = true;
    const q = new URLSearchParams({
      restaurant_id: restaurantId,
      subtotal: String(subTotal),
      delivery_fee: String(safeFee),
    });
    fetch(`${CLIENT_API_URL}/api/coupons/disponiveis?${q}`, { headers: createAuthHeaders() })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => { if (vivo) setCuponsDisponiveis(j?.data || []); })
      .catch(() => { if (vivo) setCuponsDisponiveis([]); });
    return () => { vivo = false; };
  }, [cartItems, subTotal, safeFee, isAuthenticated]);

  const applyCoupon = async (codigo) => {
    const alvo = (codigo ?? couponCode).trim();
    if (!alvo) return;
    if (codigo) setCouponCode(codigo);
    setCouponLoading(true);
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // A loja do carrinho vai junto: cupom criado por um parceiro só vale na
        // loja dele. Sem isso o cliente veria "válido" aqui e levaria a recusa
        // só no fechamento do pedido.
        body: JSON.stringify({
          code: alvo,
          order_total: subTotal,
          delivery_fee: safeFee,
          restaurant_id: cartItems[0]?.restaurant_id || null,
        }),
      });
      const data = await res.json();
      setCouponData(data);
    } catch (e) {
      setCouponData({ valid: false, message: 'Erro ao validar cupom' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleFinalizarPedido = async () => {
    if (!isAuthenticated) {
      // Volta pro carrinho depois de entrar: o carrinho é local, então o que
      // ele montou continua lá. Mandar pra home apagaria o esforço da cabeça
      // dele mesmo com os itens salvos.
      addToast('info', 'Entre na sua conta para finalizar — seu carrinho fica guardado.');
      navigate('/login', { state: { from: '/carrinho' } });
      return;
    }
    if (cartItems.length === 0) { addToast('warning', 'Seu carrinho está vazio!'); return; }
    if (restauranteFechado) {
      addToast('warning', 'Esta loja está fechada e não está aceitando pedidos no momento.');
      return;
    }
    const restaurantIds = [...new Set(cartItems.map(item => item.restaurant_id))];
    if (restaurantIds.length > 1) { addToast('warning', 'Apenas uma loja por pedido.'); return; }
    if (deliveryFee === null || isCalculatingFee || feeError) {
      addToast('error', 'Aguarde o cálculo do frete antes de finalizar.'); return;
    }
    // NENHUM entregador com veículo pra esta carga. Deixar pagar aqui seria o
    // pior desfecho: dinheiro presa num pedido que ninguém pode buscar, e a
    // pessoa descobrindo pela demora. Bloqueia só o caso estrutural (capazes
    // === 0); "tem capaz mas ninguém online" é aviso, não trava.
    if (capazes === 0) {
      addToast('error', 'Ainda não temos veículo para uma carga deste peso nesta região.');
      return;
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

    // CPF só é exigido no pagamento ONLINE (regra do PIX/cartão). Quem paga em
    // dinheiro nunca vê esse campo — por isso a pergunta fica aqui no checkout
    // e não no cadastro, que é a porta de entrada e não pode ganhar fricção.
    if (paymentMethod !== 'cash' && !cpfSalvo && !cpfDigitos) {
      setPedindoCpf(true);
      return;
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
          // Só os IDs importam: o servidor busca nome e preço de cada opção no
          // banco e recalcula. Mandar preço daqui seria deixar o cliente
          // escolher quanto paga pelo adicional.
          opcoes: (item.opcoes || []).map((o) => ({ id: o.id, qtd: o.qtd || 1 })),
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
        delivery_address: deliveryAddressStr,
        client_latitude: deliveryLat,
        client_longitude: deliveryLng,
        delivery_distance_km: deliveryDistance || 0,
        notes: notes.trim(),
        cliente_email: user.email,
        // Vai só quando o cliente acabou de digitar; o backend guarda no perfil
        // e nas próximas compras nem pergunta.
        ...(cpfDigitos ? { cpf: cpfDigitos } : {}),
        ...(couponData?.valid && couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
      };

      // Cartão DENTRO do app (sem redirecionar) — só no MP (Bricks). Com outro
      // provider, cartão segue pelo checkout hospedado como o PIX.
      if (['credit', 'debit'].includes(paymentMethod) && MP_PUBLIC_KEY && payProvider === 'mercadopago') {
        setCardPayload(basePayload);
        setCardModalOpen(true);
        setIsProcessingOrder(false);
        return;
      }

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
      // PIX inline: se o backend mandou o QR/copia-e-cola, mostra a tela de PIX
      // DENTRO do app em vez de redirecionar pro checkout do Asaas. O pedido já
      // existe (awaiting_payment); o modal detecta a confirmação e leva pro
      // acompanhamento. checkout_link fica como rede de segurança no próprio modal.
      if (paymentResponse.pix?.payload && paymentResponse.pedido_id) {
        localStorage.setItem('last_order_id', paymentResponse.pedido_id);
        clearCart();
        setPixModal({
          pix: paymentResponse.pix,
          orderId: paymentResponse.pedido_id,
          amount: finalTotal,
          checkoutLink: paymentResponse.checkout_link,
        });
        return;
      }
      if (paymentResponse.checkout_link) {
        if (paymentResponse.pedido_id) {
          localStorage.setItem('last_order_id', paymentResponse.pedido_id);
          // rede de segurança: ao voltar do checkout do Asaas (mesmo sem
          // redirect — típico no PIX), o app leva pra tela do pedido.
          try {
            localStorage.setItem('payment_redirect', JSON.stringify({ id: paymentResponse.pedido_id, ts: Date.now() }));
          } catch {}
        }
        clearCart();
        window.location.href = paymentResponse.checkout_link;
      } else {
        throw new Error("Link de checkout não gerado pelo servidor.");
      }
    } catch (error) {
      // O servidor recusou por falta de veículo pra esta carga. Se ele recusou,
      // é porque o que esta tela sabia estava velho (frete calculado antes de
      // alguém sair, ou JS antigo em memória). Corrige o estado na hora: o
      // bloco vermelho aparece e o botão trava, em vez de a pessoa tentar de
      // novo e levar o mesmo toast.
      if (error.code === 'SEM_ENTREGADOR') setCapazes(0);
      // Frete mudou entre o carrinho e o fechamento: recalcula sozinho, senão
      // ela fica presa num erro que só sai saindo e voltando da tela.
      if (error.code === 'FRETE_DIVERGENTE' && error.data?.delivery_fee_correto != null) {
        setDeliveryFee(Number(error.data.delivery_fee_correto));
      }
      addToast('error', error.message || 'Erro ao finalizar pedido.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (await confirm({ title: 'Remover item', message: 'Remover este item do carrinho?', confirmText: 'Remover', danger: true })) {
      removeItemFromCart(itemId);
    }
  };

  // ── Cash confirmation screen ───────────────────────────────────────────────
  if (cashOrderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="text-7xl mb-6">✅</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Pedido Confirmado!</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6 mb-6">
          <p className="text-gray-700 mb-2">
            Pague <span className="font-black text-xl sm:text-2xl text-yellow-700">R$ {confirmedTotal.toFixed(2)}</span>
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
        <h1 className="text-xl sm:text-3xl font-bold ml-4">Meu Carrinho</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="mx-auto h-24 w-24 text-gray-300" />
          <h2 className="mt-6 text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-gray-500">Adicione itens para continuar.</p>
          <Button asChild className="mt-6"><Link to="/">Ver lojas</Link></Button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
          {/* Cart items */}
          <div className="space-y-6 mb-8">
            {cartItems.map(item => (
              <div key={chaveDaLinha(item)} className="flex items-start gap-3">
                <img src={item.image_url || '/inka-logo.png'} alt={item.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0" />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                  {/* As escolhas precisam aparecer AQUI. Sem isso o cliente vê
                      duas linhas iguais do mesmo prato e não entende por que
                      uma custa mais — e não tem como conferir se pediu certo. */}
                  {item.opcoes?.length > 0 && (
                    <p className="text-xs text-gray-500 leading-snug">
                      {item.opcoes.map((o) => (o.qtd > 1 ? `${o.qtd}x ${o.nome}` : o.nome)).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">R$ {parseFloat(item.price ?? 0).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[32px]" onClick={() => removeItemFromCart(chaveDaLinha(item))}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[32px]" onClick={() => addItemToCart(item)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-bold text-sm">
                    R$ {(parseFloat(item.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[32px]"
                    onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
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
                {/* Quem não entrou não tem endereço, então não há frete a
                    calcular. Mostrar erro vermelho aqui seria acusar o cliente
                    de um problema que ele não tem — e nenhum valor inventado,
                    porque frete que muda depois de escolhido é o tipo de
                    surpresa que faz a pessoa desistir no checkout. */}
                {!isAuthenticated ? (
                  <span className="text-sm text-gray-500">calculado ao entrar</span>
                ) : (
                  <>
                    {isCalculatingFee && <Loader2 className="h-4 w-4 animate-spin inline-block" />}
                    {feeError && <span className="text-red-500">{feeError}</span>}
                    {deliveryFee !== null && !isCalculatingFee && !feeError && `R$ ${safeFee.toFixed(2)}`}
                  </>
                )}
              </span>
            </div>
            {deliveryDistance > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Distância</span>
                <span>{deliveryDistance.toFixed(1)} km</span>
              </div>
            )}

            {capazes === 0 && (
            <div className="mx-1 mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-800">
                Não temos veículo para esta carga
              </p>
              <p className="mt-0.5 text-xs text-red-700">
                O peso deste pedido exige um veículo maior do que os disponíveis na
                sua região. Tire alguns itens ou divida em dois pedidos.
              </p>
            </div>
          )}
            {capazes > 0 && capazesOnline === 0 && (
            <div className="mx-1 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-bold text-amber-800">
                Pode demorar mais que o normal
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                No momento não há entregador online com veículo para este peso. Você
                pode pedir — assim que alguém entrar, o pedido é enviado.
              </p>
            </div>
          )}

      {/* Cupom de desconto */}
            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Cupom de desconto</p>

              {/* A ESCOLHA APARECE em vez de ficar escondida. Só um cupom entra
                  por pedido — mostrar os dois lado a lado com quanto cada um
                  economiza transforma um conflito silencioso numa decisão. */}
              {cuponsDisponiveis.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {cuponsDisponiveis.map((c, i) => {
                    const escolhido = couponData?.valid && couponCode.trim().toUpperCase() === c.codigo;
                    return (
                      <button
                        key={c.codigo}
                        onClick={() => applyCoupon(c.codigo)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          escolhido ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-gray-800">
                            {c.codigo}
                            {c.meu && <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">SEU</span>}
                            {/* Só marca o melhor quando há mais de um: com um
                                cupom só, "melhor" não informa nada. */}
                            {i === 0 && cuponsDisponiveis.length > 1 && (
                              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">MELHOR</span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {c.tipo === 'free_delivery' ? 'Frete grátis' : c.descricao || 'Desconto'}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-green-700">
                          − R$ {Number(c.desconto).toFixed(2).replace('.', ',')}
                        </span>
                      </button>
                    );
                  })}
                  {cuponsDisponiveis.length > 1 && (
                    <p className="pt-0.5 text-xs text-gray-500">
                      Vale <strong>um cupom por pedido</strong>. Os outros continuam
                      valendo até vencer — use no próximo.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  className="flex-1 border rounded-lg px-3 py-2 text-base text-sm uppercase"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="bg-[#FF6F00] text-white px-4 rounded-lg min-h-[44px] text-sm font-medium disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponData && (
                <p className={`text-sm mt-1 ${couponData.valid ? 'text-green-600' : 'text-red-500'}`}>
                  {couponData.valid
                    ? `✓ Desconto de R$ ${Number(couponData.discount_amount).toFixed(2)} aplicado!`
                    : couponData.message}
                </p>
              )}
            </div>

            {/* Observações do pedido — vão pro restaurante (modal + comanda) */}
            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Observações do pedido</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Ex: sem cebola, ponto da carne, tocar a campainha…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{notes.length}/300</p>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600 text-sm">
                <span>Desconto do cupom</span>
                <span>- R$ {couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-bold mt-2">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Endereço de entrega */}
          <div className="border-t pt-5 mt-5">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-500" /> Endereço de entrega
            </p>
            {addresses.length === 0 ? (
              <button
                onClick={() => navigate('/perfil')}
                className="w-full text-left border border-dashed border-orange-300 rounded-xl p-3 text-sm text-orange-600 hover:bg-orange-50"
              >
                + Cadastrar endereço de entrega
              </button>
            ) : (
              <div className="border rounded-xl">
                <button
                  onClick={() => setShowAddressList((v) => !v)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-sm text-gray-800">{selectedAddress?.label || 'Selecione'}</span>
                    <span className="block text-xs text-gray-500 truncate">{deliveryAddressStr || 'Toque para escolher'}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAddressList ? 'rotate-180' : ''}`} />
                </button>
                {showAddressList && (
                  <div className="border-t divide-y">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedAddressId(a.id); setShowAddressList(false); }}
                        className={`w-full text-left p-3 text-sm hover:bg-gray-50 ${a.id === selectedAddressId ? 'bg-orange-50' : ''}`}
                      >
                        <span className="font-semibold text-gray-800">{a.label}</span>
                        {a.is_default && <span className="ml-2 text-[10px] font-bold text-green-700">PADRÃO</span>}
                        <span className="block text-xs text-gray-500 truncate">{formatAddress(a)}</span>
                      </button>
                    ))}
                    <button onClick={() => navigate('/perfil')} className="w-full text-left p-3 text-sm text-orange-600 hover:bg-orange-50">
                      + Gerenciar endereços
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Usar localização atual (GPS) — pra pedir de onde está, mesmo sem
                endereço salvo aqui (ex.: está em outra cidade). */}
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locatingNow}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold py-2.5 hover:bg-orange-100 disabled:opacity-60"
            >
              {locatingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              {locatingNow ? 'Buscando GPS...' : 'Usar minha localização atual'}
            </button>
            {currentLoc && (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 p-3">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-green-800">Entregar na minha localização atual</p>
                  <p className="text-xs text-green-700 break-words">{currentLoc.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCurrentLoc(null); setComplementoGps(''); }}
                  className="text-green-700 hover:text-green-900 shrink-0"
                  aria-label="Voltar a usar endereço salvo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* O GPS acerta a rua, não a porta. Este campo é o que evita o
                entregador rodando no quarteirão com a comida esfriando. */}
            {currentLoc && (
              <div className="mt-2">
                <label htmlFor="complementoGps" className="block text-xs font-semibold text-gray-700">
                  Número e complemento <span className="text-red-500">*</span>
                </label>
                <input
                  id="complementoGps"
                  type="text"
                  value={complementoGps}
                  onChange={(e) => setComplementoGps(e.target.value)}
                  maxLength={120}
                  placeholder="Ex: 307, casa dos fundos, portão azul"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  O GPS mostra a rua certa, mas não diz qual é a sua porta.
                </p>
                {faltaComplemento && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Preencha para o entregador conseguir te achar.
                  </p>
                )}
              </div>
            )}
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

          {/* Aviso de restaurante fechado */}
          {restauranteFechado && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Esta loja está <strong>fechada</strong> agora e não está aceitando pedidos. Você pode montar o carrinho e finalizar quando ela reabrir.</span>
            </div>
          )}

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
              // Sem conta o frete NUNCA é calculado (não há endereço), e as
              // travas abaixo dependem dele — o botão ficaria morto pra sempre
              // e a pessoa nem chegaria na tela de login. Por isso o anônimo
              // passa direto: o clique dele é "entrar", não "pedir".
              disabled={isAuthenticated && (
                isProcessingOrder || isCalculatingFee || !!feeError
                || deliveryFee === null || restauranteFechado || faltaComplemento)}
            >
              {!isAuthenticated ? (
                'Entrar para finalizar o pedido'
              ) : isProcessingOrder ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : restauranteFechado ? (
                'Loja fechada'
              ) : paymentMethod === 'cash' ? (
                '💵 Confirmar Pedido'
              ) : (
                'Finalizar Pedido e Pagar'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* CPF pro pagamento online. Aparece UMA vez: o backend salva no perfil
          e nas próximas compras nem pergunta. Quem paga em dinheiro nunca vê. */}
      {pedindoCpf && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">Falta só o seu CPF</h3>
            <p className="mt-1 text-sm text-gray-600">
              O banco exige o CPF para gerar o PIX e a cobrança no cartão.
              Pedimos uma vez só.
            </p>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={cpfInput}
              onChange={(e) => setCpfInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="Somente números"
              className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-lg tracking-wider focus:border-orange-500 focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setPedindoCpf(false); setCpfInput(''); }}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                disabled={cpfDigitos.length !== 11}
                onClick={() => { setPedindoCpf(false); handleFinalizarPedido(); }}
                className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
            <button
              onClick={() => { setPedindoCpf(false); setCpfInput(''); setPaymentMethod('cash'); }}
              className="mt-3 w-full text-sm font-medium text-gray-500 underline"
            >
              Prefiro pagar em dinheiro na entrega
            </button>
          </div>
        </div>
      )}

      <CardPaymentModal
        isOpen={cardModalOpen}
        amount={finalTotal}
        orderPayload={cardPayload || {}}
        onApproved={(orderId, state) => {
          setCardModalOpen(false);
          clearCart();
          if (state === 'pending') {
            addToast('info', 'Pagamento em análise. Avisaremos quando aprovado.');
          } else {
            addToast('success', '✅ Pagamento aprovado!');
          }
          if (orderId) {
            localStorage.setItem('last_order_id', orderId);
            navigate(`/pedido/${orderId}/acompanhar`);
          } else {
            navigate('/');
          }
        }}
        onError={(m) => addToast('error', m || 'Pagamento não concluído.')}
        onClose={() => setCardModalOpen(false)}
      />

      {pixModal && (
        <PixPaymentModal
          pix={pixModal.pix}
          orderId={pixModal.orderId}
          amount={pixModal.amount}
          checkoutLink={pixModal.checkoutLink}
          onPaid={() => {
            addToast('success', '✅ Pagamento confirmado!');
            const id = pixModal.orderId;
            setPixModal(null);
            navigate(`/pedido/${id}/acompanhar`);
          }}
          onClose={() => {
            // Fechou sem pagar: o pedido fica em "Aguardando pagamento" e ele
            // pode retomar por "Meus pedidos".
            setPixModal(null);
            navigate('/meus-pedidos');
          }}
        />
      )}
    </div>
  );
}
