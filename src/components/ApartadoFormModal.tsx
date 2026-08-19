import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  User, 
  MessageSquare, 
  Phone, 
  Package, 
  DollarSign, 
  Check,
  Layers
} from 'lucide-react';
import { Product, Apartado } from '../types';

interface ApartadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: string;
  onSaveManualApartado: (data: {
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

export const ApartadoFormModal: React.FC<ApartadoFormModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  onSaveManualApartado,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [clientName, setClientName] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedDesignName, setSelectedDesignName] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');
  const [selectedFormatName, setSelectedFormatName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [initialAbono, setInitialAbono] = useState<number | ''>('');
  const [abonoNote, setAbonoNote] = useState('Anticipo inicial');
  const [decrementStock, setDecrementStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const unitPrice = customPrice !== '' ? Number(customPrice) : (selectedProduct?.price || 0);
  const totalPrice = unitPrice * quantity;
  const numericAbono = Number(initialAbono) || 0;
  const saldoPendiente = Math.max(0, totalPrice - numericAbono);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim()) {
      setErrorMessage('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (!selectedProduct) {
      setErrorMessage('Por favor selecciona un producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeDesign = selectedProduct.designs?.find(d => d.name === selectedDesignName) || selectedProduct.designs?.[0];

      await onSaveManualApartado({
        clientName: clientName.trim(),
        clientNote: clientNote.trim() || 'Apartado registrado por administradora',
        clientPhone: clientPhone.trim(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: activeDesign?.imageUrl || '',
        selectedDesign: selectedDesignName || activeDesign?.name,
        selectedColor: selectedColorName || selectedProduct.colors?.[0]?.name,
        selectedFormat: selectedFormatName || selectedProduct.formats?.[0],
        quantity,
        unitPrice,
        totalPrice,
        initialAbono: numericAbono,
        initialAbonoNote: abonoNote,
        decrementStock,
      });
      onClose();
    } catch (err) {
      console.error('Error creating apartado:', err);
      setErrorMessage('Ocurrió un error al registrar el apartado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn no-print">
      <div 
        id="manual-apartado-modal"
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-teal-100 p-5 sm:p-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-teal-100 text-teal-700">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Registrar Apartado Manual
              </h3>
              <p className="text-xs text-teal-700">Para clientes presenciales o pedidos por llamada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1">
          
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nombre del Cliente <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Sra. Lupita / Maestra Irma"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Referencia privada / ¿De dónde la conoces?
              </label>
              <input
                type="text"
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder="Ej. Vecina calle 5 / Escuela"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Seleccionar Producto <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find(p => p.id === e.target.value);
                if (prod) {
                  setSelectedDesignName(prod.designs?.[0]?.name || '');
                  setSelectedColorName(prod.colors?.[0]?.name || '');
                  setSelectedFormatName(prod.formats?.[0] || '');
                }
              }}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {currency}{p.price} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          {/* Variant Selectors if any */}
          {selectedProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-teal-50/50 p-3 rounded-2xl border border-teal-200 text-xs">
              
              {/* Designs */}
              {selectedProduct.designs && selectedProduct.designs.length > 0 && (
                <div>
                  <label className="font-bold text-teal-900 block mb-1">Diseño:</label>
                  <select
                    value={selectedDesignName}
                    onChange={(e) => setSelectedDesignName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-teal-200 rounded-lg text-xs"
                  >
                    {selectedProduct.designs.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Colors */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div>
                  <label className="font-bold text-teal-900 block mb-1">Color:</label>
                  <select
                    value={selectedColorName}
                    onChange={(e) => setSelectedColorName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-teal-200 rounded-lg text-xs"
                  >
                    {selectedProduct.colors.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Format */}
              {selectedProduct.formats && selectedProduct.formats.length > 0 && (
                <div>
                  <label className="font-bold text-teal-900 block mb-1">Formato:</label>
                  <select
                    value={selectedFormatName}
                    onChange={(e) => setSelectedFormatName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-teal-200 rounded-lg text-xs"
                  >
                    {selectedProduct.formats.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          )}

          {/* Pricing and Downpayment */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Precio Unitario ({currency})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={customPrice !== '' ? customPrice : (selectedProduct?.price || '')}
                onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Total Apartado
              </label>
              <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl text-sm font-black text-teal-900 text-center">
                {currency}{totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Abono Inicial */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Anticipo / Abono Inicial ({currency})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={totalPrice}
                  value={initialAbono}
                  onChange={(e) => setInitialAbono(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-teal-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nota del abono
                </label>
                <input
                  type="text"
                  value={abonoNote}
                  onChange={(e) => setAbonoNote(e.target.value)}
                  placeholder="Ej. Efectivo en tienda"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Calculations */}
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-600">Quedará debiendo:</span>
              <span className="font-black text-rose-600 text-sm">
                {currency}{saldoPendiente.toFixed(2)}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
              <input
                type="checkbox"
                checked={decrementStock}
                onChange={(e) => setDecrementStock(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-400"
              />
              <span>Descontar {quantity} pieza(s) del stock de inventario</span>
            </label>
            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Apartado'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
