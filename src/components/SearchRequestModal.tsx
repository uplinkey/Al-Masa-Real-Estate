import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Sparkles, Building2, MapPin, DollarSign, BedDouble, Layers, Key, ShieldCheck } from 'lucide-react';
import { ClientSearchRequest, CustomerLead } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface SearchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CustomerLead;
  requestToEdit?: ClientSearchRequest | null;
  onSuccess: (updatedReq: ClientSearchRequest, diffInfo?: any) => void;
}

export const SearchRequestModal: React.FC<SearchRequestModalProps> = ({
  isOpen,
  onClose,
  client,
  requestToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<ClientSearchRequest>>({
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    requestTitle: '',
    propertyType: 'شقة',
    purpose: 'سكن',
    budgetMin: 2000000,
    budgetMax: 5000000,
    city: 'القاهرة',
    district: client.preferredDistrict || 'التجمع الخامس',
    subDistrict: '',
    alternativeDistricts: ['المستقبل سيتي', 'مدينة نصر'],
    minArea: 120,
    maxArea: 220,
    minBedrooms: 3,
    minBathrooms: 2,
    preferredFloor: 'متكرر (أول أو ثاني)',
    acceptGroundFloor: true,
    acceptLastFloor: true,
    elevatorRequired: true,
    finishingStatus: 'تشطيب سوبر لوكس',
    legalStatusRequired: 'مرخص ومسجل بالشهر العقاري',
    landShareRequired: true,
    paymentMethod: 'كاش',
    downPaymentMax: 1500000,
    installmentYearsMax: 5,
    urgencyLevel: 'خلال شهر',
    additionalNotes: '',
    status: 'نشط',
  });

  const [altDistrictInput, setAltDistrictInput] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestToEdit) {
      setFormData({
        ...requestToEdit,
      });
    } else {
      setFormData({
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        requestTitle: `طلب ${client.preferredType || 'شقة'} - ${client.preferredDistrict || 'القاهرة'}`,
        propertyType: client.preferredType || 'شقة',
        purpose: 'سكن',
        budgetMin: client.budgetMin || 2000000,
        budgetMax: client.budgetMax || 5000000,
        city: 'القاهرة',
        district: client.preferredDistrict || 'التجمع الخامس',
        subDistrict: '',
        alternativeDistricts: ['المستقبل سيتي', 'مدينة نصر'],
        minArea: 120,
        maxArea: 220,
        minBedrooms: 3,
        minBathrooms: 2,
        preferredFloor: 'متكرر (أول أو ثاني)',
        acceptGroundFloor: true,
        acceptLastFloor: true,
        elevatorRequired: true,
        finishingStatus: 'تشطيب سوبر لوكس',
        legalStatusRequired: 'مرخص ومسجل بالشهر العقاري',
        landShareRequired: true,
        paymentMethod: client.preferredPaymentMethod || 'كاش',
        downPaymentMax: 1500000,
        installmentYearsMax: 5,
        urgencyLevel: 'خلال شهر',
        additionalNotes: '',
        status: 'نشط',
      });
    }
    setError(null);
  }, [requestToEdit, client, isOpen]);

  if (!isOpen) return null;

  // Real-time completeness calculation
  const calculateCompleteness = () => {
    let score = 0;
    const missing: string[] = [];
    if (formData.propertyType) score += 15; else missing.push('نوع العقار');
    if (formData.purpose) score += 10; else missing.push('الغرض');
    if (Number(formData.budgetMax) > 0) score += 20; else missing.push('الحد الأقصى للميزانية');
    if (formData.district) score += 15; else missing.push('المدينة أو الحي');
    if (Number(formData.minArea) > 0 || Number(formData.maxArea) > 0) score += 10; else missing.push('المساحة المطلوبة');
    if (Number(formData.minBedrooms) > 0) score += 10; else missing.push('عدد الغرف');
    if (formData.paymentMethod) score += 10; else missing.push('طريقة الدفع');
    if (formData.urgencyLevel) score += 5; else missing.push('درجة الاستعجال');
    if (formData.finishingStatus) score += 5; else missing.push('حالة التشطيب');
    return { score: Math.min(100, score), missing };
  };

  const { score: completenessScore, missing: missingFields } = calculateCompleteness();

  const handleAddAltDistrict = () => {
    if (!altDistrictInput.trim()) return;
    const current = formData.alternativeDistricts || [];
    if (!current.includes(altDistrictInput.trim())) {
      setFormData({ ...formData, alternativeDistricts: [...current, altDistrictInput.trim()] });
    }
    setAltDistrictInput('');
  };

  const handleRemoveAltDistrict = (dist: string) => {
    const current = formData.alternativeDistricts || [];
    setFormData({ ...formData, alternativeDistricts: current.filter((d) => d !== dist) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.district || !formData.budgetMax) {
      setError('يرجى تحديد الحي المطلوب والحد الأقصى للميزانية على الأقل');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (requestToEdit) {
        const result = await api.updateClientSearchRequest(requestToEdit.id, formData, changeReason);
        onSuccess(result.request, {
          newMatchesCount: result.newMatchesCount,
          removedMatchesCount: result.removedMatchesCount,
          newlyAppearedUnits: result.newlyAppearedUnits,
          droppedUnits: result.droppedUnits,
        });
        toast.success('تم تحديث طلب البحث العقاري بنجاح في قاعدة البيانات');
      } else {
        const created = await api.createClientSearchRequest(formData);
        onSuccess(created);
        toast.success('تم تسجيل طلب البحث العقاري ومطابقة الوحدات بقاعدة البيانات');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ طلب البحث');
      toast.error(err.message || 'فشل حفظ طلب البحث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {requestToEdit ? 'تعديل طلب البحث العقاري ومطابقة التفضيلات' : 'تسجيل طلب بحث عقاري جديد للعميل'}
              </h2>
              <p className="text-xs text-emerald-100">
                العميل: {client.name} · هاتف: {client.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completeness Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              دقة واكتمال بيانات الطلب: {completenessScore}%
            </span>
          </div>
          <div className="w-48 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completenessScore >= 80 ? 'bg-emerald-500' : completenessScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>
          {missingFields.length > 0 && (
            <span className="text-slate-500 text-[11px] truncate max-w-xs">
              ينقص لترشيح أدق: {missingFields.slice(0, 2).join('، ')}
            </span>
          )}
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عنوان مختصر للطلب
              </label>
              <input
                type="text"
                value={formData.requestTitle || ''}
                onChange={(e) => setFormData({ ...formData, requestTitle: e.target.value })}
                placeholder="مثال: شقة 3 غرف في التجمع الخامس للأسرة"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                حالة الطلب
              </label>
              <select
                value={formData.status || 'نشط'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="نشط">نشط (قيد البحث)</option>
                <option value="معلق">معلق مؤقتاً</option>
                <option value="مكتمل بنجاح">مكتمل بنجاح (تم الشراء)</option>
                <option value="ملغي">ملغي بطلب العميل</option>
              </select>
            </div>
          </div>

          {/* Type & Purpose & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نوع العقار
              </label>
              <select
                value={formData.propertyType || 'شقة'}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="شقة">شقة سكنية</option>
                <option value="فيلا">فيلا مستقلة</option>
                <option value="تاون هاوس">تاون هاوس / توين</option>
                <option value="دوبلكس">دوبلكس</option>
                <option value="بنتهاوس">بنتهاوس / رووف</option>
                <option value="محل تجاري">محل تجاري</option>
                <option value="مكتب إداري">مكتب إداري</option>
                <option value="عيادة">عيادة طبية</option>
                <option value="أرض">أرض فضاء / بناء</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الغرض من العقار
              </label>
              <select
                value={formData.purpose || 'سكن'}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="سكن">سكن واستقرار عائلي</option>
                <option value="استثمار">استثمار وإعادة بيع / تأجير</option>
                <option value="تجاري">نشاط تجاري وتشغيل</option>
                <option value="إداري">مقر إداري للشركة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مدى الاستعجال
              </label>
              <select
                value={formData.urgencyLevel || 'خلال شهر'}
                onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="عاجل جداً (خلال أسبوع)">عاجل جداً (خلال أسبوع)</option>
                <option value="خلال شهر">خلال شهر</option>
                <option value="متوسط الاستعجال">متوسط الاستعجال (خلال 3 أشهر)</option>
                <option value="استكشافي">استكشافي ومعرفة الأسعار</option>
              </select>
            </div>
          </div>

          {/* Budget & Payment */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              الميزانية وطريقة السداد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الميزانية الدنيا (ج.م)
                </label>
                <input
                  type="number"
                  value={formData.budgetMin || 0}
                  onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الحد الأقصى للميزانية (ج.م) *
                </label>
                <input
                  type="number"
                  value={formData.budgetMax || 0}
                  onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-emerald-600 dark:text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  طريقة الدفع
                </label>
                <select
                  value={formData.paymentMethod || 'كاش'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="كاش">كاش فوري</option>
                  <option value="تقسيط">تقسيط ومقدم</option>
                  <option value="كاش أو تقسيط">كاش أو تقسيط (مرن)</option>
                </select>
              </div>
            </div>

            {(formData.paymentMethod === 'تقسيط' || formData.paymentMethod === 'كاش أو تقسيط') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الحد الأقصى للمقدم المتاح (ج.م)
                  </label>
                  <input
                    type="number"
                    value={formData.downPaymentMax || ''}
                    onChange={(e) => setFormData({ ...formData, downPaymentMax: Number(e.target.value) })}
                    placeholder="مثال: 1,500,000"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    أقصى مدة تقسيط مقبولة (سنوات)
                  </label>
                  <input
                    type="number"
                    value={formData.installmentYearsMax || ''}
                    onChange={(e) => setFormData({ ...formData, installmentYearsMax: Number(e.target.value) })}
                    placeholder="مثال: 5 سنوات"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Alternative Districts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              الموقع الجغرافي والمناطق البديلة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  المنطقة أو الحي الرئيسي المطلوب *
                </label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="مثال: التجمع الخامس، زايد، المعادي..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الحي الفرعي أو الكومباوند إن وجد
                </label>
                <input
                  type="text"
                  value={formData.subDistrict || ''}
                  onChange={(e) => setFormData({ ...formData, subDistrict: e.target.value })}
                  placeholder="مثال: حي النرجس، بيت الوطن، بالم هيلز..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Alternative districts tags */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                المناطق البديلة المقبولة للعميل
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={altDistrictInput}
                  onChange={(e) => setAltDistrictInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAltDistrict(); } }}
                  placeholder="أدخل منطقة بديلة واضغط إضافة"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddAltDistrict}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  إضافة منطقة
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(formData.alternativeDistricts || []).map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAltDistrict(d)}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Area & Rooms & Floor Specs */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-emerald-600" />
              المساحة والغرف والمواصفات
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  أقل مساحة (م²)
                </label>
                <input
                  type="number"
                  value={formData.minArea || ''}
                  onChange={(e) => setFormData({ ...formData, minArea: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  أقصى مساحة (م²)
                </label>
                <input
                  type="number"
                  value={formData.maxArea || ''}
                  onChange={(e) => setFormData({ ...formData, maxArea: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  أقل عدد غرف
                </label>
                <input
                  type="number"
                  value={formData.minBedrooms || ''}
                  onChange={(e) => setFormData({ ...formData, minBedrooms: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  أقل عدد حمامات
                </label>
                <input
                  type="number"
                  value={formData.minBathrooms || ''}
                  onChange={(e) => setFormData({ ...formData, minBathrooms: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الدور المفضل
                </label>
                <input
                  type="text"
                  value={formData.preferredFloor || ''}
                  onChange={(e) => setFormData({ ...formData, preferredFloor: e.target.value })}
                  placeholder="مثال: متكرر، أول أو ثاني..."
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  حالة التشطيب المطلوبة
                </label>
                <select
                  value={formData.finishingStatus || 'تشطيب سوبر لوكس'}
                  onChange={(e) => setFormData({ ...formData, finishingStatus: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="أي تشطيب">أي تشطيب متاح</option>
                  <option value="تشطيب الترا سوبر لوكس">الترا سوبر لوكس</option>
                  <option value="تشطيب سوبر لوكس">تشطيب سوبر لوكس</option>
                  <option value="نصف تشطيب">نصف تشطيب (محارة وحلوق)</option>
                  <option value="بدون تشطيب">بدون تشطيب (على الطوب)</option>
                </select>
              </div>
            </div>

            {/* Checkbox preferences */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(formData.elevatorRequired)}
                  onChange={(e) => setFormData({ ...formData, elevatorRequired: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>يلزم وجود أسانسير</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(formData.acceptGroundFloor)}
                  onChange={(e) => setFormData({ ...formData, acceptGroundFloor: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>يقبل الدور الأرضي</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(formData.acceptLastFloor)}
                  onChange={(e) => setFormData({ ...formData, acceptLastFloor: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>يقبل الدور الأخير / رووف</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(formData.landShareRequired)}
                  onChange={(e) => setFormData({ ...formData, landShareRequired: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>يلزم حصة بالأرض</span>
              </label>
            </div>
          </div>

          {/* If Editing: Ask for Change Reason */}
          {requestToEdit && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                سبب التعديل (لتوثيق المقارنة وسجل التغييرات)
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="مثال: زيادة الميزانية بموافقة العميل بعد إطلاعه على أسعار السوق"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات وشروط خاصة بالعميل
            </label>
            <textarea
              rows={2}
              value={formData.additionalNotes || ''}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="مثال: يفضل واجهة بحرية، لا يرغب في شارع رئيسي مزدحم، جاهز لمعاينة نهاية الأسبوع..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>جار الحفظ والترشيح...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{requestToEdit ? 'حفظ التعديلات وإعادة المطابقة' : 'تسجيل الطلب وتشغيل المطابقة'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
