import React from 'react';
import { X, Scale, Bed, Bath, Maximize2, MapPin, Check, Minus, Building, Eye, Calendar, Sparkles } from 'lucide-react';
import { Property } from '../types';

interface PropertyComparisonModalProps {
  properties: Property[];
  onClose: () => void;
  onRemoveFromComparison: (propertyId: string) => void;
  onSelectPropertyDetails: (property: Property) => void;
  onClearComparison: () => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  properties,
  onClose,
  onRemoveFromComparison,
  onSelectPropertyDetails,
  onClearComparison,
}) => {
  if (properties.length === 0) return null;

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                مقارنة الوحدات المختارة ({properties.length})
              </h2>
              <p className="text-xs text-slate-400">
                مقارنة الأسعار والمساحات والمواصفات الميدانية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearComparison}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              مسح الكل
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table / Matrix */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="min-w-[650px] space-y-4">
            {/* Top Cards Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col justify-end">
                <span className="text-xs font-black text-amber-400 block mb-1">المعايير والمواصفات</span>
                <p className="text-[11px] text-slate-500">اختر الوحدة التي تناسب ميزانيتك وأسلوب حياتك</p>
              </div>

              {properties.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 relative group space-y-2 flex flex-col justify-between"
                >
                  <button
                    onClick={() => onRemoveFromComparison(p.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-white hover:bg-rose-600 transition-all cursor-pointer z-10"
                    title="إزالة من المقارنة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative h-28 rounded-xl overflow-hidden bg-slate-800">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 text-[10px] font-bold bg-slate-950/80 rounded text-amber-400">
                      {p.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                      {p.title}
                    </h4>
                    <span className="text-sm font-black text-amber-400 block mt-1">
                      {formatEGP(p.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectPropertyDetails(p);
                      onClose();
                    }}
                    className="w-full py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>التفاصيل والمعاينة</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Specification Rows */}
            <div className="space-y-1 text-xs">
              {/* Row: Price per m² */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">سعر المتر المربع:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-bold text-slate-200">
                    {formatEGP(Math.round(p.price / (p.areaSqM || 1)))} / م²
                  </span>
                ))}
              </div>

              {/* Row: Area */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">المساحة:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-black text-amber-400">
                    {p.areaSqM} م²
                  </span>
                ))}
              </div>

              {/* Row: Type & Purpose */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">النوع والغرض:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-medium text-slate-200">
                    {p.type} ({p.purpose})
                  </span>
                ))}
              </div>

              {/* Row: Location */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">المنطقة والحي:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-medium text-slate-200 truncate">
                    {p.district} - {p.city}
                  </span>
                ))}
              </div>

              {/* Row: Bedrooms & Bathrooms */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">الغرف والحمامات:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-medium text-slate-200">
                    {p.bedrooms} غرف • {p.bathrooms} حمام
                  </span>
                ))}
              </div>

              {/* Row: Floor */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">الطابق:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-medium text-slate-200">
                    {p.floor === 0 ? 'أرضي' : `الطابق ${p.floor}`}
                  </span>
                ))}
              </div>

              {/* Row: Finishing */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">التشطيب:</span>
                {properties.map((p) => (
                  <span key={p.id} className="font-bold text-emerald-400">
                    {p.finishing || 'سوبر لوكس'}
                  </span>
                ))}
              </div>

              {/* Row: Parking */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">موقف سيارات (باكية):</span>
                {properties.map((p) => (
                  <span key={p.id}>
                    {p.parking ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600" />
                    )}
                  </span>
                ))}
              </div>

              {/* Row: Garden / Pool */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">حديقة / حمام سباحة:</span>
                {properties.map((p) => (
                  <span key={p.id} className="text-slate-300">
                    {p.garden && 'حديقة '}
                    {p.pool && '• مسبح'}
                    {!p.garden && !p.pool && <Minus className="w-4 h-4 text-slate-600" />}
                  </span>
                ))}
              </div>

              {/* Row: Furniture */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/60 items-center">
                <span className="text-slate-400 font-bold">الفرش والتكييف:</span>
                {properties.map((p) => (
                  <span key={p.id}>
                    {p.furniture ? (
                      <span className="text-purple-400 font-bold">مفروش بالكامل</span>
                    ) : (
                      <span className="text-slate-400">غير مفروش</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            إغلاق نافذة المقارنة
          </button>
        </div>
      </div>
    </div>
  );
};
