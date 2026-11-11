import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, Clock, DollarSign, UserCheck, Search, Scale, FileText } from 'lucide-react';
import { Property, ExternalDealStatus, ExternalDealReport } from '../types';
import { api } from '../services/api';

interface ExternalDealReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  existingReport?: ExternalDealReport | null;
  currentUser?: any;
  onSuccess: () => void;
}

const INVESTIGATION_STATUS_STEPS: { status: ExternalDealStatus; label: string; desc: string; color: string }[] = [
  { status: 'جديد', label: '1. بلاغ جديد', desc: 'تم فتح بلاغ عن بيع أو تأجير خارجي للوحدة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { status: 'قيد التحقيق', label: '2. قيد التحقيق', desc: 'الإدارة تتحقق من تفاصيل الصفقة والوسيط الخارجي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { status: 'تم تحديد مصدر المشتري', label: '3. فحص مصدر المشتري', desc: 'مطابقة العميل المشترى مع سجلات عملاء ومعاينات الماسة', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { status: 'مطالبة بالعمولة', label: '4. مطالبة بالعمولة', desc: 'ثبوت حق الشركة وتوجيه إنذار أو مطالبة رسمية بالعمولة', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { status: 'منتهي ومحفوظ', label: '5. منتهي ومحفوظ', desc: 'اكتمال الإجراءات وتسوية الوضع رسمياً', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
];

export const ExternalDealReportModal: React.FC<ExternalDealReportModalProps> = ({
  isOpen,
  onClose,
  properties,
  existingReport,
  currentUser,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isEditing = !!existingReport;
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    existingReport ? existingReport.propertyId : (properties[0]?.id || '')
  );

  const selectedProp = properties.find((p) => p.id === selectedPropertyId);

  const [dealType, setDealType] = useState<'بيع خارجي' | 'تأجير خارجي'>(
    existingReport?.dealType || 'بيع خارجي'
  );
  const [dealDate, setDealDate] = useState(existingReport?.dealDate || new Date().toISOString().split('T')[0]);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(
    existingReport?.estimatedPrice || (selectedProp?.price || 0)
  );
  const [buyerName, setBuyerName] = useState(existingReport?.buyerName || '');
  const [buyerPhone, setBuyerPhone] = useState(existingReport?.buyerPhone || '');
  const [buyerSourceMatched, setBuyerSourceMatched] = useState<'نعم' | 'لا' | 'محتمل' | 'غير معلوم'>(
    existingReport?.buyerSourceMatched || 'غير معلوم'
  );
  const [externalBrokerName, setExternalBrokerName] = useState(existingReport?.externalBrokerName || '');
  const [externalBrokerPhone, setExternalBrokerPhone] = useState(existingReport?.externalBrokerPhone || '');
  const [commissionClaimEligible, setCommissionClaimEligible] = useState(
    existingReport?.commissionClaimEligible || false
  );
  const [commissionClaimAmount, setCommissionClaimAmount] = useState<number>(
    existingReport?.commissionClaimAmount || ((selectedProp?.price || 0) * 0.025)
  );
  const [investigationStatus, setInvestigationStatus] = useState<ExternalDealStatus>(
    existingReport?.investigationStatus || 'جديد'
  );
  const [investigationNotes, setInvestigationNotes] = useState(existingReport?.investigationNotes || '');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp && !isEditing) {
      setErrorMessage('يرجى تحديد العقار');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (isEditing && existingReport) {
        await api.updateExternalDealInvestigation(existingReport.id, {
          investigationStatus,
          buyerName,
          buyerPhone,
          buyerSourceMatched,
          externalBrokerName,
          externalBrokerPhone,
          commissionClaimEligible,
          commissionClaimAmount: Number(commissionClaimAmount),
          investigationNotes: newLogEntry
            ? `${investigationNotes}\n[${new Date().toLocaleDateString('ar-EG')} - ${currentUser?.name || 'الإدارة'}]: ${newLogEntry}`
            : investigationNotes,
        });
      } else if (selectedProp) {
        await api.createExternalDeal({
          propertyId: selectedProp.id,
          propertyCode: selectedProp.code,
          propertyTitle: selectedProp.title,
          ownerId: selectedProp.ownerId || 'unknown',
          ownerName: selectedProp.ownerName || 'مالك العقار',
          ownerPhone: selectedProp.ownerPhone,
          dealType,
          dealDate,
          estimatedPrice: Number(estimatedPrice),
          buyerName,
          buyerPhone,
          buyerSourceMatched,
          externalBrokerName,
          externalBrokerPhone,
          commissionClaimEligible,
          commissionClaimAmount: Number(commissionClaimAmount),
          investigationNotes: newLogEntry || 'تم فتح البلاغ الأولي عن الواقعة',
          reportedBy: currentUser?.name || 'موظف النظام',
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('External deal error:', err);
      setErrorMessage(err.message || 'حدث خطأ في معالجة البلاغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEditing ? `متابعة التحقيق الإداري [${existingReport?.reportNumber}]` : 'بلاغ بيع أو تأجير خارجي جديد'}
              </h3>
              <p className="text-[11px] text-slate-400">مسار التحقيق، مطابقة المشترين، وحفظ حقوق عمولة شركة الماسة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Investigation Workflow Stepper */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300">مرحلة التحقيق الإداري الحالية:</label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {INVESTIGATION_STATUS_STEPS.map((step) => (
                <button
                  type="button"
                  key={step.status}
                  onClick={() => setInvestigationStatus(step.status)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    investigationStatus === step.status
                      ? `${step.color} ring-2 ring-amber-500/50 font-bold shadow-md`
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-bold truncate">{step.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Property Choice */}
          {!isEditing ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">العقار المعني بالبلاغ:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  const p = properties.find((pr) => pr.id === e.target.value);
                  if (p?.price) {
                    setEstimatedPrice(p.price);
                    setCommissionClaimAmount(p.price * 0.025);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium focus:ring-2 focus:ring-amber-500"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} - المالك: {p.ownerName} ({Number(p.price).toLocaleString('en-US')} ج.م)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400">الوحدة محل التحقيق:</span>
                <div className="font-bold text-white text-xs">{existingReport?.propertyTitle} [{existingReport?.propertyCode}]</div>
                <div className="text-[10px] text-slate-400 mt-0.5">المالك: {existingReport?.ownerName} ({existingReport?.ownerPhone})</div>
              </div>
              <div className="text-left">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {existingReport?.dealType}
                </span>
              </div>
            </div>
          )}

          {/* Deal Type & Estimates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع الصفقة المنفذة:</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="بيع خارجي">بيع خارجي</option>
                <option value="تأجير خارجي">تأجير خارجي</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">تاريخ حدوث الصفقة التقريبي:</label>
              <input
                type="date"
                value={dealDate}
                onChange={(e) => setDealDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">السعر التقريبي للصفقة:</label>
              <input
                type="number"
                value={estimatedPrice}
                onChange={(e) => {
                  setEstimatedPrice(Number(e.target.value));
                  setCommissionClaimAmount(Number(e.target.value) * 0.025);
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-bold"
              />
            </div>
          </div>

          {/* External Broker & Buyer Details */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>بيانات الطرف الخارجي والوسيط المنفذ:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">اسم الوسيط الخارجي أو الشركة المنافسة:</label>
                <input
                  type="text"
                  value={externalBrokerName}
                  onChange={(e) => setExternalBrokerName(e.target.value)}
                  placeholder="مثال: مكتب النخبة العقاري / سماسرة المنطقة"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">هاتف الوسيط الخارجي:</label>
                <input
                  type="text"
                  value={externalBrokerPhone}
                  onChange={(e) => setExternalBrokerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">اسم المشتري / المستأجر الفعلي (إن عرف):</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="اسم المشتري أو ممثله"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">رقم هاتف المشتري:</label>
                <input
                  type="text"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="للبحث في سجل المعاينات"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">نتيجة فحص مصدر المشتري مع عملاء الماسة:</label>
              <div className="grid grid-cols-4 gap-2">
                {(['نعم', 'محتمل', 'غير معلوم', 'لا'] as const).map((match) => (
                  <button
                    type="button"
                    key={match}
                    onClick={() => setBuyerSourceMatched(match)}
                    className={`py-1.5 rounded-lg text-center font-bold transition border cursor-pointer ${
                      buyerSourceMatched === match
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {match === 'نعم' && 'نعم (عميل الماسة) ⚠️'}
                    {match === 'محتمل' && 'محتمل (قيد الفحص)'}
                    {match === 'غير معلوم' && 'غير معلوم'}
                    {match === 'لا' && 'لا (عميل خارجي)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legal / Commission Entitlement */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
              <input
                type="checkbox"
                checked={commissionClaimEligible}
                onChange={(e) => setCommissionClaimEligible(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700"
              />
              <span className="text-xs text-rose-300">يوجد حق قانوني أو تعاقدي لشركة الماسة للمطالبة بالعمولة</span>
            </label>

            {commissionClaimEligible && (
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">قيمة العمولة المطالب بها (ج.م):</label>
                  <input
                    type="number"
                    value={commissionClaimAmount}
                    onChange={(e) => setCommissionClaimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-rose-500/50 rounded-lg text-rose-300 font-bold"
                  />
                </div>
                <div className="flex items-center text-[10px] text-slate-400">
                  تحتسب بنسبة 2.5% من إجمالي قيمة الصفقة، ويتم إحالتها للإدارة القانونية للمطالبة أو التسوية الودية.
                </div>
              </div>
            )}
          </div>

          {/* Investigation Notes & Log */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {isEditing ? 'إضافة تحديث جديد لمجريات التحقيق الإداري:' : 'ملاحظات البلاغ وتفاصيل الواقعة:'}
            </label>
            <textarea
              rows={3}
              value={newLogEntry}
              onChange={(e) => setNewLogEntry(e.target.value)}
              placeholder="اكتب ما تم التوصل إليه، أقوال المالك أو المندوب، أو الإجراء الإداري المتخذ..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
            />

            {isEditing && investigationNotes && (
              <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                <span className="font-bold text-slate-300 block mb-1">سجل التحقيق السابق:</span>
                {investigationNotes}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
          >
            إلغاء
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black shadow-lg shadow-rose-500/20 cursor-pointer transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'تحديث ملف التحقيق' : 'تسجيل البلاغ وفتح التحقيق'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
