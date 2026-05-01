// src/pages/HomePage.jsx — Redesign iFood/Rappi style
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Search, ChevronRight, History,
  ChevronLeft, Star, Clock, Bike,
} from "lucide-react";
import RestaurantService, { supabase } from "../services/restaurantService";
import BannerService from "../services/bannerService";
import { RestaurantCard } from "../components/RestaurantCard";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Constants ─────────────────────────────────────────────────────────────

const FALLBACK_BANNERS = [
  {
    id: "fb1",
    title: "Fome de quê?",
    subtitle: "Peça agora e receba em minutos",
    gradient: "from-orange-500 via-orange-400 to-red-500",
    emoji: "🍔",
  },
  {
    id: "fb2",
    title: "Entrega Rápida",
    subtitle: "Os melhores sabores da sua cidade",
    gradient: "from-purple-600 via-purple-500 to-indigo-500",
    emoji: "🚀",
  },
  {
    id: "fb3",
    title: "Novidades do Dia",
    subtitle: "Descubra restaurantes que você vai amar",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    emoji: "✨",
  },
  {
    id: "fb4",
    title: "Peça com Facilidade",
    subtitle: "Mais de 50 restaurantes disponíveis",
    gradient: "from-blue-600 via-blue-500 to-sky-400",
    emoji: "🛵",
  },
];

const CATEGORY_OPTIONS = [
  { key: "Todos",      emoji: "🏠", label: "Todos",      bg: "bg-orange-100", text: "text-orange-700", activeBg: "bg-orange-500" },
  { key: "Pizza",      emoji: "🍕", label: "Pizza",      bg: "bg-red-100",    text: "text-red-700",    activeBg: "bg-red-500" },
  { key: "Hambúrguer", emoji: "🍔", label: "Hambúrguer", bg: "bg-yellow-100", text: "text-yellow-700", activeBg: "bg-yellow-500" },
  { key: "Hamburguer", emoji: "🍔", label: "Hambúrguer", bg: "bg-yellow-100", text: "text-yellow-700", activeBg: "bg-yellow-500" },
  { key: "Japonesa",   emoji: "🍣", label: "Japonesa",   bg: "bg-pink-100",   text: "text-pink-700",   activeBg: "bg-pink-500" },
  { key: "Sushi",      emoji: "🍣", label: "Sushi",      bg: "bg-pink-100",   text: "text-pink-700",   activeBg: "bg-pink-500" },
  { key: "Mexicana",   emoji: "🌮", label: "Mexicana",   bg: "bg-green-100",  text: "text-green-700",  activeBg: "bg-green-500" },
  { key: "Saudável",   emoji: "🥗", label: "Saudável",   bg: "bg-lime-100",   text: "text-lime-700",   activeBg: "bg-lime-500" },
  { key: "Sobremesa",  emoji: "🍰", label: "Sobremesa",  bg: "bg-purple-100", text: "text-purple-700", activeBg: "bg-purple-500" },
  { key: "Café",       emoji: "☕", label: "Café",       bg: "bg-amber-100",  text: "text-amber-700",  activeBg: "bg-amber-500" },
  { key: "Frango",     emoji: "🍗", label: "Frango",     bg: "bg-orange-100", text: "text-orange-700", activeBg: "bg-orange-500" },
  { key: "Lanches",    emoji: "🥪", label: "Lanches",    bg: "bg-teal-100",   text: "text-teal-700",   activeBg: "bg-teal-500" },
  { key: "Italiana",   emoji: "🍝", label: "Italiana",   bg: "bg-red-100",    text: "text-red-700",    activeBg: "bg-red-500" },
  { key: "Brasileira", emoji: "🍖", label: "Brasileira", bg: "bg-yellow-100", text: "text-yellow-700", activeBg: "bg-yellow-500" },
  { key: "Mercado",    emoji: "🛒", label: "Mercado",    bg: "bg-blue-100",   text: "text-blue-700",   activeBg: "bg-blue-500" },
];

const FAVORITES_KEY = "inksa.favorites";

