import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Phone, Building2, ExternalLink, ShieldAlert } from 'lucide-react';
import { PropertyMatchResult, CustomerLead } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface ClientProposalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CustomerLead;
  property: PropertyMatchResult | any;
  requestId?: string;
  searchRequestId?: string;
  currentUser?: { id: string; name: string; role: string };
  onSuccess?: () => void;
  onSentSuccess?: () => void;
}

export const ClientProposalShareModal: React.FC<ClientProposalShareModalProps> = ({
  isOpen,
  onClose,
  client,
  property,
  requestId,
  searchRequestId,
  currentUser,
  onSuccess,
  onSentSuccess,
}) => {
  const [proposalText, setProposalText] = useState('');
  const [channel, setChannel] = useState<'واتساب' | 'اتصال هاتفي' | 'مقابلة شخصية' | 'بريد إلكتروني'>('واتساب');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property && isOpen) {
      api.getPropertyShareMessage(property.propertyId || property.id, client.id)
        .then((res) => {
          setProposalText(res.message);
        })
        .catch(() => {
          setProposalText(`مساء الخير أستاذ/ة ${client.name}،
يسر شركة الماسة للتسويق العقاري مشاركتكم تفاصيل هذه الوحدة المناسبة لطلبكم:
🏢 كود العقار: ${property.propertyCode || property.code}
📍 الموقع: ${property.district}
📐 المساحة: ${property.area || property.areaSqM} م²
💵 السعر: ${(property.price || 0).toLocaleString()} ج.م
يسعدنا ترتيب موعد معاينة ميدانية لحضرتكم في أي وقت.`);
        });
      setCopied(false);
      setError(null);
    }
  }, [property, client, isOpen]);

  if (!isOpen || !property) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendAndSave = async (openWhatsAppDirect = false) => {
    setLoading(true);
    setError(null);
    try {
      await api.createClientProposal({
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        requestId: requestId || searchRequestId || null,
        propertyId: property.propertyId || property.id,
        propertyTitle: property.propertyTitle || property.title,
        propertyCode: property.propertyCode || property.code,
        propertyPrice: property.price,
        channel,
        proposalText,
        approvalStatus: 'معتمد',
      } as any);

      if (openWhatsAppDirect) {
        let cleanPhone = client.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('01')) {
          cleanPhone = '2' + cleanPhone; // Egypt country code
        }
        const encoded = encodeURIComponent(proposalText);
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }

      if (onSuccess) onSuccess();
      if (onSentSuccess) onSentSuccess();
      toast.success('تم تسجيل إرسال العرض في سجل العميل بقاعدة البيانات');
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل العرض في سجل العميل');
      toast.error(err.message || 'فشل تسجيل العرض في سجل العميل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base font-bold">مشاركة وتوثيق عرض عقاري للعميل</h2>
              <p className="text-xs text-emerald-100">
                المرسل إليه: {client.name} ({client.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Brief Strip */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{property.propertyTitle || property.title}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{property.propertyCode || property.code}</span>
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {(property.price || 0).toLocaleString()} ج.م
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Channel selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وسيلة الإرسال والتواصل
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['واتساب', 'اتصال هاتفي', 'مقابلة شخصية', 'بريد إلكتروني'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                    channel === ch
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Proposal Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                نص الرسالة المجهزة (يمكنك التعديل والإضافة بحرية قبل الإرسال)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400">
            ℹ️ عند الضغط على الإرسال، سيتم توثيق إرسال هذه الوحدة تلقائياً داخل سجل العميل ومتابعة رد العميل لاحقاً، مع تحديث حالة العميل إلى "تم إرسال عروض".
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={() => handleSendAndSave(false)}
              disabled={loading}
              className="px-4 py-2 text-xs rounded-lg font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              توثيق الإرسال فقط
            </button>

            <button
              type="button"
              onClick={() => handleSendAndSave(true)}
              disabled={loading}
              className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>توثيق وفتح واتساب المباشر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
