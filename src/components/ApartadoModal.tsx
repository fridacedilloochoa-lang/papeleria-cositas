import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  DollarSign, 
  User, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, ProductDesign, ProductColor } from '../types';

interface ApartadoModalProps {
  product: Product | null;
  selectedDesign?: ProductDesign;
  selectedColor?: ProductColor;
  selectedFormat?: string;
  quantity?: number;
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  whatsappNumber: string;
  onSubmitApartado: (data: {
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
  }) => Promise<void>;
}

export const ApartadoModal: React.FC<ApartadoModalProps> = ({
  product,
  selectedDesign,
  selectedColor,
  selectedFormat,
  quantity = 1,
  isOpen,
  onClose,
  currency,
  whatsappNumber,
  onSubmitApartado,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [initialAbono, setInitialAbono] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const unitPrice = product.price;
  const totalPrice = unitPrice * quantity;
  const saldoRestante = Math.max(0, totalPrice - initialAbono);

  const activeImage = selectedDesign?.imageUrl || (product.designs && product.designs[0]?.imageUrl) || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim()) {
      setErrorMessage('Por favor escribe tu nombre completo para identificar tu apartado.');
      return;
    }
    if (!clientNote.trim()) {
      setErrorMessage('Por favor agrega una breve nota o referencia (Ej. "Soy vecina de enfrente", "Mamá de la escuela", etc.).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitApartado({
        clientName: clientName.trim(),
        clientNote: clientNote.trim(),
        clientPhone: clientPhone.trim(),
        productId: product.id,
        productName: product.name,
        productImage: activeImage,
        selectedDesign: selectedDesign?.name,
        selectedColor: selectedColor?.name,
        selectedFormat: selectedFormat,
        quantity,
        unitPrice,
        totalPrice,
        initialAbono: Number(initialAbono) || 0,
        initialAbonoNote: initialAbono > 0 ? 'Anticipo al crear apartado' : undefined,
        decrementStock: true,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2dd4bf', '#14b8a6', '#5eead4', '#fbcfe8', '#fde047'],
        });
      } catch (err) {
        // Safe fallback
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Error al apartar:', err);
      setErrorMessage('Ocurrió un error al guardar el apartado. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn no-print">
      <div 
        id="apartado-modal"
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-teal-100 p-5 sm:p-7"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              ¡Apartado Registrado con Éxito!
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Tu producto ha quedado reservado a nombre de <strong className="text-teal-800">{clientName}</strong>. Te estamos redirigiendo a WhatsApp para confirmar los detalles con la dueña.
            </p>
            <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200 text-left text-xs text-teal-900 space-y-1 mb-6">
              <p><strong>Producto:</strong> {product.name}</p>
              {selectedDesign && <p><strong>Diseño:</strong> {selectedDesign.name}</p>}
              <p><strong>Total:</strong> {currency}{totalPrice.toFixed(2)}</p>
              {initialAbono > 0 ? (
                <p className="text-emerald-700 font-bold">
                  Anticipo: {currency}{initialAbono.toFixed(2)} | Restan: {currency}{saldoRestante.toFixed(2)}
                </p>
              ) : (
                <p className="text-amber-700 font-bold">
                  Saldo pendiente total: {currency}{totalPrice.toFixed(2)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-sm transition"
            >
              Cerrar y seguir viendo el catálogo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4 text-teal-900">
              <div className="p-2 rounded-2xl bg-teal-100 text-teal-700">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black">Apartar Producto</h3>
                <p className="text-xs text-teal-700">Reserva sin necesidad de registrarte</p>
              </div>
            </div>

            {/* Product Summary Mini Card */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 flex items-center gap-3.5 mb-5">
              {activeImage && (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-white shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                <div className="text-xs text-slate-600 space-y-0.5 mt-0.5">
                  {selectedDesign && (
                    <p className="truncate flex items-center gap-1">
                      <Layers className="w-3 h-3 text-teal-600" /> {selectedDesign.name}
                    </p>
                  )}
                  {selectedColor && <p>Color: {selectedColor.name}</p>}
                  {selectedFormat && <p>Formato: {selectedFormat}</p>}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Cant: {quantity}</span>
                  <span className="text-sm font-black text-teal-900">
                    {currency}{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              
              {/* Client Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  Tu Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="apartado-name-input"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Mariana González / Sra. Carmen"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Client Note / Reference */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                  ¿Cómo nos conocemos o referencia privada? <span className="text-rose-500">*</span>
                </label>
                <input
                  id="apartado-note-input"
                  type="text"
                  required
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Ej. Vecina de enfrente, Mamá de Sofi de la escuela, Amiga de..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Esta nota es privada y solo la verá la administradora para identificar tu apartado.
                </span>
              </div>

              {/* Client Phone (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  id="apartado-phone-input"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej. 55 1234 5678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Initial Abono / Anticipo */}
              <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-200">
                <label className="text-xs font-bold text-teal-950 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    ¿Con cuánto deseas apartar hoy? ($ Anticipo)
                  </span>
                  <span className="text-[11px] text-teal-700 font-normal">Opcional</span>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                    {currency}
                  </span>
                  <input
                    id="apartado-abono-input"
                    type="number"
                    min="0"
                    max={totalPrice}
                    step="5"
                    value={initialAbono || ''}
                    onChange={(e) => setInitialAbono(Math.min(totalPrice, Math.max(0, Number(e.target.value))))}
                    placeholder="0.00 (Puedes apartar con $0 o dar anticipo)"
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-teal-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                {/* Quick percentage buttons */}
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setInitialAbono(0)}
                    className="text-[11px] py-1 px-2.5 bg-white border border-teal-200 rounded-lg text-teal-800 hover:bg-teal-100 font-medium"
                  >
                    $0 (Sin anticipo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialAbono(Math.round(totalPrice * 0.3))}
                    className="text-[11px] py-1 px-2.5 bg-white border border-teal-200 rounded-lg text-teal-800 hover:bg-teal-100 font-medium"
                  >
                    30% ({currency}{Math.round(totalPrice * 0.3)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialAbono(Math.round(totalPrice * 0.5))}
                    className="text-[11px] py-1 px-2.5 bg-white border border-teal-200 rounded-lg text-teal-800 hover:bg-teal-100 font-medium"
                  >
                    50% ({currency}{Math.round(totalPrice * 0.5)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialAbono(totalPrice)}
                    className="text-[11px] py-1 px-2.5 bg-white border border-teal-200 rounded-lg text-teal-800 hover:bg-teal-100 font-medium"
                  >
                    100% (Liquidado)
                  </button>
                </div>

                {/* Balance summary */}
                <div className="mt-3 pt-2.5 border-t border-teal-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Restante que deberás:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {currency}{saldoRestante.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 px-3 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                id="submit-apartado-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Apartando...' : 'Confirmar Apartado'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
