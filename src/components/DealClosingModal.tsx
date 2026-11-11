import React, { useState } from 'react';
import { X, Award, CheckCircle2, Clock, DollarSign, UserCheck, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';
import { Property, CustomerLead } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface DealClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  clients: CustomerLead[];
  currentUser?: any;
  preselectedProperty?: Property | null;
  onSuccess: () => void;
}

export const DealClosingModal: React.FC<DealClosingModalProps> = ({
  isOpen,
  onClose,
  properties,
  clients,
  currentUser,
  preselectedProperty,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const availableProperties = properties.filter(
    (p) => p.availabilityStatus !== 'تم البيع' && p.availabilityStatus !== 'تم التأجير'
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState(
    preselectedProperty ? preselectedProperty.id : (availableProperties[0]?.id || '')
  );

  const selectedProp = properties.find((p) => p.id === selectedPropertyId);

  const [dealType, setDealType] = useState<'بيع' | 'تأجير'>(
    selectedProp?.purpose === 'إيجار' ? 'تأجير' : 'بيع'
  );
  const [dealDate, setDealDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalPrice, setFinalPrice] = useState<number>(selectedProp?.price || 0);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNationalId, setClientNationalId] = useState('');
  const [marketerName, setMarketerName] = useState(currentUser?.name || 'مسوق الماسة');
  const [commissionPct, setCommissionPct] = useState<number>(selectedProp?.commissionPct || 2.5);
  const [commissionAmount, setCommissionAmount] = useState<number>(
    (selectedProp?.price || 0) * ((selectedProp?.commissionPct || 2.5) / 100)
  );
  const [companyShare, setCompanyShare] = useState<number>(
    ((selectedProp?.price || 0) * ((selectedProp?.commissionPct || 2.5) / 100)) * 0.7
  );
  const [marketerShare, setMarketerShare] = useState<number>(
    ((selectedProp?.price || 0) * ((selectedProp?.commissionPct || 2.5) / 100)) * 0.3
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePriceChange = (price: number) => {
    setFinalPrice(price);
    const totalComm = price * (commissionPct / 100);
    setCommissionAmount(totalComm);
    setCompanyShare(totalComm * 0.7);
    setMarketerShare(totalComm * 0.3);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) {
      setErrorMessage('يرجى تحديد العقار أولاً');
      return;
    }
    if (!clientName || !finalPrice) {
      setErrorMessage('اسم العميل وقيمة الصفقة حقول إلزامية');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.createDealClosing({
        propertyId: selectedProp.id,
        propertyCode: selectedProp.code,
        propertyTitle: selectedProp.title,
        dealType,
        dealDate,
        finalPrice: Number(finalPrice),
        clientId: selectedClientId || undefined,
        clientName,
        clientPhone,
        clientNationalId,
        sellerOwnerId: selectedProp.ownerId,
        sellerOwnerName: selectedProp.ownerName,
        closerEmployeeId: currentUser?.id,
        closerEmployeeName: marketerName,
        commissionTotal: Number(commissionAmount),
        companyShare: Number(companyShare),
        marketerShare: Number(marketerShare),
        notes,
      });

      onSuccess();
      toast.success('تم اعتماد الصفقة بنجاح وتفعيل مهلة الأرشفة 24 ساعة');
      onClose();
    } catch (err: any) {
      console.error('Deal closing error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء اعتماد الصفقة');
      toast.error(err.message || 'فشل اعتماد الصفقة');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">اعتماد صفقة بيع / تأجير رسمية (Deal Closing)</h3>
              <p className="text-[11px] text-slate-400">توثيق العقد، توزيع العمولات، وأرشفة العقار بعد 24 ساعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 24-Hour Transition Notice Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-200">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-amber-300">مسار الإغلاق وقاعدة الأرشفة التلقائية بعد 24 ساعة:</div>
              <div className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                عند اعتماد الصفقة، سيتم تحويل حالة الوحدة فوراً إلى &quot;{dealType === 'تأجير' ? 'تم التأجير' : 'تم البيع'}&quot;، ومنع حجز أي معاينات جديدة لها في النظام، مع إظهار شارة الإغلاق البصرية لمدة 24 ساعة قبل أرشفة الوحدة تلقائياً من السوق النشط.
              </div>
            </div>
          </div>

          {/* Property Selection */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">الوحدة العقارية المباعة / المؤجرة:</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                const p = properties.find((pr) => pr.id === e.target.value);
                if (p) {
                  handlePriceChange(p.price);
                  setDealType(p.purpose === 'إيجار' ? 'تأجير' : 'بيع');
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

          {/* Deal Type & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع الصفقة:</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
              >
                <option value="بيع">بيع نهائي</option>
                <option value="تأجير">عقد إيجار</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">تاريخ إتمام الصفقة:</label>
              <input
                type="date"
                value={dealDate}
                onChange={(e) => setDealDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">السعر النهائي للتعاقد (ج.م):</label>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-emerald-400 font-mono font-bold text-sm"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between">
              <span>بيانات العميل المشتري / المستأجر:</span>
              <span className="text-[10px] text-amber-400">يمكن الاختيار من CRM أو إدخال عميل جديد</span>
            </h4>

            <div>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 mb-2"
              >
                <option value="">-- اختيار عميل مسجل في قاعدة البيانات --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.category || 'عميل محتمل'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">اسم العميل بالكامل:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="الاسم الثلاثي أو الرباعي"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الرقم القومي للعميل:</label>
                <input
                  type="text"
                  value={clientNationalId}
                  onChange={(e) => setClientNationalId(e.target.value)}
                  placeholder="14 رقماً"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-200 text-xs">توزيع العمولة والأتعاب:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">إجمالي العمولة المستحقة:</span>
                <span className="text-amber-400 font-bold text-sm">
                  {Number(commissionAmount).toLocaleString('en-US')} ج.م
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">({commissionPct}%)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">نصيب شركة الماسة (70%):</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {Number(companyShare).toLocaleString('en-US')} ج.م
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">نصيب المسوق / Closer (30%):</span>
                <span className="text-blue-400 font-bold text-sm">
                  {Number(marketerShare).toLocaleString('en-US')} ج.م
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">المسوق المسؤول عن إغلاق الصفقة:</label>
                <input
                  type="text"
                  value={marketerName}
                  onChange={(e) => setMarketerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">ملاحظات العقد والتوثيق:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="رقم العقد، شروط خاصة، أو دفعات مؤجلة..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
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
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black shadow-lg shadow-emerald-500/20 cursor-pointer transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>جاري اعتماد الصفقة...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد الصفقة وتفعيل مهلة الأرشفة 24h</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
