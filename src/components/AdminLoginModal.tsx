import React, { useState } from 'react';
import { X, Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPin: string;
  onSuccessLogin: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  adminPin,
  onSuccessLogin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const targetPin = (adminPin || '1029').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === targetPin) {
      setError(false);
      onSuccessLogin();
      onClose();
    } else {
      setError(true);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn no-print">
      <div 
        id="admin-login-modal"
        className="relative bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-teal-100 p-6 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          Acceso Administrador
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Ingresa el PIN de seguridad para gestionar productos, existencias, precios y apartados.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                id="admin-pin-input"
                type="password"
                autoFocus
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setError(false);
                }}
                placeholder="••••"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-bold"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-bold mt-2 animate-shake">
                PIN incorrecto. Intenta de nuevo.
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Acceso seguro y protegido</span>
            </div>
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Ingresar al Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