function getFavoriteIds() {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")); }
  catch { return new Set(); }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  const resetTimer = useCallback((list) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % list.length);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    resetTimer(banners);
    return () => clearInterval(timerRef.current);
  }, [banners, resetTimer]);

  const go = useCallback((idx) => {
    setCurrent(idx);
    resetTimer(banners);
  }, [banners, resetTimer]);

  const prev = useCallback(() => go((current - 1 + banners.length) % banners.length), [current, banners.length, go]);
  const next = useCallback(() => go((current + 1) % banners.length), [current, banners.length, go]);

  if (!banners.length) return null;

  const slide = banners[current];
  const hasImage = Boolean(slide.image_url);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg select-none"
      style={{ aspectRatio: "16/6" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
        touchStartX.current = null;
      }}
    >
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        >
          {b.image_url ? (
            <img src={b.image_url} alt={b.title || ""} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${b.gradient || "from-orange-500 to-red-500"} flex items-center px-8 sm:px-12`}>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium mb-1 tracking-wide uppercase">Inksa Delivery</p>
                <h2 className="text-white text-2xl sm:text-3xl font-extrabold leading-tight mb-2 drop-shadow-sm">
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-white/90 text-sm sm:text-base font-medium">{b.subtitle}</p>
                )}
                {b.link_url && b.link_url !== "/" && (
                  <button className="mt-4 bg-white text-orange-600 font-bold text-sm px-5 py-2 rounded-full shadow hover:shadow-md transition-all">
                    Ver oferta →
                  </button>
                )}
              </div>
              {b.emoji && (
                <span className="text-6xl sm:text-8xl opacity-90 hidden sm:block animate-bounce" style={{ animationDuration: "3s" }}>
                  {b.emoji}
                </span>
              )}
            </div>
          )}
          {/* Dark gradient overlay on images */}
          {hasImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center px-8">
              <div>
                {b.title && <h2 className="text-white text-2xl sm:text-3xl font-extrabold drop-shadow-md mb-1">{b.title}</h2>}
                {b.subtitle && <p className="text-white/90 text-sm sm:text-base drop-shadow">{b.subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Nav arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-all backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPills({ apiCategories, selected, onSelect }) {
  // Merge predefined categories with API ones, deduplicate
  const seen = new Set();
  const allOptions = CATEGORY_OPTIONS.filter((c) => {
    if (seen.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });

  // Add any API categories not in our predefined list
  apiCategories.forEach((cat) => {
    if (!seen.has(cat)) {
      seen.add(cat);
      allOptions.push({ key: cat, emoji: "🍽️", label: cat, bg: "bg-gray-100", text: "text-gray-700", activeBg: "bg-gray-600" });
    }
  });

  // Only show categories that have restaurants
  const visible = allOptions.filter((c) => c.key === "Todos" || apiCategories.includes(c.key));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {visible.map((cat) => {
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 ${
              isActive ? "scale-105" : "hover:scale-105"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all duration-200 ${
              isActive ? `${cat.activeBg} shadow-md` : `${cat.bg}`
            }`}>
              {cat.emoji}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive ? "text-orange-600" : "text-gray-600"
            }`}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors shrink-0">
          {linkLabel || "Ver tudo"} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function FavoriteCard({ restaurant }) {
  const name = restaurant.restaurant_name || restaurant.name || "Restaurante";
  const initial = name[0]?.toUpperCase() || "R";
  const imageUrl = restaurant.logo_url;
  const rating = parseFloat(restaurant.rating ?? 0).toFixed(1);
  const time = restaurant.delivery_time;

  return (
    <Link
      to={`/restaurantes/${restaurant.id}`}
      className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 group"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-orange-100 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-2xl font-black text-orange-500">{initial}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating}
          </span>
          {time && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 group-hover:text-orange-400 transition-colors" />
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function HomePage() {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [apiCategories, setApiCategories] = useState([]);
  const [mounted, setMounted] = useState(false);

  const { location, loading: locationLoading, error: locationError } = useLocation();
  const { user } = useAuth();

  // Animate-in on mount
  useEffect(() => { setMounted(true); }, []);

  // Fetch banners
  useEffect(() => {
    BannerService.getBanners()
      .then((data) => setBanners(Array.isArray(data) && data.length ? data : FALLBACK_BANNERS))
      .catch(() => setBanners(FALLBACK_BANNERS));
  }, []);

  // Fetch restaurants
  useEffect(() => {
    if (!location && !locationError) return;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await RestaurantService.getAllRestaurants(location);
        const list = Array.isArray(data) ? data : data?.data || [];
        setAllRestaurants(list);
        const cats = [...new Set(list.map((r) => r.category).filter(Boolean))];
        setApiCategories(cats);
      } catch {
        /* keep empty */
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [location, locationError]);

  // Supabase realtime
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("restaurant-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "restaurant_profiles" }, (payload) => {
        setAllRestaurants((prev) => prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Filters
  const filteredRestaurants = allRestaurants.filter((r) => {
    const name = (r.restaurant_name || r.name || "").toLowerCase();
    const matchSearch = name.includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "Todos" || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Favorites
  const favoriteIds = getFavoriteIds();
  const favoriteRestaurants = allRestaurants.filter((r) => favoriteIds.has(r.id));

  // City from profile or fallback
  const city = user?.city || user?.address_city || "Lages, SC";

  const userFirstName = user?.first_name || user?.name || "Usuário";
  const userInitials = userFirstName[0]?.toUpperCase() || "U";

  return (
    <div
      className={`min-h-screen bg-gray-50 pb-10 transition-all duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── 1. Sticky Location + Search Bar ─────────────────────────── */}
      <div className="bg-white sticky top-[73px] z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Location */}
            <button className="flex items-center gap-1.5 shrink-0 group">
              <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="text-sm font-bold text-gray-900 max-w-[120px] truncate">{city}</span>
              <svg className="h-3 w-3 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar restaurantes ou pratos..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-orange-300 focus:ring-2 focus:ring-orange-100 rounded-xl outline-none transition-all placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Avatar */}
            <Link to="/perfil" className="shrink-0">
              <Avatar className="h-9 w-9 border-2 border-orange-200 ring-2 ring-orange-50 hover:ring-orange-200 transition-all">
                <AvatarImage src={user?.avatar_url} alt={userFirstName} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-400 text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ── 2. Hero Banner ──────────────────────────────────────────── */}
        <div
          className={`mt-5 transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <BannerCarousel banners={banners} />
        </div>

        {/* ── 3. Categories ───────────────────────────────────────────── */}
        <div
          className={`mt-7 transition-all duration-700 delay-150 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CategoryPills
            apiCategories={apiCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* ── 4. Restaurantes Próximos ────────────────────────────────── */}
        <div
          className={`mt-8 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <SectionHeader
            title="Restaurantes Próximos"
            subtitle={
              locationLoading
                ? "Obtendo sua localização..."
                : locationError
                ? "Exibindo todos os restaurantes disponíveis"
                : "Entrega em até 30 min"
            }
          />

          {isLoading || locationLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <RestaurantSkeleton key={i} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">🍽️</div>
              <p className="text-gray-700 font-semibold text-lg">Nenhum restaurante encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? `Sem resultados para "${searchTerm}"` : "Tente mudar a categoria ou localização."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Todos"); }}
                  className="mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Open restaurants first */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRestaurants
                  .slice()
                  .sort((a, b) => (b.is_open ? 1 : 0) - (a.is_open ? 1 : 0))
                  .map((restaurant, i) => (
                    <div
                      key={restaurant.id}
                      className="transition-all duration-500"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <RestaurantCard restaurant={restaurant} />
                    </div>
                  ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-6">
                {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? "s" : ""} encontrado{filteredRestaurants.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* ── 5. Favoritos ────────────────────────────────────────────── */}
        {!isLoading && favoriteRestaurants.length > 0 && (
          <div
            className={`mt-10 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <SectionHeader
              title="Seus Favoritos"
              subtitle="Restaurantes que você curtiu"
              linkTo="/"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteRestaurants.slice(0, 6).map((r) => (
                <FavoriteCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer hint ─────────────────────────────────────────────── */}
        {!isLoading && filteredRestaurants.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3 text-gray-300">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-medium">Inksa Delivery</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}
      </div>
    </div>
  );
}
