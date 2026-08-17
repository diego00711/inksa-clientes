// Estilo do mapa, em um lugar só.
//
// O estilo padrão do OpenStreetMap é a cara de 2010 — fundo bege, rótulo em
// cima de rótulo. Trocar por um moderno é definir VITE_MAP_TILE_URL; nenhum
// componente muda.
//
// O padrão continua o OSM de propósito: não existe basemap moderno gratuito
// para uso comercial (os da CARTO são "exclusively with an Enterprise
// license"; o grátis do Stadia/MapTiler é só desenvolvimento e avaliação).
// Deixar um default bonito e sem licença seria empurrar o problema para o dia
// do lançamento.
//
// Para ligar o moderno, no Vercel:
//   VITE_MAP_TILE_URL = https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=SUA_CHAVE
//   VITE_MAP_ATTRIBUTION = &copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
//
// ⚠️ Variável VITE_ é lida na HORA DO BUILD, não em tempo de execução: salvar
// no painel não basta, tem que refazer o deploy.
export const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// O crédito é exigido pela licença — do OSM hoje, do Stadia depois. Não é
// enfeite que dá pra esconder quando incomoda o layout.
export const TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
