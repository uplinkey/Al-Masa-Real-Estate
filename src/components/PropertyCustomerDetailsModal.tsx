import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Share2,
  Heart,
  Scale,
  MessageCircle,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Car,
  Trees,
  Waves,
  Armchair,
  Check,
  Sparkles,
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Property, PropertyViewing, NearbyPlace } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Bus,
  Coffee,
  Landmark,
  ShieldAlert,
} from 'lucide-react';

interface PropertyCustomerDetailsModalProps {
  property: Property | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (propertyId: string) => void;
  isInComparison: boolean;
  onToggleComparison: (property: Property) => void;
  onOpenShareModal: (property: Property) => void;
  onBookViewing: (viewingData: {
    propertyId: string;
    propertyTitle: string;
    propertyCode: string;
    clientName: string;
    clientPhone: string;
    viewingDate: string;
    viewingTime: string;
    notes?: string;
  }) => void;
}

export const PropertyCustomerDetailsModal: React.FC<PropertyCustomerDetailsModalProps> = ({
  property,
  onClose,
  isFavorite,
  onToggleFavorite,
  isInComparison,
  onToggleComparison,
  onOpenShareModal,
  onBookViewing,
}) => {
  if (!property) return null;

  // Active Tab: 'details' | 'calculator' | 'booking'
  const [activeTab, setActiveTab] = useState<'details' | 'calculator' | 'booking'>('details');

  // Image Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [viewingDate, setViewingDate] = useState(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [viewingTime, setViewingTime] = useState('04:30 مساءً');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Smart Property Location Intelligence State
  const [locationIntel, setLocationIntel] = useState<any>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState<boolean>(false);

  useEffect(() => {
    if (!property?.id) return;
    let isMounted = true;
    setIsLoadingIntel(true);
    api.getPropertyLocationIntelligence(property.id)
      .then((data) => {
        if (isMounted && data) {
          setLocationIntel(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load location intelligence for property:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingIntel(false);
      });
    return () => {
      isMounted = false;
    };
  }, [property?.id]);

  // Custom Installment Calculator State
  const [downPaymentPct, setDownPaymentPct] = useState(15); // 15%
  const [years, setYears] = useState(5); // 5 years
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'quarterly'>('quarterly');

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  // Calculations
  const totalPrice = property.price;
  const pricePerMeter = Math.round(totalPrice / (property.areaSqM || 1));
  const downPaymentAmount = Math.round((totalPrice * downPaymentPct) / 100);
  const remainingAmount = totalPrice - downPaymentAmount;
  const maintenanceDeposit = Math.round(totalPrice * 0.08); // 8% maintenance

  const totalInstallments = years * (paymentFrequency === 'monthly' ? 12 : 4);
  const installmentAmount = Math.round(remainingAmount / totalInstallments);

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    onBookViewing({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyCode: property.code,
      clientName,
      clientPhone,
      viewingDate,
      viewingTime,
      notes: bookingNotes,
    });

    setBookingSuccess(true);
  };

  const handleDirectWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً شركة الماسة للتسويق العقاري،\nأنا مهتم بمعاينة العقار كود [${property.code}]:\n${property.title}\nالموقع: ${property.district} - ${property.city}\nالسعر: ${formatEGP(property.price)}\nأود الاستفسار عن التفاصيل وترتيب موعد للمعاينة.`
    );
    window.open(`https://wa.me/201000000000?text=${text}`, '_blank');
  };

  const handlePrintBrochure = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl">
              كود الوحدة: {property.code}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${
              property.status === 'متاح'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : property.status === 'محجوز'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {property.status}
            </span>
          </div>

          {/* Quick Actions (Favorite, Compare, Share, Print, Close) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(property.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400'
              }`}
              title={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onToggleComparison(property)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isInComparison
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-blue-400'
              }`}
              title={isInComparison ? 'في المقارنة' : 'إضافة للمقارنة'}
            >
              <Scale className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenShareModal(property)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
              title="مشاركة العقار"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrintBrochure}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer hidden sm:flex"
              title="طباعة بروشور العقار"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Title & Price Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {property.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">{property.district} - {property.city}، {property.governorate}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-amber-400 border border-amber-500/30">
                  موقع تقريبي بالحي لحماية خصوصية المالك
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">
                {property.purpose === 'إيجار' ? 'قيمة الإيجار' : 'السعر الإجمالي'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {formatEGP(property.price)}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                سعر المتر: <strong className="text-slate-200">{formatEGP(pricePerMeter)}</strong> {property.negotiable && '• قابل للتفاوض'}
              </div>
            </div>
          </div>

          {/* Interactive Photo Gallery with Carousel */}
          <div className="space-y-3">
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
              <img
                src={images[currentImageIndex]}
                alt={`${property.title} - صورة ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter & Fullscreen Hint */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-bold text-slate-200 border border-slate-700">
                {currentImageIndex + 1} / {images.length}
              </div>

              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>معاينة حقيقية موثقة</span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      currentImageIndex === idx
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Tabs Header */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>مواصفات العقار والمزايا</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>حاسبة السداد والأقساط</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'booking'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>احجز موعد معاينتك 🚗</span>
            </button>
          </div>

          {/* TAB 1: DETAILS & AMENITIES */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Key Specs Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">المساحة الإجمالية</span>
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-base">
                    <Maximize2 className="w-4 h-4" />
                    <span>{property.areaSqM} م²</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">غرف النوم</span>
                  <div className="flex items-center gap-1.5 text-blue-400 font-black text-base">
                    <Bed className="w-4 h-4" />
                    <span>{property.bedrooms} غرف</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">الحمامات</span>
                  <div className="flex items-center gap-1.5 text-purple-400 font-black text-base">
                    <Bath className="w-4 h-4" />
                    <span>{property.bathrooms} حمام</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">حالة التشطيب</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="truncate">{property.finishing || 'سوبر لوكس'}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Specs: Floor, Type, Purpose */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">نوع العقار:</span>
                  <strong className="text-white text-sm">{property.type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">الغرض:</span>
                  <strong className="text-amber-400 text-sm">{property.purpose}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">رقم الطابق:</span>
                  <strong className="text-white text-sm">
                    {property.floor === 0 ? 'أرضي' : `الطابق ${property.floor}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">المنطقة والمدينة:</span>
                  <strong className="text-white text-sm">{property.district}</strong>
                </div>
              </div>

              {/* Amenities & Features Badges */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>المرافق والتجهيزات المتاحة</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    property.parking ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-950/40 border-slate-800/40 text-slate-500 line-through'
                  }`}>
                    <Car className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>موقف سيارات خاص (باكية)</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    property.garden ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-950/40 border-slate-800/40 text-slate-500 line-through'
                  }`}>
                    <Trees className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حديقة خاصة</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    property.pool ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-950/40 border-slate-800/40 text-slate-500 line-through'
                  }`}>
                    <Waves className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>حمام سباحة خاص</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    property.furniture ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                  }`}>
                    <Armchair className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{property.furniture ? 'مفروش بالكامل' : 'غير مفروش'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-slate-800/80 border-slate-700 text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>أمن وحراسة 24 ساعة</span>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-slate-800/80 border-slate-700 text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>مصعد كهربائي مستورد</span>
                  </div>
                </div>
              </div>

              {/* Smart Property Location Intelligence (التحليل الجغرافي والخدمات المحيطة) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">التحليل الجغرافي الذكي والخدمات المحيطة</h4>
                      <p className="text-[11px] text-slate-400">
                        اكتشاف أهم المعالم والخدمات الحيوية بالقرب من موقع الوحدة
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    معتمد تسويقياً ✓
                  </span>
                </div>

                {/* Approved Marketing Location Description */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-amber-400 block text-xs">
                    الوصف الجغرافي المعتمد للوحدة:
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs font-medium">
                    {locationIntel?.finalApprovedDescriptionAr ||
                      locationIntel?.reviewedDescriptionAr ||
                      locationIntel?.autoGeneratedDescriptionAr ||
                      `يتميز هذا الـ(${property.type}) بموقع استراتيجي راقٍ في ${property.district}، محاطاً بمنظومة متكاملة من الخدمات الأساسية والتعليمية والتجارية مع سهولة الوصول لأهم المحاور الرئيسية.`}
                  </p>
                </div>

                {/* Nearby Services Displayed by Category (Selected for Publishing) */}
                {locationIntel?.places && locationIntel.places.filter((p: any) => p.selectedForPublishing !== false).length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      أبرز الخدمات والمعالم الحيوية في محيط العقار:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {locationIntel.places
                        .filter((p: any) => p.selectedForPublishing !== false)
                        .slice(0, 9)
                        .map((place: any) => {
                          const getCategoryIcon = (cat: string) => {
                            switch (cat) {
                              case 'تعليم': return <GraduationCap className="w-3.5 h-3.5 text-blue-400" />;
                              case 'صحة': return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
                              case 'تسوق': return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
                              case 'مواصلات': return <Bus className="w-3.5 h-3.5 text-emerald-400" />;
                              case 'ترفيه': return <Coffee className="w-3.5 h-3.5 text-purple-400" />;
                              default: return <Landmark className="w-3.5 h-3.5 text-cyan-400" />;
                            }
                          };

                          return (
                            <div
                              key={place.id || place.name}
                              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                            >
                              <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 shrink-0 mt-0.5">
                                {getCategoryIcon(place.category)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-white text-[11px] truncate">{place.name}</h5>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                  <span className="text-amber-400/90 font-medium">{place.type || place.category}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-semibold">{place.distanceFormatted}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  /* Curated Preview based on District when not yet custom-analyzed */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white text-[11px]">مدارس وجامعات دولية</p>
                        <p className="text-[10px] text-slate-400">على بعد 3 - 7 دقائق</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white text-[11px]">مستشفيات ومراكز طبية</p>
                        <p className="text-[10px] text-slate-400">طوارئ وخدمة 24 ساعة</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white text-[11px]">مولات وهايبر ماركت</p>
                        <p className="text-[10px] text-slate-400">مراكز تسوق وترفيه كبرى</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Assurance Card - Strict Privacy Enforcement */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-400">ضمان خصوصية موقع العقار الفعلي:</span>
                    <p className="text-slate-400 leading-normal">
                      نعرض نطاق الخدمات المحيطة والحي العام لحرصنا التام على أمان وخصوصية المالك. يتم تزويدكم بعنوان العقار التفصيلي وتنسيق المعاينة الميدانية بدقة من خلال المستشار العقاري المعتمد فقط.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM PAYMENT & INSTALLMENT CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-white text-sm">حاسبة خطة السداد المرنة</h3>
                    <p className="text-xs text-slate-400">حدد نسبة المقدم ومدة التقسيط لحساب الأقساط بدقة للوحدة</p>
                  </div>
                  <span className="text-lg font-black text-amber-400">{formatEGP(totalPrice)}</span>
                </div>

                {/* Down payment slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">نسبة الدفعة المقدمة:</span>
                    <strong className="text-amber-400 text-sm">{downPaymentPct}% ({formatEGP(downPaymentAmount)})</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>10% مقدم</span>
                    <span>20%</span>
                    <span>30%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Years Selector */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-300 block">مدة التقسيط:</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 3, 5, 7, 8].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYears(y)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          years === y
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {y} {y === 1 ? 'سنة' : 'سنوات'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency selector: Monthly vs Quarterly */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-300 block">دورية دفع القسط:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentFrequency('quarterly')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        paymentFrequency === 'quarterly'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      أقساط ربع سنوية (كل 3 شهور) - الخيار الأكثر طلباً
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentFrequency('monthly')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        paymentFrequency === 'monthly'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      أقساط شهرية متساوية
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 space-y-3">
                <span className="text-xs font-black text-amber-400 block border-b border-slate-800 pb-2">
                  جدول السداد المتوقع للوحدة:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الدفعة المقدمة ({downPaymentPct}%):</span>
                    <strong className="text-base font-black text-emerald-400">{formatEGP(downPaymentAmount)}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">
                      القسط {paymentFrequency === 'quarterly' ? 'الربع سنوي' : 'الشهري'}:
                    </span>
                    <strong className="text-base font-black text-amber-400">{formatEGP(installmentAmount)}</strong>
                    <span className="text-[10px] text-slate-500 block">إجمالي {totalInstallments} قسط متساوي</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">وديعة الصيانة (8% عند الاستلام):</span>
                    <strong className="text-base font-black text-blue-400">{formatEGP(maintenanceDeposit)}</strong>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    أعجبك النظام؟ احجز موعد المعاينة الآن 👈
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SELF-SERVICE VIEWING BOOKING */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              {bookingSuccess ? (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-white">تم تأكيد حجز موعد المعاينة بنجاح! 🎉</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    أهلاً بك أ. {clientName}، تم إدراج موعد معاينة العقار ({property.code}) في تقويم المبيعات ليوم <strong>{viewingDate}</strong> الساعة <strong>{viewingTime}</strong>.
                    سيتواصل معك المستشار العقاري والسائق لتأكيد موقع اللقاء.
                  </p>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleDirectWhatsApp}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:bg-emerald-400 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تأكيد عبر واتساب مع المبيعات</span>
                    </button>
                    <button
                      onClick={() => setBookingSuccess(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                    >
                      حجز موعد آخر
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <strong className="text-amber-400 block mb-1">خدمة المعاينة المجانية من شركة الماسة 🚗</strong>
                    <p className="text-slate-300 leading-relaxed">
                      نوفر سيارة خاصة وسائق ومستشاراً عقارياً لمرافقتكم ومعاينة الوحدة على أرض الواقع ومراجعة المستندات الرسمية بدون أي رسوم.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اسم العميل بالكامل *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="مثال: د. هاني الجوهري"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (واتساب) *</label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="01012345678"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ المعاينة المفضل *</label>
                      <input
                        type="date"
                        required
                        value={viewingDate}
                        onChange={(e) => setViewingDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">التوقيت المفضل *</label>
                      <select
                        value={viewingTime}
                        onChange={(e) => setViewingTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="11:00 صباحاً">11:00 صباحاً (جولة صباحية)</option>
                        <option value="02:00 مساءً">02:00 مساءً (بعد الظهيرة)</option>
                        <option value="04:30 مساءً">04:30 مساءً (وقت الغروب)</option>
                        <option value="06:30 مساءً">06:30 مساءً (جولة مسائية)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات إضافية أو استفسارات خاصة</label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="مثال: يفضل لقاء المندوب أمام بوابة الكمبوند رقم 2"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      رجوع للمواصفات
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد حجز المعاينة الفورية</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDirectWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تحدث مع المستشار عبر واتساب</span>
            </button>

            <a
              href="tel:01000000000"
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>اتصال هاتفي</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'booking' && (
              <button
                onClick={() => setActiveTab('booking')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                احجز موعد معاينة الآن 🚗
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
