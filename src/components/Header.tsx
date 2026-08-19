import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Heart, 
  ShoppingBag, 
  FileDown, 
  Shield, 
  LogOut, 
  X,
  MessageCircle,
  Store,
  Palette,
  Check
} from 'lucide-react';
import { StoreConfig, KawaiiTheme } from '../types';

interface HeaderProps {
  config: StoreConfig;
  currentTheme: KawaiiTheme;
  onSelectTheme: (theme: KawaiiTheme) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesCount: number;
  cartCount: number;
  onOpenCart: () => void;
  onOpenPdfModal: () => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminPanel?: () => void;
  onLogoutAdmin: () => void;
  showOnlyFavorites: boolean;
  onToggleFavoritesFilter: () => void;
  showOnlyNew: boolean;
  onToggleNewFilter: () => void;
  showOnlyOffers: boolean;
  onToggleOffersFilter: () => void;
  showOnlyInStock?: boolean;
  onToggleInStockFilter?: () => void;
  apartadosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentTheme,
  onSelectTheme,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  favoritesCount,
  cartCount,
  onOpenCart,
  onOpenPdfModal,
  isAdmin,
  onOpenAdminLogin,
  onOpenAdminPanel,
  onLogoutAdmin,
  showOnlyFavorites,
  onToggleFavoritesFilter,
  showOnlyNew,
  onToggleNewFilter,
  showOnlyOffers,
  onToggleOffersFilter,
  showOnlyInStock,
  onToggleInStockFilter,
  apartadosCount,
}) => {
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const cleanPhone = (config.whatsappNumber || '55 1779 1232').replace(/\D/g, '');
  const formattedWhatsappUrl = `https://wa.me/${cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone}`;

  // Color dynamics based on current theme - Solid pastels, unblended
  const announcementGradient = currentTheme === 'rosa'
    ? 'bg-rose-500'
    : currentTheme === 'tiffany'
    ? 'bg-teal-700'
    : 'bg-teal-700';

  const logoGradient = currentTheme === 'rosa'
    ? 'bg-rose-500 text-white shadow-rose-200'
    : currentTheme === 'tiffany'
    ? 'bg-teal-600 text-white shadow-teal-200'
    : 'bg-teal-600 text-white shadow-teal-200';

  const activeCategoryClass = currentTheme === 'rosa'
    ? 'bg-rose-500 text-white shadow-xs font-bold'
    : currentTheme === 'tiffany'
    ? 'bg-teal-600 text-white shadow-xs font-bold'
    : 'bg-teal-600 text-white shadow-xs font-bold';

  const primaryBtnClass = currentTheme === 'rosa'
    ? 'bg-rose-500 hover:bg-rose-600 text-white'
    : currentTheme === 'tiffany'
    ? 'bg-teal-600 hover:bg-teal-700 text-white'
    : 'bg-teal-600 hover:bg-teal-700 text-white';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-100/80 shadow-2xs no-print">
      
      {/* Top Announcement Banner with Kawaii Theme Gradient */}
      {config.announcementBanner && (
        <div className={`${announcementGradient} text-white text-xs sm:text-sm py-1.5 px-4 text-center font-bold shadow-inner flex items-center justify-center gap-2 transition-all duration-500`}>
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200 animate-pulse-soft" />
          <span className="truncate tracking-wide">{config.announcementBanner}</span>
          <span className="hidden md:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold">
            ✨ Tiffany & Rosa
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Store Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0">
            <div 
              onClick={() => onSelectCategory('Todas')}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${logoGradient} flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105`}
            >
              <span className="text-xl">🎀</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div>
                <h1 
                  onClick={() => onSelectCategory('Todas')}
                  className="text-lg sm:text-2xl font-serif font-black tracking-tight text-slate-900 hover:text-pink-600 transition leading-none select-none"
                >
                  {config.storeName || 'Papelería La Señora Cositas'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-teal-700">Tiffany</span>
                  <span className="text-[10px] text-pink-400 font-black">&bull;</span>
                  <span className="text-[11px] font-bold text-pink-600">Rosa Kawaii</span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">&bull; Apartados & Novedades</span>
                </div>
              </div>

              {/* Admin Pill Badge */}
              {isAdmin && (
                <button
                  id="header-admin-pill-badge"
                  onClick={onOpenAdminPanel || onOpenAdminLogin}
                  className="hidden sm:inline-flex items-center gap-1 bg-teal-50 text-teal-900 hover:bg-teal-100 font-bold text-[11px] px-3 py-1 rounded-full border border-teal-200 uppercase tracking-wide transition shadow-2xs cursor-pointer"
                  title="Abrir panel de administración"
                >
                  <Shield className="w-3.5 h-3.5 text-teal-700" />
                  <span>PANEL DUEÑA</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar - Desktop Pill */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-input-desktop"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar libretas, peluches, plumas..."
                className="w-full pl-9 pr-8 py-2 bg-pink-50/40 hover:bg-pink-50/80 focus:bg-white border border-pink-200/80 rounded-full text-xs sm:text-sm text-slate-800 placeholder-pink-400/80 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Theme Selector Dropdown / Switcher */}
            <div className="relative">
              <button
                id="theme-switcher-btn"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="px-2.5 sm:px-3 py-1.5 rounded-full border border-pink-200 bg-gradient-to-r from-teal-50 to-pink-50 hover:from-teal-100 hover:to-pink-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Cambiar paleta: Tiffany y Rosa"
              >
                <span className="text-sm">
                  {currentTheme === 'tiffany-rose' ? '🎀' : currentTheme === 'rosa' ? '🌸' : '💎'}
                </span>
                <span className="hidden lg:inline text-[11px]">
                  {currentTheme === 'tiffany-rose' ? 'Tiffany & Rosa' : currentTheme === 'rosa' ? 'Rosa Pastel' : 'Tiffany Menta'}
                </span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-pink-100 p-2 z-50 animate-fadeIn">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Elige tu Color Favorito
                  </div>
                  
                  {/* Option 1: Tiffany & Rosa */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTheme('tiffany-rose');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                      currentTheme === 'tiffany-rose'
                        ? 'bg-gradient-to-r from-teal-50 to-pink-50 text-slate-900 border border-pink-200 font-extrabold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🎀</span>
                      <span>Dúo Tiffany & Rosa</span>
                    </div>
                    {currentTheme === 'tiffany-rose' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  {/* Option 2: Rosa Pastel */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTheme('rosa');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                      currentTheme === 'rosa'
                        ? 'bg-pink-50 text-pink-900 border border-pink-200 font-extrabold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🌸</span>
                      <span>Rosa Pastel Bonita</span>
                    </div>
                    {currentTheme === 'rosa' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                  </button>

                  {/* Option 3: Tiffany Menta */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTheme('tiffany');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                      currentTheme === 'tiffany'
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 font-extrabold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>💎</span>
                      <span>Tiffany Menta</span>
                    </div>
                    {currentTheme === 'tiffany' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              id="mobile-search-btn"
              onClick={() => setShowSearchMobile(!showSearchMobile)}
              className="md:hidden p-2 text-pink-600 hover:bg-pink-50 rounded-full transition"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Heart / Favorites Icon Button */}
            <button
              id="header-favorites-btn"
              onClick={onToggleFavoritesFilter}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition flex items-center justify-center relative shadow-2xs cursor-pointer ${
                showOnlyFavorites 
                  ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white border-pink-500 shadow-sm scale-105' 
                  : 'bg-white hover:bg-pink-50 text-slate-700 border-pink-200 hover:border-pink-300'
              }`}
              title="Mis Favoritos"
            >
              <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-white text-white' : 'text-pink-500'}`} />
              {favoritesCount > 0 && (
                <span className={`absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full font-bold flex items-center justify-center ${
                  showOnlyFavorites ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'
                }`}>
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* WhatsApp Pill Button */}
            <a
              id="header-whatsapp-btn"
              href={formattedWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-teal-200 bg-white hover:bg-teal-50 text-slate-800 font-bold text-xs sm:text-sm transition shadow-2xs"
              title="Escribir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp</span>
            </a>

            {/* Catálogo PDF Pill Button */}
            <button
              id="header-pdf-btn"
              onClick={onOpenPdfModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-teal-200 bg-gradient-to-r from-teal-50 to-pink-50 hover:from-teal-100 hover:to-pink-100 text-slate-800 font-bold text-xs sm:text-sm transition shadow-2xs cursor-pointer"
              title="Descargar o imprimir catálogo en PDF"
            >
              <FileDown className="w-4 h-4 text-teal-600" />
              <span>Catálogo PDF</span>
            </button>

            {/* Cart Button */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${primaryBtnClass} flex items-center justify-center transition shadow-xs relative cursor-pointer active:scale-95`}
              title="Ver mi pedido / bolsa"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin / Logout Button */}
            {isAdmin ? (
              <button
                id="admin-logout-btn"
                onClick={onLogoutAdmin}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Cerrar sesión de Administradora"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="admin-login-btn"
                onClick={onOpenAdminLogin}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-pink-200 bg-white hover:bg-pink-50 text-pink-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Acceso Dueña / Administradora"
              >
                <Shield className="w-4 h-4 text-teal-700" />
              </button>
            )}

          </div>

        </div>

        {/* Mobile Search Bar Expansion */}
        {showSearchMobile && (
          <div className="mt-2.5 md:hidden">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-input-mobile"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar libretas, peluches, plumas..."
                className="w-full pl-9 pr-8 py-2 bg-pink-50/50 border border-pink-200 rounded-full text-xs text-slate-800 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pink-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Pills Navigation Row */}
        <div className="mt-3 pt-2.5 border-t border-pink-100 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* All Category Pill */}
            <button
              id="filter-all-btn"
              onClick={() => {
                if (showOnlyFavorites) onToggleFavoritesFilter();
                if (showOnlyNew) onToggleNewFilter();
                if (showOnlyOffers) onToggleOffersFilter();
                onSelectCategory('Todas');
              }}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                (activeCategory === 'Todas' || activeCategory === 'Todos') && !showOnlyFavorites && !showOnlyNew && !showOnlyOffers
                  ? activeCategoryClass
                  : 'bg-white text-slate-700 border border-pink-200/80 hover:bg-pink-50 hover:border-pink-300 font-semibold'
              }`}
            >
              🌸 Todas
            </button>

            {/* Dynamic Category List */}
            {config.categories.filter(c => c !== 'Todos' && c !== 'Todas').map((cat) => {
              const isActive = activeCategory === cat && !showOnlyFavorites && !showOnlyNew && !showOnlyOffers;
              const emoji = cat.toLowerCase().includes('peluche') || cat.toLowerCase().includes('juguete') 
                ? '🧸' 
                : cat.toLowerCase().includes('cuaderno') 
                ? '📓' 
                : cat.toLowerCase().includes('pluma') || cat.toLowerCase().includes('lápiz') 
                ? '🖊️' 
                : cat.toLowerCase().includes('plumon') 
                ? '🖍️' 
                : cat.toLowerCase().includes('washi') 
                ? '🎀' 
                : cat.toLowerCase().includes('bolsa') 
                ? '🛍️' 
                : cat.toLowerCase().includes('organizador') 
                ? '🗂️' 
                : '✨';

              return (
                <button
                  key={cat}
                  id={`category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    if (showOnlyFavorites) onToggleFavoritesFilter();
                    if (showOnlyNew) onToggleNewFilter();
                    if (showOnlyOffers) onToggleOffersFilter();
                    onSelectCategory(cat);
                  }}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? activeCategoryClass
                      : 'bg-white text-slate-700 border border-pink-200/80 hover:bg-pink-50 hover:border-pink-300 font-semibold'
                  }`}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter: Con existencias */}
          {onToggleInStockFilter && (
            <button
              id="filter-instock-btn"
              onClick={onToggleInStockFilter}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition ml-auto shrink-0 cursor-pointer ${
                showOnlyInStock
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-50 font-semibold'
              }`}
            >
              ✅ Con existencias
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
