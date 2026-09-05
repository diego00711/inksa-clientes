// Local: src/pages/RestaurantDetailsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Loader2, MapPin, Clock, Phone, AlertCircle, Plus, Minus, Flame } from "lucide-react";
import { useCart, montarItemComOpcoes } from '../context/CartContext';
import RestaurantService from '../services/restaurantService';
import StoreCoupons from '../components/StoreCoupons';
import EscolherOpcoes from '../components/EscolherOpcoes';
import { DescricaoExpandivel } from '../components/DescricaoExpandivel';
import BarraLocalizacao from '../components/BarraLocalizacao';
import FotoAmpliada from '../components/FotoAmpliada';

export function RestaurantDetailsPage() {
  const { id } = useParams();
  const { addItemToCart, totalItemsInCart, subTotal } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [fotoAberta, setFotoAberta] = useState(null); // {url, nome}
  const [ordem, setOrdem] = useState('padrao');
  const [ranking, setRanking] = useState({ itens_com_venda: 0, janela_dias: 0 });
  // Disponíveis x esgotados — ver o comentário no contador do cardápio.
  const disponiveis = menuItems.filter((m) => m.available !== false).length;
  const esgotados = menuItems.length - disponiveis;

  // "MAIS PEDIDOS" SÓ APARECE SE HOUVER O QUE RANQUEAR.
  //
  // Loja sem venda na janela mostraria um botão que não muda nada na tela —
  // e controle que não faz nada é pior que controle ausente: a pessoa toca,
  // não vê diferença e conclui que o app está quebrado. O servidor manda
  // quantos itens já venderam justamente para esta decisão.
  const temRanking = (ranking?.itens_com_venda || 0) > 0;

  const ORDENACOES = [
    { id: 'padrao', rotulo: 'Padrão' },
    ...(temRanking ? [{ id: 'mais_pedidos', rotulo: 'Mais pedidos', icone: Flame }] : []),
    { id: 'menor_preco', rotulo: 'Menor preço' },
    { id: 'maior_preco', rotulo: 'Maior preço' },
  ];

  const itensOrdenados = useMemo(() => {
    // 'padrao' devolve EXATAMENTE o que o servidor mandou (categoria,
    // disponível primeiro, nome). Não reordenar nada aqui é o que garante que
    // quem nunca toca no filtro vê o cardápio como sempre viu.
    if (ordem === 'padrao') return menuItems;

    const preco = (x) => Number(x.price ?? 0);
    const comparadores = {
      // `vendas` vem do servidor contando por menu_item_id na janela.
      mais_pedidos: (a, b) => Number(b.vendas ?? 0) - Number(a.vendas ?? 0),
      // Ordena pelo preço VIGENTE, que é o mesmo número escrito na tela.
      // Usar o cheio faria um item de R$ 20 em promoção por R$ 9 aparecer
      // entre os de R$ 20 — a lista pareceria embaralhada. Ver utils/precos.py.
      menor_preco: (a, b) => preco(a) - preco(b),
      maior_preco: (a, b) => preco(b) - preco(a),
    };
    const comparar = comparadores[ordem] || (() => 0);

    return menuItems
      .map((m, i) => ({ m, i }))   // índice guarda a ordem original
      .sort((a, b) => {
        // Esgotado sempre por último, em qualquer ordenação: não faz sentido
        // o "mais pedido" da loja ser algo que ninguém pode comprar agora.
        const ea = a.m.available === false ? 1 : 0;
        const eb = b.m.available === false ? 1 : 0;
        if (ea !== eb) return ea - eb;
        const r = comparar(a.m, b.m);
        // Empate (inclusive todo mundo com 0 venda) mantém a ordem do servidor
        // em vez de embaralhar — sort do JS não garante estabilidade sozinho
        // em todos os motores.
        return r !== 0 ? r : a.i - b.i;
      })
      .map((x) => x.m);
  }, [menuItems, ordem]);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await RestaurantService.getRestaurantDetails(id);
        setRestaurant(data);
        const items = data.menu_items || data.menuItems || data.items || [];
        setMenuItems(items);
        setRanking(data.ranking || { itens_com_venda: 0, janela_dias: 0 });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  // Item com grupos de opção abre a tela de escolha antes de cair no carrinho.
  // Descobrir se TEM opção custa uma consulta; fazer isso pra cada item ao
  // desenhar o cardápio seria uma consulta por linha. Então pergunta só quando
  // a pessoa aperta adicionar — e se não houver grupo nenhum, a tela devolve
  // na hora e o item entra direto, sem passo a mais pra quem não usa opções.
  const [itemEscolhendo, setItemEscolhendo] = useState(null);

  const colocarNoCarrinho = (item, quantity, opcoes) => {
    const base = { ...item, restaurant_id: restaurant.id, quantity };
    const comOpcoes = opcoes?.length ? montarItemComOpcoes(base, opcoes) : base;
    for (let i = 0; i < quantity; i++) addItemToCart(comOpcoes);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    setItemEscolhendo({ item, quantity });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="text-gray-600">Carregando loja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 p-8 rounded-xl max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-red-800">Erro ao Carregar</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/" className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-50 p-8 rounded-xl max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">A loja que você procura não existe ou foi removida.</p>
          <Link to="/" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  // SEM QUEM ENTREGUE, NÃO DEIXA MONTAR CARRINHO.
  //
  // O servidor decide (ele conhece a posição da loja, o raio e quem deu sinal
  // de vida) e manda pronto. A tela não recalcula nada — se recalculasse, a
  // regra existiria em dois lugares e um dia divergiriam.
  //
  // Isto é aviso, não a trava: a barreira de verdade está na criação do
  // pedido, nos três caminhos do servidor. Aqui é só para a pessoa não
  // escolher meia dúzia de itens e descobrir no fim.
  const entregadores = restaurant.entregadores || {};
  const semEntregador = entregadores.bloqueado === true;

  const ratingValue = restaurant.rating ?? 0;
  const deliveryFee = restaurant.delivery_fee ?? 0;
  // Loja de entrega PRÓPRIA cobra a taxa fixa dela; loja da plataforma tem
  // frete por distância e peso, que só existe depois do endereço. Mostrar o
  // delivery_fee estático nesse caso era anunciar R$ 1,00 e cobrar R$ 30 no
  // carrinho — o card da lista já tratava isso, esta tela não.
  const temTaxaPropria = (restaurant.delivery_type ?? 'platform') !== 'platform'
    && Number(deliveryFee) > 0;
  const deliveryTime = restaurant.delivery_time;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com botão voltar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100">
              <Link to="/">
                <ChevronLeft className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {restaurant.restaurant_name}
            </h1>
          </div>
        </div>
      </div>

      {/* O FRETE ANTES DO CARRINHO. Fica no topo, acima do banner, porque
          descobrir a entrega depois de montar o pedido é o jeito mais caro de
          perder alguém — em especial quem chegou pelo link do Instagram e
          ainda não conhece a Inksa. Dispensável de propósito. */}
      <div className="max-w-4xl mx-auto">
        {semEntregador ? (
          /* Fica NO LUGAR da barra de frete, não acima dela: cotar entrega
             que ninguém pode fazer é oferecer o que não existe, e duas
             mensagens juntas competindo pela atenção não ajudam ninguém. */
          <div className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  {entregadores.titulo || 'Sem entregadores ativos na sua região'}
                </p>
                {entregadores.detalhe && (
                  <p className="text-sm text-amber-800 mt-1">{entregadores.detalhe}</p>
                )}
                <Link to="/" className="mt-2 inline-block text-sm font-semibold text-amber-900 underline">
                  Ver outras lojas
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <BarraLocalizacao
            restaurantId={restaurant.id ?? id}
            deliveryType={restaurant.delivery_type ?? 'platform'}
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner do Restaurante */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-44 sm:h-64">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.restaurant_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <span className="text-6xl select-none" aria-hidden>🍽️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h2 className="text-lg sm:text-2xl font-bold mb-1 truncate">{restaurant.restaurant_name}</h2>
              <div className="flex items-center gap-4 text-sm">
                {restaurant.category && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {restaurant.category}
                  </span>
                )}
                {/* A nota é o atalho pras avaliações: toca aqui e abre a página
                    cheia. Antes o bloco de avaliações ficava no meio da página
                    e poluía o cardápio. */}
                <Link
                  to={`/restaurantes/${id}/avaliacoes`}
                  className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Ver avaliações da loja"
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{parseFloat(ratingValue).toFixed(1)}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                </Link>
              </div>
            </div>
          </div>

          {/* Informações do Restaurante */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-sm">
                  {restaurant.distance_km ? `${restaurant.distance_km} km` : 'Distância não calculada'}
                </span>
              </div>
              
              {deliveryTime && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">{deliveryTime}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-sm font-medium">
                  {temTaxaPropria ? (
                    `Entrega: R$ ${parseFloat(deliveryFee).toFixed(2)}`
                  ) : (
                    <span className="text-blue-600 font-medium">Frete calculado no seu endereço</span>
                  )}
                </span>
              </div>
            </div>

            {restaurant.description && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cupons da loja — antes do cardápio, pra decidir o pedido já sabendo
            que tem desconto. */}
        <StoreCoupons coupons={restaurant.coupons} />

        {/* Cardápio */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center gap-2">
            🍽️ Cardápio
            {/* Conta só o que dá pra comprar, e diz quantos estão esgotados
                em vez de escondê-los na soma. Com o esgotado visível, um
                "(12 itens)" que inclui 5 indisponíveis promete mais do que a
                loja entrega. */}
            <span className="text-sm font-normal text-gray-500">
              ({disponiveis} {disponiveis === 1 ? 'item' : 'itens'}
              {esgotados > 0 ? ` · ${esgotados} esgotado${esgotados > 1 ? 's' : ''}` : ''})
            </span>
          </h2>

          {/* ORDENAÇÃO — só aparece com cardápio suficiente para valer a pena.
              Abaixo de 4 itens a lista inteira cabe na tela e o filtro seria
              enfeite ocupando altura útil no celular. */}
          {menuItems.length >= 4 && (
            <div
              role="group"
              aria-label="Ordenar o cardápio"
              className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1"
            >
              {ORDENACOES.map(({ id, rotulo, icone: Icone }) => {
                const ativo = ordem === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOrdem(id)}
                    aria-pressed={ativo}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium border transition-colors min-h-[36px] ${
                      ativo
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                    }`}
                  >
                    {Icone && <Icone className="h-4 w-4" aria-hidden="true" />}
                    {rotulo}
                  </button>
                );
              })}
            </div>
          )}

          {menuItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {itensOrdenados.map(item => {
                const quantity = quantities[item.id] || 0;
                // ESGOTADO APARECE, APAGADO. Antes o servidor nem mandava o
                // item: sumia do cardápio, e junto sumia a informação de que a
                // loja TEM aquilo. `available` vem como false; só o texto e o
                // preço continuam legíveis, o resto perde cor e o botão sai.
                const esgotado = item.available === false;
                return (
                  <div
                    key={item.id}
                    aria-disabled={esgotado || undefined}
                    className={`relative border rounded-xl p-3 sm:p-4 transition-shadow ${
                      esgotado
                        ? 'border-gray-150 bg-gray-50/60'
                        : 'border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex gap-3 ${esgotado ? 'opacity-55' : ''}`}>
                      {item.image_url ? (
                        /* A miniatura abre a foto grande. É botão e não uma
                           <img> com onClick: assim funciona no teclado e o
                           leitor de tela anuncia que dá pra tocar. O aria-label
                           diz o que acontece, não o que é. */
                        <button
                          type="button"
                          onClick={() => setFotoAberta({ url: item.image_url, nome: item.name })}
                          aria-label={`Ver a foto de ${item.name} em tamanho maior`}
                          className="flex-shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                          />
                        </button>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <span className="text-2xl select-none" aria-hidden>🍔</span>
                        </div>
                      )}

                      <div className="flex-grow min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 leading-tight">{item.name}</h3>
                        <DescricaoExpandivel texto={item.description} />
                        {/* PROMOÇÃO — `item.price` JÁ vem com o desconto
                            aplicado do servidor; `original_price` só existe
                            quando a promoção está valendo. Por isso aqui não
                            se calcula nada: se o campo veio, desenha o
                            riscado. Ver utils/precos.py no backend. */}
                        <div className="flex items-baseline gap-2 flex-wrap mb-2">
                          <p className="text-lg sm:text-xl font-bold text-orange-600">
                            R$ {parseFloat(item.price ?? 0).toFixed(2)}
                          </p>
                          {item.original_price ? (
                            <>
                              <span className="text-sm text-gray-400 line-through">
                                R$ {parseFloat(item.original_price).toFixed(2)}
                              </span>
                              <span className="text-[11px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                {item.discount_percent}% OFF
                              </span>
                            </>
                          ) : null}
                        </div>

                        {/* Sem controles quando esgotado: um botão desativado
                            ainda convida ao toque e frustra. O selo diz o que
                            está acontecendo, que é o que a pessoa precisa. */}
                        {esgotado ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600">
                            Indisponível no momento
                          </span>
                        ) : semEntregador ? (
                          /* O item continua legível — a loja TEM isto, e some
                             a informação junto com o botão seria esconder o
                             cardápio. O que sai é só o caminho de comprar. */
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                            Sem entrega no momento
                          </span>
                        ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={quantity === 0}
                              className="h-9 w-9 min-h-[36px] p-0 hover:bg-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-7 text-center font-medium text-sm">{quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="h-9 w-9 min-h-[36px] p-0 hover:bg-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white min-h-[36px] text-sm px-3"
                            disabled={quantity === 0}
                          >
                            {quantity === 0 ? 'Adicionar' : `+ ${quantity}`}
                          </Button>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cardápio em preparação</h3>
                <p className="text-gray-600 mb-4">
                  Este restaurante ainda não cadastrou itens no cardápio.
                </p>
                <p className="text-sm text-gray-500">
                  Entre em contato para verificar as opções disponíveis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* espaçador: evita o último item ficar atrás da barra "Ver carrinho" */}
        {totalItemsInCart > 0 && <div className="h-20" aria-hidden />}
      </div>

      {/* Barra flutuante "Ver carrinho" — aparece quando há itens no carrinho */}
      {totalItemsInCart > 0 && (
        <div
          className="fixed left-0 right-0 z-40 px-4 sm:px-6"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-4xl mx-auto">
            <Link
              to="/carrinho"
              className="flex items-center justify-between gap-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 px-5 py-3.5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/25 text-sm font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
                Ver carrinho
              </span>
              <span className="font-bold">R$ {Number(subTotal || 0).toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}

      {fotoAberta && (
        <FotoAmpliada
          url={fotoAberta.url}
          alt={fotoAberta.nome}
          onFechar={() => setFotoAberta(null)}
        />
      )}

      {itemEscolhendo && (
        <EscolherOpcoes
          item={itemEscolhendo.item}
          quantidade={itemEscolhendo.quantity}
          onConfirmar={(opcoes) => {
            colocarNoCarrinho(itemEscolhendo.item, itemEscolhendo.quantity, opcoes);
            setItemEscolhendo(null);
          }}
          onFechar={() => setItemEscolhendo(null)}
        />
      )}
    </div>
  );
}
