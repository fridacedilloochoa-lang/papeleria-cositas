import React from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  Bookmark, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currency: string;
  whatsappNumber: string;
  onApartarEntireCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currency,
  whatsappNumber,
  onApartarEntireCart,
}) => {
  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    let text = `🌸 *¡Hola! Me gustaría hacer un pedido del catálogo online:*\n\n`;
    items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.product.name}* (x${item.quantity})\n`;
      if (item.selectedDesign) text += `   🎨 Diseño: ${item.selectedDesign.name}\n`;
      if (item.selectedColor) text += `   🌈 Color: ${item.selectedColor.name}\n`;
      if (item.selectedFormat) text += `   📐 Formato: ${item.selectedFormat}\n`;
      text += `   💰 Subtotal: ${currency}${(item.product.price * item.quantity).toFixed(2)}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Total de artículos:* ${totalCount}\n` +
      `💵 *TOTAL DEL PEDIDO:* ${currency}${total.toFixed(2)}\n\n` +
      `¿Me confirmas la disponibilidad y forma de entrega? ¡Muchas gracias!`;

    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn no-print">
      <div 
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-teal-100 flex items-center justify-between bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500 text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Mi Lista de Pedido
              </h3>
              <p className="text-xs text-teal-700 font-medium">
                {totalCount} {totalCount === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-teal-100/70 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-3 text-teal-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">
                Tu lista está vacía
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                Explora el catálogo y agrega tus productos favoritos para hacer tu pedido o apartarlos.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            items.map((item) => {
              const image = item.selectedDesign?.imageUrl || (item.product.designs && item.product.designs[0]?.imageUrl) || '';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex gap-3 items-start"
                >
                  <img
                    src={image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Variant details */}
                    <div className="text-[11px] text-slate-500 space-y-0.5 my-1">
                      {item.selectedDesign && (
                        <p className="truncate flex items-center gap-1 text-teal-800">
                          <Layers className="w-3 h-3 text-teal-600" /> {item.selectedDesign.name}
                        </p>
                      )}
                      {item.selectedColor && <p>Color: {item.selectedColor.name}</p>}
                      {item.selectedFormat && <p>Formato: {item.selectedFormat}</p>}
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {currency}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-white text-slate-700 hover:bg-teal-50 flex items-center justify-center font-bold text-xs shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-6 h-6 rounded-md bg-white text-slate-700 hover:bg-teal-50 flex items-center justify-center font-bold text-xs shadow-2xs disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-teal-100 bg-teal-50/30 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-600 font-medium">Total Estimado:</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {currency}{total.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <button
                id="cart-whatsapp-submit-btn"
                onClick={handleWhatsAppOrder}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Pedido Completo por WhatsApp
              </button>

              <button
                onClick={onApartarEntireCart}
                className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-4 h-4 text-teal-600" />
                Apartar estos productos
              </button>
            </div>

            <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
              <button
                onClick={onClearCart}
                className="hover:text-rose-600 transition"
              >
                Vaciar lista
              </button>
              <span>Precios sujetos a existencias</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
