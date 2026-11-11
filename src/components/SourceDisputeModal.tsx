import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserCheck, X } from 'lucide-react';
import { CustomerLead, SourceDispute } from '../types';
import { api } from '../services/api';

interface SourceDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CustomerLead;
  currentUser: { id: string; name: string; role: string };
  onSuccess: () => void;
}

export const SourceDisputeModal: React.FC<SourceDisputeModalProps> = ({
  isOpen,
  onClose,
  client,
  currentUser,
  onSuccess,
}) => {
  const [claimedSource, setClaimedSource] = useState((client as any).lead_source || client.leadSource || 'إعلان فيسبوك');
  const [evidenceType, setEvidenceType] = useState('لقطة شاشة محادثة وتاريخ التسجيل');
  const [evidenceDetails, setEvidenceDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDetails.trim()) {
      setErrorMessage('يرجى كتابة تفاصيل الإثبات ومبررات النزاع حول مصدر العميل');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await api.createSourceDispute({
        clientId: client.id,
        disputedById: currentUser?.id || 'usr-1',
        disputedByName: currentUser?.name || 'مستخدم',
        currentSource: (client as any).lead_source || client.leadSource || 'غير محدد',
        claimedSource: claimedSource,
        evidenceType: evidenceType,
        evidenceDetails: evidenceDetails,
      } as any);

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تقديم طلب النزاع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">طلب تحكيم وتصحيح مصدر العميل</h3>
              <p className="text-xs text-amber-700">رفع اعتراض لإدارة التسويق لتوثيق أسبقية المصدر وحماية العمولات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>العميل:</span>
              <span className="font-bold text-slate-800">{client.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>رقم الهاتف:</span>
              <span className="font-mono text-slate-800" dir="ltr">{client.phone}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>المصدر الحالي المسجل:</span>
              <span className="font-semibold text-rose-600">{client.lead_source || 'غير محدد'}</span>
            </div>
            {client.source_locked && (
              <div className="text-xs text-amber-700 font-medium pt-1 border-t border-slate-200">
                🔒 هذا المصدر مقفل إدارياً ولا يمكن تعديله إلا من خلال موافقة الإدارة على النزاع.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              المصدر الصحيح الذي تدعي أحقيتك به <span className="text-rose-500">*</span>
            </label>
            <select
              value={claimedSource}
              onChange={(e) => setClaimedSource(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              required
            >
              <option value="إعلان فيسبوك">إعلان فيسبوك (Facebook Ads)</option>
              <option value="إعلان جوجل">إعلان جوجل (Google Ads)</option>
              <option value="إعلان تيك توك">إعلان تيك توك (TikTok Ads)</option>
              <option value="إعلان انستغرام">إعلان انستغرام (Instagram)</option>
              <option value="واتساب">حملة رسائل واتساب (WhatsApp Campaign)</option>
              <option value="مكالمة واردة مباشرة">مكالمة واردة مباشرة</option>
              <option value="توصية عميل سابق">توصية عميل سابق (Referral)</option>
              <option value="وسيط متعاون">وسيط متعاون (External Broker)</option>
              <option value="زيارة مقر الشركة">زيارة مقر الشركة</option>
              <option value="لافتة إعلانية خارجية">لافتة إعلانية / يافطة على العقار</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              نوع الإثبات المرفق <span className="text-rose-500">*</span>
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="لقطة شاشة محادثة وتاريخ التسجيل">لقطة شاشة لمحادثة وتاريخ التسجيل الأول</option>
              <option value="سجل اتصال هاتفي">سجل مكالمة هاتفية بتوقيت سابق</option>
              <option value="استمارة إعلان ليد">Lead Form Timestamp من مدير الإعلانات</option>
              <option value="إحالة موثقة من مسوق خارجي">إحالة موثقة أو اتفاقية مسوق خارجي</option>
              <option value="أخرى">بيان تفصيلي آخر</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              تفاصيل الإثبات وشرح النزاع <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={evidenceDetails}
              onChange={(e) => setEvidenceDetails(e.target.value)}
              placeholder="وضح بالتفصيل: تاريخ أول تواصل، رقم الحملة الإعلانية، الأدلة التي تثبت أحقيتك بتسجيل العميل تحت هذا المصدر..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تقديم طلب التحكيم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
