import React, { useState } from 'react';
import { Share2, X, Check, Copy, MessageSquare, Facebook, Send, Link, Building2, MapPin } from 'lucide-react';
import { Property } from '../types';

interface SharePropertyModalProps {
  property: Property | null;
  onClose: () => void;
}

export const SharePropertyModal: React.FC<SharePropertyModalProps> = ({ property, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!property) return null;

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  const propertyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/property/${property.code}`
    : `https://almasa-realestate.eg/property/${property.code}`;

  const shareText = `🏢 *شركة الماسة العقارية - فرصة عقارية حصرية*
  
📌 *العقار:* ${property.title}
🔢 *الكود:* ${property.code}
📍 *الموقع:* ${property.district} - ${property.city}
📐 *المساحة:* ${property.areaSqM} م² | *التشطيب:* ${property.finishing}
💰 *السعر:* ${formatEGP(property.price)} (${property.purpose})
✨ *الحالة:* ${property.status}

للتواصل والاستفسار والمعاينة الفورية:
📞 ${property.ownerPhone || '01000000000'}
🌐 ${propertyUrl}`;

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleMessenger = () => {
    // Standard FB Messenger Web Share URL
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(propertyUrl)}&app_id=123456789&redirect_uri=${encodeURIComponent(propertyUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مشاركة العقار مع العملاء</h3>
              <p className="text-[11px] text-slate-400">كود الوحدة: {property.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Property Brief Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {property.code}
              </span>
              <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{property.title}</h4>
            </div>
            <span className="text-sm font-black text-amber-400 whitespace-nowrap">{formatEGP(property.price)}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {property.district}
            </span>
            <span>•</span>
            <span>{property.type} ({property.purpose})</span>
            <span>•</span>
            <span>{property.areaSqM} م²</span>
          </div>
        </div>

        {/* Social Share Buttons Grid */}
        <div className="space-y-3 text-center">
          <label className="text-xs font-bold text-amber-400 block text-center">
            اختر منصة المشاركة المباشرة (توجيه فوري):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 justify-center items-center">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="w-full h-12 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">واتساب (WhatsApp)</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebook}
              className="w-full h-12 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Facebook className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">فيسبوك (Facebook)</span>
            </button>

            {/* Messenger */}
            <button
              onClick={handleMessenger}
              className="w-full h-12 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">ماسنجر (Messenger)</span>
            </button>
          </div>
        </div>

        {/* Copy Options */}
        <div className="pt-3 border-t border-slate-800 space-y-2.5 text-center">
          <button
            onClick={handleCopyText}
            className={`w-full h-11 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className="truncate">{copied ? 'تم نسخ كامل التفاصيل بالرابط إلى الحافظة!' : 'نسخ النص الكامل لتفاصيل العقار مع الرابط'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`w-full h-11 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              copiedLink
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Link className="w-4 h-4 text-slate-400 shrink-0" />}
            <span className="truncate">{copiedLink ? 'تم نسخ رابط العقار المباشر!' : 'نسخ رابط العقار المباشر فقط'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
