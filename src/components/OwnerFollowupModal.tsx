import React, { useState } from 'react';
import { X, Phone, MessageSquare, Users, Eye, CheckCircle2, AlertTriangle, Clock, Calendar, DollarSign, ShieldAlert, Sparkles } from 'lucide-react';
import { Property, PropertyOwner, UnitAvailabilityStatus } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface OwnerFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  properties: Property[];
  owners: PropertyOwner[];
  currentUser?: any;
  onFollowupSuccess: () => void;
}

const AVAILABILITY_OPTIONS: { value: UnitAvailabilityStatus; label: string; desc: string; color: string }[] = [
  { value: 'متاحة ومؤكدة', label: 'متاحة ومؤكدة', desc: 'تم التواصل مع المالك وتأكيد التوافر والسعر', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'متاحة لكن تحتاج إعادة تأكيد', label: 'متاحة لكن تحتاج إعادة تأكيد', desc: 'الوحدة معروضة لكن مر وقت على آخر تأكيد', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'لم يتم الرد من المالك', label: 'لم يتم الرد من المالك', desc: 'تمت محاولة الاتصال أو المراسلة دون استجابة', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'تحت التفاوض', label: 'تحت التفاوض', desc: 'يوجد تفاوض نشط مع عميل محتمل على السعر أو الشروط', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'محجوزة', label: 'محجوزة', desc: 'تم دفع جدية حجز أو عربون وبانتظار التعاقد', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'تم البيع', label: 'تم البيع', desc: 'تم بيع الوحدة رسمياً سواء عبر الماسة أو خارجياً', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { value: 'تم التأجير', label: 'تم التأجير', desc: 'تم تأجير الوحدة رسمياً سواء عبر الماسة أو خارجياً', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  { value: 'موقوفة بطلب المالك', label: 'موقوفة بطلب المالك', desc: 'المالك طلب تعليق التسويق مؤقتاً', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  { value: 'غير متاحة لسبب آخر', label: 'غير متاحة لسبب آخر', desc: 'نزاع قانوني، صيانة كبرى، أو سبب تم توضيحه بالملاحظات', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
];

export const OwnerFollowupModal: React.FC<OwnerFollowupModalProps> = ({
  isOpen,
  onClose,
  property,
  properties,
  owners,
  currentUser,
  onFollowupSuccess,
}) => {
  if (!isOpen) return null;

  const initialPropertyId = property ? property.id : (properties[0]?.id || '');
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId);

  const currentProp = properties.find((p) => p.id === selectedPropertyId) || property;
  const currentOwner = owners.find((o) => o.id === currentProp?.ownerId) || (currentProp ? {
    id: currentProp.ownerId || 'unknown',
    name: currentProp.ownerName || 'مالك العقار',
    phone: currentProp.ownerPhone || '',
  } : null);

  const [channel, setChannel] = useState<'اتصال هاتفي' | 'واتساب' | 'مقابلة شخصية' | 'زيارة ميدانية' | 'بريد إلكتروني'>('اتصال هاتفي');
  const [isAnswered, setIsAnswered] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<UnitAvailabilityStatus>(
    (currentProp?.availabilityStatus as UnitAvailabilityStatus) || 'متاحة ومؤكدة'
  );
  const [validityDays, setValidityDays] = useState<number>(currentProp?.confirmationValidityDays || 14);
  const [priceChanged, setPriceChanged] = useState(false);
  const [newPrice, setNewPrice] = useState<number>(currentProp?.price || 0);
  const [specsChanged, setSpecsChanged] = useState(false);
  const [newSpecsNotes, setNewSpecsNotes] = useState('');
  const [isSoldOrRented, setIsSoldOrRented] = useState(false);
  const [dealType, setDealType] = useState<'بيع' | 'تأجير'>('بيع');
  const [closedByOtherCompany, setClosedByOtherCompany] = useState(false);
  const [otherBrokerName, setOtherBrokerName] = useState('');
  const [dealsWithOthers, setDealsWithOthers] = useState(false);
  const [commissionAgreedPct, setCommissionAgreedPct] = useState<number>(currentProp?.commissionPct || 2.5);
  const [nextFollowupDate, setNextFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePropertyChange = (newId: string) => {
    setSelectedPropertyId(newId);
    const p = properties.find((prop) => prop.id === newId);
    if (p) {
      if (p.price) setNewPrice(p.price);
      if (p.availabilityStatus) setAvailabilityStatus(p.availabilityStatus);
      if (p.confirmationValidityDays) setValidityDays(p.confirmationValidityDays);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProp || !currentOwner) {
      setErrorMessage('يرجى تحديد العقار والمالك أولاً');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.createOwnerFollowup({
        propertyId: currentProp.id,
        propertyCode: currentProp.code,
        propertyTitle: currentProp.title,
        ownerId: currentOwner.id,
        ownerName: currentOwner.name,
        ownerPhone: currentOwner.phone,
        channel,
        isAnswered,
        availabilityStatus: isAnswered ? availabilityStatus : 'لم يتم الرد من المالك',
        priceChanged,
        oldPrice: currentProp.price,
        newPrice: priceChanged ? Number(newPrice) : currentProp.price,
        specsChanged,
        newSpecsNotes: specsChanged ? newSpecsNotes : undefined,
        isSoldOrRented: isSoldOrRented || availabilityStatus === 'تم البيع' || availabilityStatus === 'تم التأجير',
        dealType: (availabilityStatus === 'تم التأجير' || (isSoldOrRented && dealType === 'تأجير')) ? 'تأجير' : 'بيع',
        closedByOtherCompany,
        otherBrokerName: closedByOtherCompany ? otherBrokerName : undefined,
        commissionAgreedPct: Number(commissionAgreedPct),
        notes,
        nextFollowupDate,
        validityDays: Number(validityDays),
      });

      // Update owner deals with others if marked
      if (dealsWithOthers && currentOwner.id) {
        await api.updateOwner(currentOwner.id, {
          dealsWithOthers: true,
          otherBrokersDetails: otherBrokerName || 'يتعامل مع وسطاء خارجيين',
        }).catch(() => {});
      }

      onFollowupSuccess();
      toast.success('تم تسجيل متابعة المالك وتحديث حالة توافر الوحدة في قاعدة البيانات');
      onClose();
    } catch (err: any) {
      console.error('Followup submit error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ المتابعة');
      toast.error(err.message || 'فشل حفظ متابعة المالك');
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
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تسجيل متابعة مالك وتأكيد توافر الوحدة</h3>
              <p className="text-[11px] text-slate-400">تحديث دوري للحالة والسعر وتاريخ انتهاء التأكيد بقاعدة البيانات</p>
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

          {/* Property & Owner Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">الوحدة العقارية المعنية:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium focus:ring-2 focus:ring-amber-500"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} - ({p.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">سجل المالك وبياناته:</label>
              <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300 flex items-center justify-between">
                <span className="font-bold text-white truncate">{currentOwner?.name || 'غير محدد'}</span>
                <span className="text-[11px] text-amber-400 font-mono dir-ltr">{currentOwner?.phone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Channel & Did Owner Answer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">وسيلة التواصل:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['اتصال هاتفي', 'واتساب', 'مقابلة شخصية', 'زيارة ميدانية', 'بريد إلكتروني'] as const).map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                      channel === ch
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">هل تم الرد والتجاوب من المالك؟</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAnswered(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                    isAnswered
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>نعم، تم الرد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnswered(false);
                    setAvailabilityStatus('لم يتم الرد من المالك');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isAnswered
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-xs'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>لم يتم الرد</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unit Availability Status (The 9 official states) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-200">
                حالة توافر الوحدة المعتمدة (9 حالات):
              </label>
              <span className="text-[10px] text-amber-400 font-bold">الحالة تؤثر فورياً على صلاحية حجز المعاينات</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setAvailabilityStatus(opt.value);
                    if (opt.value === 'تم البيع' || opt.value === 'تم التأجير') {
                      setIsSoldOrRented(true);
                      setDealType(opt.value === 'تم التأجير' ? 'تأجير' : 'بيع');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    availabilityStatus === opt.value
                      ? `${opt.color} ring-2 ring-amber-500/50 shadow-md`
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[10px] opacity-75 mt-1 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Validity Period in Days */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>فترة صلاحية التأكيد (مدة سريان التوافر):</span>
              </label>
              <span className="text-[11px] font-bold text-amber-400">{validityDays} يوم</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[7, 14, 21, 30, 45, 60].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setValidityDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    validityDays === d
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {d} يوم
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="365"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-center font-bold focus:ring-2 focus:ring-amber-500"
                placeholder="أيام"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              بعد انقضاء هذه المدة تلقائياً، تتحول الوحدة إلى حالة &quot;تحتاج إعادة تأكيد&quot; ويتم إنشاء مهمة متابعة فورية للمسؤول.
            </p>
          </div>

          {/* Price Change Diff Section */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
              <input
                type="checkbox"
                checked={priceChanged}
                onChange={(e) => setPriceChanged(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
              <span className="text-xs">هل تغير السعر المطلوب من المالك خلال هذه المتابعة؟</span>
            </label>

            {priceChanged && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1">السعر السابق المسجل:</span>
                  <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-slate-400 font-mono font-bold line-through">
                    {Number(currentProp?.price || 0).toLocaleString('en-US')} ج.م
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] text-amber-400 font-bold mb-1">السعر الجديد المطلوب:</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    placeholder="السعر الجديد"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Brokerage & Third-Party Dealings */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={dealsWithOthers}
                  onChange={(e) => setDealsWithOthers(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs font-bold">هل يتعامل المالك مع شركات أو وسطاء آخرين؟</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={closedByOtherCompany}
                  onChange={(e) => {
                    setClosedByOtherCompany(e.target.checked);
                    if (e.target.checked) {
                      setIsSoldOrRented(true);
                    }
                  }}
                  className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs font-bold text-rose-400">تم البيع/التأجير بواسطة شركة خارجية أخرى</span>
              </label>
            </div>

            {(dealsWithOthers || closedByOtherCompany) && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[10px] text-slate-300 font-bold mb-1">أسماء الشركات أو الوسطاء الآخرين:</label>
                <input
                  type="text"
                  value={otherBrokerName}
                  onChange={(e) => setOtherBrokerName(e.target.value)}
                  placeholder="مثال: شركة إعمار المستقبل / الوسيط أحمد نبيل..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Next Followup Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">موعد المتابعة القادمة:</label>
              <input
                type="date"
                value={nextFollowupDate}
                onChange={(e) => setNextFollowupDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">نسبة العمولة المتفق عليها (%):</label>
              <input
                type="number"
                step="0.1"
                value={commissionAgreedPct}
                onChange={(e) => setCommissionAgreedPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">ملاحظات المتابعة التفصيلية:</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب خلاصة المكالمة، رغبة المالك، أية شروط خاصة، أو تعديلات في طريقة الدفع والتقسيط..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
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
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20 cursor-pointer transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>جاري الحفظ والمزامنة...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ المتابعة وتحديث حالة الوحدة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
