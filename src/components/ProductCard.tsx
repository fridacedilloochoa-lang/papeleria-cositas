import React, { useState } from 'react';
import { 
  Heart, 
  Bookmark, 
  ShoppingBag, 
  Layers, 
  Edit3, 
  Plus, 
  Minus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star
} from 'lucide-react';
import { Product, ProductDesign } from '../types';

interface ProductCardProps {
  product: Product;
  currency: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (product: Product, initialDesign?: ProductDesign) => void;
  onOpenApartar: (product: Product, initialDesign?: ProductDesign) => void;
  onAddToCart: (product: Product, design?: ProductDesign) => void;
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  onQuickStockChange?: (id: string, delta: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
  onOpenApartar,
  onAddToCart,
  isAdmin,
  onEditProduct,
  onQuickStockChange,
}) => {
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);

  const activeDesign = product.designs && product.designs.length > 0 
    ? product.designs[activeDesignIndex] 
    : undefined;

  const imageUrl = activeDesign?.imageUrl || (product.designs && product.designs[0]?.imageUrl) || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80';
  
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative bg-white rounded-3xl border border-pink-100 hover:border-teal-300 shadow-xs hover:shadow-lg hover:shadow-pink-100/60 transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1"
    >
      {/* Top Image Container */}
      <div 
        className="relative aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer" 
        onClick={() => onOpenDetail(product, activeDesign)}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Graceful fallback image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Cute Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isNew && (
            <span className="px-2.5 py-1 bg-pink-500 text-white font-black text-[11px] rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-100" /> Novedad
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-1 bg-teal-600 text-white font-black text-[11px] rounded-full shadow-xs flex items-center gap-1">
              <Star className="w-3 h-3 text-teal-100 fill-teal-100" /> -{discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          id={`fav-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 z-20 shadow-xs cursor-pointer ${
            isFavorite 
              ? 'bg-rose-500 text-white scale-110 shadow-rose-300/80 shadow-md' 
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 hover:scale-110'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : ''}`} />
        </button>

        {/* Design Name Tag if multiple designs exist */}
        {product.designs && product.designs.length > 1 && activeDesign && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center justify-between pointer-events-none">
            <span className="truncate flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-300" /> {activeDesign.name}
            </span>
            <span className="text-[10px] text-pink-300 font-bold shrink-0">
              {activeDesignIndex + 1}/{product.designs.length}
            </span>
          </div>
        )}
      </div>

      {/* Design Switcher Thumbnails on Card */}
      {product.designs && product.designs.length > 1 && (
        <div className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {product.designs.map((des, idx) => (
            <button
              key={des.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDesignIndex(idx);
              }}
              className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                activeDesignIndex === idx 
                  ? 'border-pink-500 ring-2 ring-pink-200 scale-105 shadow-2xs' 
                  : 'border-slate-200 opacity-60 hover:opacity-100'
              }`}
              title={des.name}
            >
              <img src={des.imageUrl} alt={des.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Color indicators */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md">
              {product.category}
            </span>
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center -space-x-1" title={`${product.colors.length} colores disponibles`}>
                {product.colors.slice(0, 4).map((c) => (
                  <span
                    key={c.id || c.name}
                    className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[9px] text-pink-500 pl-1 font-bold">+{product.colors.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onOpenDetail(product, activeDesign)}
            className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 hover:text-pink-600 transition cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* Stock Badge */}
          <div className="mt-2 flex items-center gap-1.5">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3 h-3" /> Agotado
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> ¡Últimas {product.stock} pzas!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <CheckCircle2 className="w-3 h-3 text-teal-600" /> {product.stock} disponibles
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-pink-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {currency}{product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-pink-400 line-through font-semibold">
                {currency}{product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Customer Action Buttons - Tiffany & Rosa Duo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id={`apartar-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenApartar(product, activeDesign);
              }}
              disabled={isOutOfStock}
              className={`py-2 px-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                isOutOfStock 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 shadow-2xs hover:border-pink-300 cursor-pointer active:scale-95'
              }`}
              title="Aparta este producto con anticipo"
            >
              <Bookmark className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span>Apartar</span>
            </button>

            <button
              id={`add-cart-card-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, activeDesign);
              }}
              disabled={isOutOfStock}
              className={`py-2 px-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95'
              }`}
              title="Añadir directo a tu lista de pedido"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Admin Controls (Only when logged in as admin) */}
          {isAdmin && (
            <div className="mt-3 pt-2 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-3xl flex items-center justify-between">
              <button
                id={`admin-edit-btn-${product.id}`}
                onClick={() => onEditProduct && onEditProduct(product)}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-teal-200 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-teal-600" /> Editar
              </button>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px] font-semibold mr-1">Stock:</span>
                <button
                  onClick={() => onQuickStockChange && onQuickStockChange(product.id, -1)}
                  className="w-6 h-6 rounded-lg bg-white border border-pink-200 text-slate-700 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                  title="Restar 1 pieza"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-slate-800 w-6 text-center text-xs">
                  {product.stock}
                </span>
                <button
                  onClick={() => onQuickStockChange && onQuickStockChange(product.id, 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-teal-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                  title="Sumar 1 pieza"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
