import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Check, 
  Calendar, 
  FileText, 
  MessageCircle,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { Apartado } from '../types';

interface AbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartado: Apartado | null;
  currency: string;
  onSaveAbono: (apartadoId: string, amount: number, note?: string) => Promise<void>;
  whatsappNumber: string;
}

export const AbonoModal: React.FC<AbonoModalProps> = ({
  isOpen,
  onClose,
  apartado,
  currency,
  onSaveAbono,
  whatsappNumber,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('Abono en efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !apartado) return null;

  const numericAmount = Number(amount) || 0;
  const nuevoSaldo = Math.max(0, apartado.saldoPendiente - numericAmount);
  const nuevoTotalAbonado = apartado.totalAbonado + numericAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!numericAmount || numericAmount <= 0) {
      setValidationError('Por favor ingresa un monto de abono válido mayor a $0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveAbono(apartado.id, numericAmount, note);
      onClose();
    } catch (err) {
      console.error('Error recording abono:', err);
      setValidationError('Ocurrió un error al registrar el abono. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppReceipt = () => {
    const targetPhone = apartado.clientPhone ? apartado.clientPhone.replace(/\D/g, '') : whatsappNumber.replace(/\D/g, '');
    let text = `🌸 *Comprobante de Abono - Papelería La Señora Cositas*\n\n` +
      `👤 *Cliente:* ${apartado.clientName}\n` +
      `📦 *Producto:* ${apartado.productName}\n` +
      `💰 *Total del apartado:* ${currency}${apartado.totalPrice.toFixed(2)}\n` +
      `💵 *Abono registrado:* ${currency}${numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'}\n` +
      `📊 *Total abonado a la fecha:* ${currency}${nuevoTotalAbonado.toFixed(2)}\n` +
      `⏳ *Saldo restante por liquidar:* ${currency}${nuevoSaldo.toFixed(2)}\n\n`;

    if (nuevoSaldo === 0) {
      text += `🎉 *¡Felicidades! Tu apartado está 100% LIQUIDADO.* Ya puedes pasar por tu producto. ¡Muchas gracias!`;
    } else {
      text += `¡Gracias por tu pago!`;
    }

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn no-print">
      <div 
        id="abono-modal"
        className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-teal-100 p-5 sm:p-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4 text-teal-900">
          <div className="p-2 rounded-2xl bg-teal-100 text-teal-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black">Registrar Abono</h3>
            <p className="text-xs text-teal-700">Actualiza la deuda y abonos del cliente</p>
          </div>
        </div>

        {/* Apartado Client & Product Overview */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Cliente:</span>
            <span className="font-bold text-slate-900">{apartado.clientName}</span>
          </div>
          {apartado.clientNote && (
            <div className="flex justify-between items-center text-teal-800">
              <span className="text-slate-500">Referencia:</span>
              <span className="font-medium italic">{apartado.clientNote}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Producto:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{apartado.productName}</span>
          </div>
          <div className="pt-2 border-t border-teal-200 flex justify-between items-center">
            <span className="text-slate-600 font-bold">Total original:</span>
            <span className="font-bold text-slate-900">{currency}{apartado.totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-rose-600 font-bold">
            <span>Debe actualmente:</span>
            <span className="text-sm font-black">{currency}{apartado.saldoPendiente.toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Monto a abonar hoy ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                {currency}
              </span>
              <input
                id="abono-amount-input"
                type="number"
                step="0.5"
                min="1"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setAmount(Math.round(apartado.saldoPendiente * 0.5))}
                className="text-[11px] py-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
              >
                50% ({currency}{Math.round(apartado.saldoPendiente * 0.5)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(apartado.saldoPendiente)}
                className="text-[11px] py-1 px-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-teal-800 font-bold"
              >
                Liquidar Todo ({currency}{apartado.saldoPendiente})
              </button>
            </div>
          </div>

          {/* Note / Method */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Forma de pago o nota
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Efectivo, Transferencia, En tienda..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* New Balance Projection Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span>Nuevo total abonado:</span>
              <span className="font-bold text-teal-700">{currency}{nuevoTotalAbonado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
              <span>Nuevo saldo que quedará debiendo:</span>
              <span className={`text-sm ${nuevoSaldo === 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}`}>
                {nuevoSaldo === 0 ? '¡LIQUIDADO ($0.00)!' : `${currency}${nuevoSaldo.toFixed(2)}`}
              </span>
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
              {validationError}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              id="submit-abono-btn"
              type="submit"
              disabled={isSubmitting || !numericAmount}
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Registrar y Guardar Abono'}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppReceipt}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Enviar Comprobante por WhatsApp al Cliente
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
