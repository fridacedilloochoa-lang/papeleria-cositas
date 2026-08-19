import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { ApartadoModal } from './components/ApartadoModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ProductFormModal } from './components/ProductFormModal';
import { AbonoModal } from './components/AbonoModal';
import { ApartadoFormModal } from './components/ApartadoFormModal';
import { PdfCatalogModal } from './components/PdfCatalogModal';

import { Product, ProductDesign, ProductColor, CartItem, Apartado, StoreConfig, ApartadoStatus, KawaiiTheme } from './types';
import { initialProducts, initialStoreConfig, initialApartados } from './data/initialData';
import { api } from './services/api';
import { 
  Sparkles, 
  Heart, 
  ShoppingBag, 
  Search, 
  Bookmark, 
  Layers, 
  ChevronRight,
  PackageSearch,
  Filter,
  FileDown,
  MessageCircle,
  Phone,
  Plus,
  Shield,
  ExternalLink,
  Star
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [apartados, setApartados] = useState<Apartado[]>(initialApartados);
  const [config, setConfig] = useState<StoreConfig>(initialStoreConfig);
  const [currentTheme, setCurrentTheme] = useState<KawaiiTheme>(() => {
    return (localStorage.getItem('kawaii_theme') as KawaiiTheme) || 'tiffany-rose';
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  // Modal Visibility States
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<{
    product: Product;
    initialDesign?: ProductDesign;
  } | null>(null);

  const [apartadoTarget, setApartadoTarget] = useState<{
    product: Product;
    design?: ProductDesign;
    color?: ProductColor;
    format?: string;
    quantity?: number;
  } | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [apartadoForAbono, setApartadoForAbono] = useState<Apartado | null>(null);
  const [isManualApartadoOpen, setIsManualApartadoOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Toast / Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await api.getStoreData();
        if (data.products && data.products.length > 0) setProducts(data.products);
        if (data.apartados) setApartados(data.apartados);
        if (data.config) setConfig(data.config);
      } catch (err) {
        console.error('Error fetching store data:', err);
      }
      setFavorites(api.getFavorites());
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Favorites toggle
  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      let updated: string[];
      if (prev.includes(productId)) {
        updated = prev.filter(id => id !== productId);
        showToast('Producto eliminado de tus favoritos');
      } else {
        updated = [...prev, productId];
        showToast('❤️ ¡Añadido a tus favoritos!');
      }
      api.saveFavorites(updated);
      return updated;
    });
  };

  // Cart operations
  const handleAddToCart = (
    product: Product, 
    selectedDesign?: ProductDesign, 
    selectedColor?: ProductColor, 
    selectedFormat?: string, 
    quantity: number = 1
  ) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id &&
        item.selectedDesign?.id === selectedDesign?.id &&
        item.selectedColor?.id === selectedColor?.id &&
        item.selectedFormat === selectedFormat
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          selectedDesign,
          selectedColor,
          selectedFormat,
          quantity,
        };
        return [...prev, newItem];
      }
    });

    showToast(`🛍️ Agregado "${product.name}" a tu lista de pedido`);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Products CRUD handlers
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.id) {
        // Edit
        const updated = await api.updateProduct(productData.id, productData);
        setProducts(prev => prev.map(p => p.id === productData.id ? updated : p));
        showToast('✅ Producto actualizado y guardado en línea');
      } else {
        // Add
        const created = await api.addProduct(productData);
        setProducts(prev => [created, ...prev]);
        showToast('🌟 Nuevo producto agregado y guardado en línea');
      }
    } catch (err) {
      console.error('Error guardando producto:', err);
      showToast('❌ No se pudo guardar el producto. Revisa tu conexión a Supabase.');
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('🗑️ Producto eliminado y guardado en línea');
    } catch (err) {
      console.error('Error eliminando producto:', err);
      showToast('❌ No se pudo eliminar el producto. Revisa tu conexión a Supabase.');
    }
  };

  const handleQuickStockChange = async (id: string, delta: number) => {
    const res = await api.updateStock(id, delta);
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, stock: res.stock };
      }
      return p;
    }));
  };

  // Apartados Handlers
  const handleSubmitApartado = async (apartadoData: {
    clientName: string;
    clientNote: string;
    clientPhone?: string;
    productId: string;
    productName: string;
    productImage?: string;
    selectedDesign?: string;
    selectedColor?: string;
    selectedFormat?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    initialAbono: number;
    initialAbonoNote?: string;
    decrementStock?: boolean;
  }) => {
    const created = await api.createApartado(apartadoData);
    setApartados(prev => [created, ...prev]);
    
    // Decrement local product stock if requested
    if (apartadoData.decrementStock && apartadoData.productId) {
      setProducts(prev => prev.map(p => {
        if (p.id === apartadoData.productId) {
          return { ...p, stock: Math.max(0, p.stock - (apartadoData.quantity || 1)) };
        }
        return p;
      }));
    }
  };

  const handleSaveAbono = async (apartadoId: string, amount: number, note?: string) => {
    const current = apartados.find(a => a.id === apartadoId);
    if (!current) {
      throw new Error('Apartado no encontrado');
    }
    const updated = await api.addAbono(current, amount, note);
    setApartados(prev => prev.map(a => a.id === apartadoId ? updated : a));
    showToast(`💵 Abono de ${config.currency}${amount} registrado con éxito`);
  };

  const handleUpdateApartadoStatus = async (id: string, status: ApartadoStatus) => {
    const updated = await api.updateApartado(id, { status });
    setApartados(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    showToast('Estado de apartado actualizado');
  };

  const handleDeleteApartado = async (id: string) => {
    try {
      await api.deleteApartado(id);
      setApartados(prev => prev.filter(a => a.id !== id));
      showToast('🗑️ Apartado eliminado y guardado en línea');
    } catch (err) {
      console.error('Error eliminando apartado:', err);
      showToast('❌ No se pudo eliminar el apartado. Revisa tu conexión a Supabase.');
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<StoreConfig>) => {
    const updated = await api.updateConfig(newConfig);
    setConfig(updated);
    if (newConfig.themePreference) {
      setCurrentTheme(newConfig.themePreference);
      localStorage.setItem('kawaii_theme', newConfig.themePreference);
    }
  };

  const handleSelectTheme = (theme: KawaiiTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('kawaii_theme', theme);
    api.updateConfig({ themePreference: theme });
    showToast(`🎀 Paleta cambiada: ${theme === 'tiffany-rose' ? 'Dúo Tiffany & Rosa' : theme === 'rosa' ? 'Rosa Pastel' : 'Tiffany Menta'}`);
  };

  const handleResetToDefaults = async () => {
    await api.resetData();
    setProducts(initialProducts);
    setApartados(initialApartados);
    setConfig(initialStoreConfig);
    showToast('Datos de ejemplo restablecidos');
  };

  // Filtered Products for Customer Catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.designs?.some(d => d.name.toLowerCase().includes(q)) ||
        p.colors?.some(c => c.name.toLowerCase().includes(q));

      // Category
      const matchesCategory = activeCategory === 'Todas' || activeCategory === 'Todos' || p.category === activeCategory;

      // Special Filters
      const matchesFavorites = !showOnlyFavorites || favorites.includes(p.id);
      const matchesNew = !showOnlyNew || !!p.isNew;
      const matchesOffers = !showOnlyOffers || (!!p.comparePrice && p.comparePrice > p.price);
      const matchesInStock = !showOnlyInStock || p.stock > 0;

      return matchesSearch && matchesCategory && matchesFavorites && matchesNew && matchesOffers && matchesInStock;
    });
  }, [products, searchQuery, activeCategory, showOnlyFavorites, showOnlyNew, showOnlyOffers, showOnlyInStock, favorites]);

  const activeApartadosCount = apartados.filter(a => a.status === 'apartado' || a.status === 'pagado_parcial').length;
  const cleanPhone = (config.whatsappNumber || '55 1779 1232').replace(/\D/g, '');
  const formattedWhatsappUrl = `https://wa.me/${cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone}`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      currentTheme === 'rosa' 
        ? 'bg-[#fff5f8] text-slate-900 selection:bg-pink-200 selection:text-pink-900'
        : currentTheme === 'tiffany'
        ? 'bg-[#f0fdfa] text-slate-900 selection:bg-teal-200 selection:text-teal-900'
        : 'bg-gradient-to-b from-[#fff5f8] via-[#f0fdfa]/50 to-[#fff8fb] text-slate-900 selection:bg-pink-200 selection:text-teal-950'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl shadow-xl animate-slideUp flex items-center gap-2.5 ${
          currentTheme === 'rosa' 
            ? 'bg-gradient-to-r from-pink-600 to-rose-500 border border-pink-400'
            : currentTheme === 'tiffany'
            ? 'bg-gradient-to-r from-teal-700 to-teal-600 border border-teal-500'
            : 'bg-gradient-to-r from-teal-700 via-teal-600 to-pink-600 border border-pink-300'
        }`}>
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        config={config}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setShowOnlyFavorites(false);
          setShowOnlyNew(false);
          setShowOnlyOffers(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        isAdmin={isAdminLoggedIn}
        onOpenAdminLogin={() => {
          if (isAdminLoggedIn) {
            setIsAdminPanelOpen(true);
          } else {
            setIsAdminLoginModalOpen(true);
          }
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onLogoutAdmin={() => {
          setIsAdminLoggedIn(false);
          setIsAdminPanelOpen(false);
          showToast('Sesión de administradora cerrada');
        }}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesFilter={() => {
          setShowOnlyFavorites(!showOnlyFavorites);
          if (!showOnlyFavorites) {
            setShowOnlyNew(false);
            setShowOnlyOffers(false);
            setActiveCategory('Todas');
          }
        }}
        showOnlyNew={showOnlyNew}
        onToggleNewFilter={() => {
          setShowOnlyNew(!showOnlyNew);
          if (!showOnlyNew) {
            setShowOnlyFavorites(false);
            setShowOnlyOffers(false);
          }
        }}
        showOnlyOffers={showOnlyOffers}
        onToggleOffersFilter={() => {
          setShowOnlyOffers(!showOnlyOffers);
          if (!showOnlyOffers) {
            setShowOnlyFavorites(false);
            setShowOnlyNew(false);
          }
        }}
        showOnlyInStock={showOnlyInStock}
        onToggleInStockFilter={() => setShowOnlyInStock(!showOnlyInStock)}
        apartadosCount={activeApartadosCount}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Admin Subheader Bar */}
      {isAdminLoggedIn && (
        <section className={`border-b px-4 sm:px-6 lg:px-8 py-3.5 no-print shadow-2xs transition-colors ${
          currentTheme === 'rosa'
            ? 'bg-pink-50 border-pink-200'
            : currentTheme === 'tiffany'
            ? 'bg-teal-50 border-teal-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Left Title & Description */}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0 ${
                currentTheme === 'rosa' ? 'bg-pink-600' : 'bg-teal-700'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-xl sm:text-2xl font-serif font-black tracking-tight leading-none ${
                    currentTheme === 'rosa' ? 'text-pink-950' : 'text-teal-950'
                  }`}>
                    Panel de Administración
                  </h2>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wide ${
                    currentTheme === 'rosa' 
                      ? 'bg-pink-100 text-pink-800 border-pink-300' 
                      : currentTheme === 'tiffany'
                      ? 'bg-teal-100 text-teal-800 border-teal-200'
                      : 'bg-teal-50 text-teal-900 border-teal-200'
                  }`}>
                    MODO DUEÑA 🎀
                  </span>
                </div>
                <p className={`text-xs font-medium mt-0.5 ${
                  currentTheme === 'rosa' ? 'text-pink-800' : 'text-teal-800'
                }`}>
                  Control de costos iniciales, precios de venta, ganancias netas, catálogo en vivo y apartados.
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={formattedWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3.5 sm:px-4 py-2 rounded-full font-bold text-xs border flex items-center gap-1.5 transition shadow-2xs ${
                  currentTheme === 'rosa'
                    ? 'bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-200'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {config.whatsappNumber || '55 1779 1232'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>

              <a
                href={`tel:${cleanPhone}`}
                className="px-3.5 sm:px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-slate-700" />
                <span>Llamar: {config.whatsappNumber || '55 1779 1232'}</span>
              </a>

              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsProductFormOpen(true);
                }}
                className={`px-4 py-2 rounded-full text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                  currentTheme === 'rosa'
                    ? 'bg-pink-600 hover:bg-pink-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>

              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className={`px-4 py-2 rounded-full bg-white font-bold text-xs border flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                  currentTheme === 'rosa'
                    ? 'hover:bg-pink-50 text-pink-900 border-pink-200'
                    : 'hover:bg-teal-50 text-teal-900 border-teal-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentTheme === 'rosa' ? 'text-pink-600' : 'text-teal-600'}`} />
                <span>Ver Catálogo / Apartados</span>
              </button>
            </div>

          </div>
        </section>
      )}

      {/* Main Catalog View Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
        
        {/* Hero Card Banner (Tiffany & Rosa Kawaii Theme) */}
        <div className={`border rounded-3xl p-6 sm:p-10 relative overflow-hidden mb-8 shadow-xs transition-all ${
          currentTheme === 'rosa'
            ? 'bg-pink-50/80 border-pink-200'
            : currentTheme === 'tiffany'
            ? 'bg-teal-50/80 border-teal-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Decorative Dot Grid on right half */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none" 
            style={{ 
              backgroundImage: currentTheme === 'rosa' 
                ? 'radial-gradient(circle, #db2777 1.5px, transparent 1.5px)' 
                : 'radial-gradient(circle, #0d9488 1.5px, transparent 1.5px)', 
              backgroundSize: '20px 20px' 
            }} 
          />

          <div className="relative z-10 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-teal-900 font-bold text-xs mb-3.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="font-semibold text-slate-800">
                Catálogo en línea • Disponibilidad en tiempo real ✨
              </span>
            </div>

            {/* Large Serif Title */}
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight mb-2.5 leading-tight ${
              currentTheme === 'rosa' 
                ? 'text-pink-950' 
                : currentTheme === 'tiffany' 
                ? 'text-teal-950' 
                : 'text-slate-900'
            }`}>
              {config.storeName || 'Papelería La Señora Cositas'}
            </h2>

            {/* Subtitle */}
            <p className={`text-sm sm:text-base mb-6 font-medium leading-relaxed max-w-xl ${
              currentTheme === 'rosa' ? 'text-pink-900' : 'text-teal-950'
            }`}>
              {config.tagline || 'Papelería bonita, novedades, arte y cositas especiales para inspirar tu día'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className={`px-5 py-3 rounded-full text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95 ${
                  currentTheme === 'rosa'
                    ? 'bg-pink-600 hover:bg-pink-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Catálogo PDF</span>
              </button>

              <a
                href={formattedWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-3 rounded-full text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition active:scale-95 ${
                  currentTheme === 'rosa'
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Escribir por WhatsApp ({config.whatsappNumber || '55 1779 1232'})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Section Heading & Active Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <h3 className={`text-xl sm:text-2xl font-serif font-black tracking-tight ${
              currentTheme === 'rosa' ? 'text-pink-950' : 'text-[#134e4a]'
            }`}>
              {showOnlyFavorites 
                ? '❤️ Mis Artículos Favoritos' 
                : showOnlyNew 
                ? '🌟 Nuevas Llegadas y Novedades' 
                : showOnlyOffers 
                ? '🏷️ Ofertas y Descuentos' 
                : activeCategory === 'Todas' || activeCategory === 'Todos'
                ? 'Catálogo de Productos' 
                : activeCategory}
            </h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              currentTheme === 'rosa'
                ? 'bg-pink-100 text-pink-800 border-pink-200'
                : 'bg-[#ccfbf1] text-[#0f766e] border-teal-200'
            }`}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {/* If filtering, show clear button */}
          {(showOnlyFavorites || showOnlyNew || showOnlyOffers || showOnlyInStock || (activeCategory !== 'Todas' && activeCategory !== 'Todos') || searchQuery) && (
            <button
              onClick={() => {
                setShowOnlyFavorites(false);
                setShowOnlyNew(false);
                setShowOnlyOffers(false);
                setShowOnlyInStock(false);
                setActiveCategory('Todas');
                setSearchQuery('');
              }}
              className={`text-xs font-bold underline cursor-pointer ${
                currentTheme === 'rosa' ? 'text-pink-600 hover:text-pink-700' : 'text-[#0d9488] hover:text-[#0f766e]'
              }`}
            >
              Ver todos los productos
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-teal-100 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 text-teal-500">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No se encontraron artículos
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {showOnlyFavorites
                ? 'Aún no has agregado productos a tus favoritos. Haz clic en el corazón de cualquier artículo para guardarlo aquí.'
                : 'Intenta con otra palabra clave o selecciona otra categoría en la parte superior.'}
            </p>
            <button
              onClick={() => {
                setShowOnlyFavorites(false);
                setShowOnlyNew(false);
                setShowOnlyOffers(false);
                setShowOnlyInStock(false);
                setActiveCategory('Todas');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Ver todo el Catálogo
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={config.currency}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={(prod, design) => {
                  setSelectedProductForDetail({ product: prod, initialDesign: design });
                }}
                onOpenApartar={(prod, design) => {
                  setApartadoTarget({ product: prod, design });
                }}
                onAddToCart={(prod, design) => {
                  handleAddToCart(prod, design);
                }}
                isAdmin={isAdminLoggedIn}
                onEditProduct={(prod) => {
                  setProductToEdit(prod);
                  setIsProductFormOpen(true);
                }}
                onQuickStockChange={handleQuickStockChange}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-teal-100 bg-white py-8 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-bold text-teal-900 text-sm">
            {config.storeName}
          </p>
          <p className="text-slate-500">
            {config.tagline} &bull; Catálogo en línea con sistema de apartados y pagos a plazos
          </p>
          <p className="text-[11px] text-teal-700 font-semibold pt-1">
            Pedidos y dudas por WhatsApp: {config.whatsappNumber}
          </p>
        </div>
      </footer>

      {/* ---------------- MODALS ---------------- */}

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProductForDetail?.product || null}
        initialDesign={selectedProductForDetail?.initialDesign}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        currency={config.currency}
        whatsappNumber={config.whatsappNumber}
        isFavorite={selectedProductForDetail ? favorites.includes(selectedProductForDetail.product.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenApartar={(product, design, color, format, quantity) => {
          setApartadoTarget({ product, design, color, format, quantity });
        }}
        onAddToCart={(product, design, color, format, quantity) => {
          handleAddToCart(product, design, color, format, quantity);
        }}
      />

      {/* Client Apartado Modal */}
      <ApartadoModal
        product={apartadoTarget?.product || null}
        selectedDesign={apartadoTarget?.design}
        selectedColor={apartadoTarget?.color}
        selectedFormat={apartadoTarget?.format}
        quantity={apartadoTarget?.quantity || 1}
        isOpen={!!apartadoTarget}
        onClose={() => setApartadoTarget(null)}
        currency={config.currency}
        whatsappNumber={config.whatsappNumber}
        onSubmitApartado={handleSubmitApartado}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currency={config.currency}
        whatsappNumber={config.whatsappNumber}
        onApartarEntireCart={() => {
          if (cart.length > 0) {
            const first = cart[0];
            setApartadoTarget({
              product: first.product,
              design: first.selectedDesign,
              color: first.selectedColor,
              format: first.selectedFormat,
              quantity: first.quantity,
            });
            setIsCartOpen(false);
          }
        }}
      />

      {/* Admin Login PIN Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        adminPin={config.adminPin}
        onSuccessLogin={() => {
          setIsAdminLoggedIn(true);
          setIsAdminPanelOpen(true);
          showToast('🔐 Bienvenida al Panel de Administración');
        }}
      />

      {/* Admin Panel Dashboard Modal */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        products={products}
        apartados={apartados}
        config={config}
        currency={config.currency}
        onOpenNewProductModal={() => {
          setProductToEdit(null);
          setIsProductFormOpen(true);
        }}
        onOpenEditProductModal={(prod) => {
          setProductToEdit(prod);
          setIsProductFormOpen(true);
        }}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onQuickStockChange={handleQuickStockChange}
        onOpenAbonoModal={(apt) => {
          setApartadoForAbono(apt);
          setIsAbonoModalOpen(true);
        }}
        onOpenManualApartadoModal={() => setIsManualApartadoOpen(true)}
        onUpdateApartadoStatus={handleUpdateApartadoStatus}
        onDeleteApartado={handleDeleteApartado}
        onUpdateConfig={handleUpdateConfig}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        productToEdit={productToEdit}
        categories={config.categories}
        onSaveProduct={handleSaveProduct}
        currency={config.currency}
      />

      {/* Abono Payment Registration Modal */}
      <AbonoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        apartado={apartadoForAbono}
        currency={config.currency}
        onSaveAbono={handleSaveAbono}
        whatsappNumber={config.whatsappNumber}
      />

      {/* Manual Apartado Modal for In-Person / Phone Orders */}
      <ApartadoFormModal
        isOpen={isManualApartadoOpen}
        onClose={() => setIsManualApartadoOpen(false)}
        products={products}
        currency={config.currency}
        onSaveManualApartado={handleSubmitApartado}
      />

      {/* PDF / Printable Catalog Modal */}
      <PdfCatalogModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        products={products}
        config={config}
        currency={config.currency}
        isAdmin={isAdminLoggedIn}
      />

    </div>
  );
}
