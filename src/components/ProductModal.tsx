import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Bookmark, 
  ShoppingBag, 
  MessageCircle, 
  Layers, 
  Sparkles, 
  Check, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Share2,
  Maximize2,
  Download,
  Eye
} from 'lucide-react';
import { Product, ProductDesign, ProductColor } from '../types';

interface ProductModalProps {
  product: Product | null;
  initialDesign?: ProductDesign;
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  whatsappNumber: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenApartar: (product: Product, selectedDesign?: ProductDesign, selectedColor?: ProductColor, selectedFormat?: string, quantity?: number) => void;
  onAddToCart: (product: Product, selectedDesign?: ProductDesign, selectedColor?: ProductColor, selectedFormat?: string, quantity?: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  initialDesign,
  isOpen,
  onClose,
  currency,
  whatsappNumber,
  isFavorite,
  onToggleFavorite,
  onOpenApartar,
  onAddToCart,
}) => {
  const [selectedDesign, setSelectedDesign] = useState<ProductDesign | undefined>(
    initialDesign || (product?.designs && product.designs[0])
  );
  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(
    product?.colors && product.colors[0]
  );
  const [selectedFormat, setSelectedFormat] = useState<string | undefined>(
    product?.formats && product.formats[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (initialDesign) {
      setSelectedDesign(initialDesign);
    } else if (product.designs && product.designs.length > 0) {
      setSelectedDesign(product.designs[0]);
    }
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.formats && product.formats.length > 0) {
      setSelectedFormat(product.formats[0]);
    }
    setQuantity(1);
  }, [product, initialDesign]);

  if (!isOpen || !product) return null;

  const activeImage = selectedDesign?.imageUrl || (product.designs && product.designs[0]?.imageUrl) || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  const handleWhatsAppInquiry = () => {
    let text = `¡Hola! Me interesa este producto de su catálogo:\n\n` +
      `📌 *${product.name}*\n` +
      `💰 *Precio:* ${currency}${product.price}\n`;
    
    if (selectedDesign) text += `🎨 *Diseño:* ${selectedDesign.name}\n`;
    if (selectedColor) text += `🌈 *Color:* ${selectedColor.name}\n`;
    if (selectedFormat) text += `📐 *Formato:* ${selectedFormat}\n`;
    text += `🔢 *Cantidad:* ${quantity}\n\n` +
      `¿Tienen disponible para entrega/apartar? ¡Gracias!`;

    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = (url: string, designName?: string) => {
    const cleanName = `${product.name}-${designName || 'foto'}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanName}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn no-print">
        <div 
          id="product-detail-modal"
          className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-pink-100 flex flex-col md:flex-row max-h-[92vh]"
        >
          {/* Close Button */}
          <button
            id="close-product-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-xs transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Image & Gallery */}
          <div className="md:w-1/2 bg-slate-50 p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200 group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80';
                }}
              />

              {/* Action overlay on image: Zoom and Download */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                <button
                  onClick={() => setIsZoomOpen(true)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-teal-700 shadow-xs backdrop-blur-xs transition cursor-pointer"
                  title="Ver foto en tamaño completo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadImage(activeImage, selectedDesign?.name)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-pink-600 shadow-xs backdrop-blur-xs transition cursor-pointer"
                  title="Descargar esta imagen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Favorite button on image */}
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={`absolute top-3 left-3 p-2.5 rounded-full backdrop-blur-md transition shadow-xs z-20 cursor-pointer ${
                  isFavorite 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : ''}`} />
              </button>

              {/* Active design caption */}
              {selectedDesign && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center justify-between">
                  <span className="truncate flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-300" /> {selectedDesign.name}
                  </span>
                  <button 
                    onClick={() => setIsZoomOpen(true)}
                    className="text-[10px] text-pink-200 hover:text-white underline ml-2 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Ampliar
                  </button>
                </div>
              )}
            </div>

            {/* Multiple Designs Thumbnail Gallery */}
            {product.designs && product.designs.length > 1 && (
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-teal-600" /> Modelos disponibles ({product.designs.length}):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {product.designs.map((des) => (
                    <button
                      key={des.id}
                      onClick={() => setSelectedDesign(des)}
                      className={`relative rounded-xl overflow-hidden border-2 transition shrink-0 w-16 h-16 cursor-pointer ${
                        selectedDesign?.id === des.id 
                          ? 'border-teal-500 ring-2 ring-teal-200 scale-105 shadow-2xs' 
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={des.name}
                    >
                      <img src={des.imageUrl} alt={des.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {selectedDesign?.id === des.id && (
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info & Controls */}
          <div className="md:w-1/2 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  {product.category}
                </span>
                <div className="flex items-center gap-1">
                  {product.isNew && (
                    <span className="px-2.5 py-0.5 bg-pink-100 text-pink-800 font-bold text-xs rounded-full border border-pink-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-pink-600" /> Novedad
                    </span>
                  )}
                </div>
              </div>

              {/* Product Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {product.name}
              </h2>

              {/* Price & Stock */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {currency}{product.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {currency}{product.comparePrice!.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock pill */}
              <div className="mt-2">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5" /> Agotado actualmente
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> ¡Solo quedan {product.stock} piezas disponibles!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {product.stock} piezas en existencia
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Color Swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Color seleccionado: <span className="text-teal-800 font-semibold">{selectedColor?.name || 'Selecciona'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.id === color.id;
                      return (
                        <button
                          key={color.id || color.name}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition cursor-pointer ${
                            isSelected 
                              ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200 text-teal-900 font-bold' 
                              : 'border-slate-200 hover:border-teal-200 bg-white text-slate-700'
                          }`}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formats / Types */}
              {product.formats && product.formats.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Formato / Estilo: <span className="text-teal-800 font-semibold">{selectedFormat || 'Selecciona'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.formats.map((fmt) => {
                      const isSelected = selectedFormat === fmt;
                      return (
                        <button
                          key={fmt}
                          onClick={() => setSelectedFormat(fmt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            isSelected 
                              ? 'border-teal-500 bg-teal-600 text-white font-bold shadow-xs' 
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cantidad:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900 text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Action Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
              
              {/* Direct Apartar Button */}
              <button
                id="modal-apartar-action-btn"
                onClick={() => {
                  onOpenApartar(product, selectedDesign, selectedColor, selectedFormat, quantity);
                  onClose();
                }}
                disabled={isOutOfStock}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Apartar este Producto (Reserva con Anticipo)
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Add to Cart */}
                <button
                  id="modal-add-cart-btn"
                  onClick={() => {
                    onAddToCart(product, selectedDesign, selectedColor, selectedFormat, quantity);
                  }}
                  disabled={isOutOfStock}
                  className="py-2.5 px-3 rounded-2xl font-bold text-xs bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-pink-600" />
                  Añadir al Pedido
                </button>

                {/* WhatsApp Direct Inquiry */}
                <button
                  id="modal-whatsapp-btn"
                  onClick={handleWhatsAppInquiry}
                  className="py-2.5 px-3 rounded-2xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Pedir por WhatsApp
                </button>
              </div>

              {/* Share link button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleShare}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  {copied ? '¡Enlace copiado!' : 'Compartir este producto'}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Full-Screen Image Lightbox / Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between text-white mb-3 px-2">
              <div>
                <h4 className="font-bold text-base sm:text-lg">{product.name}</h4>
                {selectedDesign && (
                  <p className="text-xs text-teal-300 font-medium">Modelo: {selectedDesign.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadImage(activeImage, selectedDesign?.name)}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Foto
                </button>
                <button
                  onClick={() => setIsZoomOpen(false)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                  title="Cerrar imagen grande"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main High-Res Image Display */}
            <div className="max-h-[80vh] rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[78vh] w-auto object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Design selector in lightbox if multiple exist */}
            {product.designs && product.designs.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full p-2 bg-black/50 rounded-2xl border border-white/10">
                {product.designs.map((des) => (
                  <button
                    key={des.id}
                    onClick={() => setSelectedDesign(des)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      selectedDesign?.id === des.id ? 'border-teal-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={des.imageUrl} alt={des.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
