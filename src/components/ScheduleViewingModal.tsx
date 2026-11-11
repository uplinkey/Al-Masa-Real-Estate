import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Car, ShieldAlert, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Property, CustomerLead, PropertyViewing } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface ScheduleViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: CustomerLead;
  initialProperty?: Property | any;
  allProperties?: Property[];
  currentUser?: { id: string; name: string; role: string };
  onSuccess: (viewing: PropertyViewing) => void;
}

export const ScheduleViewingModal: React.FC<ScheduleViewingModalProps> = ({
  isOpen,
  onClose,
  client,
  initialProperty,
  allProperties = [],
  currentUser,
  onSuccess,
}) => {
  const [internalProperties, setInternalProperties] = useState<Property[]>(allProperties || []);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialProperty?.propertyId || initialProperty?.id || (allProperties && allProperties[0]?.id) || ''
  );

  useEffect(() => {
    if (allProperties && allProperties.length > 0) {
      setInternalProperties(allProperties);
      if (!selectedPropertyId) {
        setSelectedPropertyId(initialProperty?.propertyId || initialProperty?.id || allProperties[0]?.id || '');
      }
    } else {
      api.getProperties()
        .then((props) => {
          if (props && props.length > 0) {
            setInternalProperties(props);
            setSelectedPropertyId((prev) => prev || initialProperty?.propertyId || initialProperty?.id || props[0]?.id || '');
          }
        })
        .catch(() => {});
    }
  }, [allProperties, initialProperty]);

  const effectiveProperties = internalProperties.length > 0 ? internalProperties : (allProperties || []);

  const [additionalPropertyIds, setAdditionalPropertyIds] = useState<string[]>([]);
  const [viewingDate, setViewingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewingTime, setViewingTime] = useState<string>('15:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [meetingPoint, setMeetingPoint] = useState<string>('أمام مقر شركة الماسة للتسويق العقاري');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [agentName, setAgentName] = useState<string>(client?.assignedAgentName || currentUser?.name || 'محمد سامي');
  const [driverName, setDriverName] = useState<string>('عم إبراهيم');
  const [vehicle, setVehicle] = useState<string>('تويوتا فورتشنر');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMainProperty = effectiveProperties.find((p) => p.id === selectedPropertyId) || initialProperty;

  const handleAddTourProperty = (propId: string) => {
    if (propId && !additionalPropertyIds.includes(propId) && propId !== selectedPropertyId) {
      setAdditionalPropertyIds([...additionalPropertyIds, propId]);
    }
  };

  const handleRemoveTourProperty = (propId: string) => {
    setAdditionalPropertyIds(additionalPropertyIds.filter((id) => id !== propId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setError('يرجى اختيار عقار رئيسي للمعاينة');
      return;
    }

    setLoading(true);
    setError(null);

    const tourUnitTitles = [
      currentMainProperty?.title || 'عقار رئيسي',
      ...additionalPropertyIds.map((id) => effectiveProperties.find((p) => p.id === id)?.title || id),
    ];

    try {
      const created = await api.createViewing({
        propertyId: selectedPropertyId,
        propertyTitle: currentMainProperty?.title || '',
        propertyCode: currentMainProperty?.code || '',
        clientId: client?.id || '',
        clientName: client?.name || 'عميل',
        clientPhone: client?.phone || '',
        clientSource: client?.leadSource || 'مباشر',
        agentName,
        driverName,
        vehicle,
        meetingPoint,
        durationMinutes,
        multiUnitIds: [selectedPropertyId, ...additionalPropertyIds],
        multiUnitTitles: tourUnitTitles,
        viewingDate,
        viewingTime,
        locationAddress: locationAddress || currentMainProperty?.district || 'موقع العقار',
        status: 'مجدولة',
        customerFeedback: notes,
      });

      onSuccess(created);
      toast.success(`تم حجز وجدولة المعاينة الميدانية بنجاح وتوثيقها في قاعدة البيانات`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل جدولة المعاينة');
      toast.error(err.message || 'فشل جدولة المعاينة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base font-bold">جدولة معاينة ميدانية مرافقة</h2>
              <p className="text-xs text-blue-100">
                العميل: {client?.name || 'غير محدد'} · هاتف: {client?.phone || 'غير محدد'}
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

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Property */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              العقار الرئيسي للمعاينة *
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              {effectiveProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title} ({p.district}) - {p.price?.toLocaleString?.() || p.price} ج.م [{p.availabilityStatus || 'متاح'}]
                </option>
              ))}
            </select>
          </div>

          {/* Tour / Multi-Unit additions */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                جولة تشمل أكثر من وحدة (Multi-Unit Viewing Tour)
              </span>
              <span className="text-[11px] text-slate-500">
                إجمالي الوحدات في الجولة: {1 + additionalPropertyIds.length}
              </span>
            </div>

            <div className="flex gap-2 mb-2">
              <select
                id="tour-select"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddTourProperty(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>
                  + اختر وحدة إضافية لضمها للجولة
                </option>
                {effectiveProperties
                  .filter((p) => p.id !== selectedPropertyId && !additionalPropertyIds.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.title} ({p.district})
                    </option>
                  ))}
              </select>
            </div>

            {additionalPropertyIds.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {additionalPropertyIds.map((id) => {
                  const p = effectiveProperties.find((item) => item.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200"
                    >
                      <span>{p?.code} - {p?.title} ({p?.district})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTourProperty(id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاريخ المعاينة *
              </label>
              <input
                type="date"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                وقت المعاينة *
              </label>
              <input
                type="time"
                value={viewingTime}
                onChange={(e) => setViewingTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                المدة المتوقعة
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={30}>30 دقيقة</option>
                <option value={45}>45 دقيقة</option>
                <option value={60}>ساعة واحدة</option>
                <option value={90}>ساعة ونصف (جولة متعددة)</option>
                <option value={120}>ساعتان</option>
              </select>
            </div>
          </div>

          {/* Meeting Point & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نقطة التجمع والانطلاق
              </label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="أمام مقر الشركة / نقطة متفق عليها"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عنوان وموقع العقار
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder={currentMainProperty?.district || 'موقع العقار'}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Consultant & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                المستشار العقاري المسؤول
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                السائق المرافق
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                سيارة المعاينة
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات وتوجيهات خاصة بالمعاينة
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: العميل يحضر بصحبة زوجته، التركيز على تشطيب المطبخ والإطلالة..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
            🛡️ يفحص النظام جدول المستشار آلياً لمنع أي تعارض في المواعيد، كما يربط المعاينة بمصدر العميل لحساب العمولات.
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'جار التأكيد...' : 'تأكيد وحجز المعاينة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
