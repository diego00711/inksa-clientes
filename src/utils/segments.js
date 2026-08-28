// Segmentos (verticais) do marketplace — eixo de expansão do Inksa.
// Fonte única: a barra de filtro da home e o card da loja precisam do MESMO
// rótulo. Antes o card tinha "Restaurante" fixo no código, então uma farmácia
// aparecia rotulada como restaurante.
//
// ÍCONE DE TRAÇO, NÃO EMOJI. Os chips usavam emoji (🍽️ 💊 🛒 🥖 🐾 🏪 🍺) e o
// conjunto nunca lia como coleção: cada emoji tem estilo, peso e paleta
// próprios, e ainda muda de desenho entre Android e iPhone — a mesma barra
// ficava diferente em cada aparelho. Multicolorido sobre o laranja do chip
// ativo então virava borrão.
//
// Os ícones do lucide são desenhados na MESMA grade e com a MESMA espessura de
// traço, então a fila inteira obedece a uma regra só. É o mesmo princípio das
// capas de destaque do Instagram, e pela mesma razão: o olho lê "coleção"
// quando as peças combinam.
//
// O campo `emoji` continua aqui porque segmentEmoji() é o retrato de reserva
// da loja sem logo. Hoje nada chama essa função — se continuar assim, ela e o
// campo podem sair juntos.
import {
  UtensilsCrossed, Pill, ShoppingCart, Croissant,
  PawPrint, Store, Beer, Coffee,
} from 'lucide-react';

export const SEGMENTS = [
  { value: "restaurante", icone: UtensilsCrossed,  emoji: "🍽️", label: "Restaurantes", singular: "Restaurante" },
  { value: "farmacia", icone: Pill,     emoji: "💊", label: "Farmácia",     singular: "Farmácia" },
  { value: "mercado", icone: ShoppingCart,      emoji: "🛒", label: "Mercado",      singular: "Mercado" },
  { value: "padaria", icone: Croissant,      emoji: "🥖", label: "Padaria",      singular: "Padaria" },
  { value: "cafeteria", icone: Coffee,    emoji: "☕", label: "Cafeteria",    singular: "Cafeteria" },
  { value: "pet", icone: PawPrint,          emoji: "🐾", label: "Pet",          singular: "Pet" },
  { value: "conveniencia", icone: Store, emoji: "🏪", label: "Conveniência", singular: "Conveniência" },
  { value: "bebidas", icone: Beer,      emoji: "🍺", label: "Bebidas",      singular: "Bebidas" },
];

/** Rótulo do segmento no singular (o que vai no card da loja). */
export function segmentLabel(segment) {
  const s = SEGMENTS.find((x) => x.value === (segment || 'restaurante'));
  return s?.singular || 'Loja';
}

/** Emoji do segmento — usado quando a loja não tem logo. */
export function segmentEmoji(segment) {
  const s = SEGMENTS.find((x) => x.value === (segment || 'restaurante'));
  return s?.emoji || '🏬';
}

/** Componente de ícone do segmento (lucide). Usado pelos chips da home. */
export function segmentIcon(segment) {
  const s = SEGMENTS.find((x) => x.value === (segment || 'restaurante'));
  return s?.icone || Store;
}
