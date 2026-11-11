import React from 'react';
import { QrCode, Printer, X, MapPin, Building2, Phone } from 'lucide-react';
import { Property } from '../types';

interface QRCodeModalProps {
  property: Property | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ property, onClose }) => {
  if (!property) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `https://almasa-realestate.eg/property/${property.code}`
  )}`;

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">بطاقة كود QR المعاينة الميدانية</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card */}
        <div className="bg-white text-slate-950 rounded-2xl p-6 shadow-inner space-y-4 text-center border-2 border-amber-500">
          <div className="text-xs font-black tracking-wider text-amber-600">الماسة للتسويق العقاري</div>
          <h4 className="text-sm font-bold">{property.title}</h4>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>{property.district}</span>
            <span>•</span>
            <span className="font-bold text-slate-950">كود: {property.code}</span>
          </div>

          <div className="w-44 h-44 mx-auto border-2 border-slate-900 rounded-xl overflow-hidden p-2 bg-white shadow-md">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="text-xs font-bold text-slate-900">
            امسح الكود لمعاينة الكتالوج الرقمي ومستندات الملكية
          </div>

          <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
            السعر المطلوب: <strong className="text-amber-600 text-xs">{formatEGP(property.price)}</strong>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300">
            إلغاء
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة بطاقة المعاينة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
