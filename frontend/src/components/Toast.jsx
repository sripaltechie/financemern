import React, { useEffect } from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 3000); // Auto close after 3s
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`fixed top-5 right-5 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-right duration-300 ${
      toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
    }`}>
      {toast.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      <div>
        <h4 className="font-bold text-sm">{toast.title}</h4>
        <p className="text-xs opacity-90">{toast.message}</p>
      </div>
      <button onClick={onClose} className="ml-2 hover:bg-black/5 p-1 rounded-full"><X className="w-4 h-4" /></button>
    </div>
  );
};

export default Toast;