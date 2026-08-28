// Segmentos (verticais) do marketplace — eixo de expansão do Inksa.
// Fonte única: a barra de filtro da home e o card da loja precisam do MESMO
// rótulo. Antes o card tinha "Restaurante" fixo no código, então uma farmácia
// aparecia rotulada como restaurante.
export const SEGMENTS = [
  { value: "restaurante",  emoji: "🍽️", label: "Restaurantes", singular: "Restaurante" },
  { value: "farmacia",     emoji: "💊", label: "Farmácia",     singular: "Farmácia" },
  { value: "mercado",      emoji: "🛒", label: "Mercado",      singular: "Mercado" },
  { value: "padaria",      emoji: "🥖", label: "Padaria",      singular: "Padaria" },
  { value: "cafeteria",    emoji: "☕", label: "Cafeteria",    singular: "Cafeteria" },
  { value: "pet",          emoji: "🐾", label: "Pet",          singular: "Pet" },
  { value: "conveniencia", emoji: "🏪", label: "Conveniência", singular: "Conveniência" },
  { value: "bebidas",      emoji: "🍺", label: "Bebidas",      singular: "Bebidas" },
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
