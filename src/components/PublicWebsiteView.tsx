import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  MapPin,
  Bed,
  Bath,
  Calculator,
  Shield,
  Award,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  Share2,
  Heart,
  Scale,
  Calendar,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  MessageCircle,
  Eye,
  Check,
  X,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { Property, PropertyType, FinishingType } from '../types';
import { SharePropertyModal } from './SharePropertyModal';
import { PropertyCustomerDetailsModal } from './PropertyCustomerDetailsModal';
import { PropertyComparisonModal } from './PropertyComparisonModal';
import { RequestCallbackModal } from './RequestCallbackModal';
import { MapLocationPicker } from './MapLocationPicker';

interface PublicWebsiteViewProps {
  properties: Property[];
  onOpenPropertyDetails?: (property: Property) => void;
  onBookViewing?: (data: {
    propertyId: string;
    propertyTitle: string;
    propertyCode: string;
    clientName: string;
    clientPhone: string;
    viewingDate: string;
    viewingTime: string;
    notes?: string;
  }) => void;
  onRequestCallback?: (data: { name: string; phone: string; preferredTime: string; notes?: string }) => void;
  onAddOwnerListing?: (ownerData: any) => void;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  properties,
  onOpenPropertyDetails,
  onBookViewing,
  onRequestCallback,
  onAddOwnerListing,
}) => {
  // Modal states
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<Property | null>(null);
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [showCallbackModal, setShowCallbackModal] = useState<boolean>(false);
  const [callbackPropertyCode, setCallbackPropertyCode] = useState<string>('');
  const [showSubmitOwnerModal, setShowSubmitOwnerModal] = useState<boolean>(false);
  const [ownerSubmitSuccess, setOwnerSubmitSuccess] = useState<boolean>(false);

  // Favorites / Wishlist state (persisted in localStorage)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('almasa_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Comparison State (up to 3 properties)
  const [comparisonPropertyIds, setComparisonPropertyIds] = useState<string[]>([]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [minBedrooms, setMinBedrooms] = useState<string>('all');
  const [finishingFilter, setFinishingFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000000);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'area-desc'>('default');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // General Mortgage Calculator state
  const [mortgagePrice, setMortgagePrice] = useState<number>(6500000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [loanYears, setLoanYears] = useState<number>(10);
  const [interestRate, setInterestRate] = useState<number>(14);

  // Owner form state
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPropertyDetails, setOwnerPropertyDetails] = useState('');
  const [ownerLat, setOwnerLat] = useState<number>(30.0275);
  const [ownerLng, setOwnerLng] = useState<number>(31.4721);
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [ownerDistrict, setOwnerDistrict] = useState<string>('التجمع الخامس');
  const [ownerNearbyCount, setOwnerNearbyCount] = useState<number>(0);

  // Persist Favorites
  useEffect(() => {
    try {
      localStorage.setItem('almasa_favorites', JSON.stringify(favoriteIds));
    } catch {
      // Ignore
    }
  }, [favoriteIds]);

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const toggleComparison = (property: Property) => {
    setComparisonPropertyIds((prev) => {
      if (prev.includes(property.id)) {
        return prev.filter((id) => id !== property.id);
      }
      if (prev.length >= 3) {
        // limit to 3 properties
        return [prev[1], prev[2], property.id];
      }
      return [...prev, property.id];
    });
  };

  const comparisonProperties = useMemo(() => {
    return properties.filter((p) => comparisonPropertyIds.includes(p.id));
  }, [properties, comparisonPropertyIds]);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  // Activity stats
  const totalSold = properties.filter((p) => p.status === 'تم البيع' || p.status === 'مباع').length;
  const totalRented = properties.filter((p) => p.status === 'تم التأجير').length;
  const totalAvailable = properties.filter((p) => p.status === 'متاح').length;

  // Extract districts
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set);
  }, [properties]);

  // Filtered Properties
  const displayedProperties = useMemo(() => {
    const list = properties.filter((p) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.title?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status / Wishlist tab filter
      if (statusFilter === 'المفضلة') {
        if (!favoriteIds.includes(p.id)) return false;
      } else if (statusFilter === 'متاح') {
        if (p.status !== 'متاح') return false;
      } else if (statusFilter === 'تم البيع') {
        if (p.status !== 'تم البيع' && p.status !== 'مباع') return false;
      } else if (statusFilter === 'تم التأجير') {
        if (p.status !== 'تم التأجير') return false;
      }

      // District
      if (districtFilter !== 'all' && p.district !== districtFilter) return false;

      // Type
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;

      // Bedrooms
      if (minBedrooms !== 'all') {
        const req = parseInt(minBedrooms, 10);
        if (p.bedrooms < req) return false;
      }

      // Finishing
      if (finishingFilter !== 'all' && p.finishing !== finishingFilter) return false;

      // Price range
      if (minPrice > 0 && p.price < minPrice) return false;
      if (maxPrice > 0 && p.price > maxPrice) return false;

      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'area-desc') {
      return [...list].sort((a, b) => (b.areaSqM || 0) - (a.areaSqM || 0));
    }

    return list;
  }, [
    properties,
    searchQuery,
    statusFilter,
    favoriteIds,
    districtFilter,
    typeFilter,
    minBedrooms,
    finishingFilter,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Mortgage calculations
  const downPaymentAmount = (mortgagePrice * downPaymentPct) / 100;
  const loanPrincipal = mortgagePrice - downPaymentAmount;
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalMonths = loanYears * 12;

  const monthlyPayment =
    loanPrincipal > 0
      ? Math.round(
          (loanPrincipal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths))) /
            (Math.pow(1 + monthlyInterestRate, totalMonths) - 1)
        )
      : 0;

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerPhone) return;

    if (onAddOwnerListing) {
      onAddOwnerListing({
        name: ownerName,
        phones: [ownerPhone],
        address: `${ownerDistrict} - ${ownerAddress || 'الموقع محدد على الخريطة'}`,
        notes: `${ownerPropertyDetails}\n[الموقع المحدد: ${ownerDistrict} - ${ownerAddress || ''} | إحداثيات: (${ownerLat.toFixed(4)}, ${ownerLng.toFixed(4)}) | خدمات محيطة مكتشفة: ${ownerNearbyCount} معلم]`,
      });
    }

    setOwnerSubmitSuccess(true);
    setTimeout(() => {
      setShowSubmitOwnerModal(false);
      setOwnerSubmitSuccess(false);
      setOwnerName('');
      setOwnerPhone('');
      setOwnerPropertyDetails('');
    }, 2500);
  };

  const handleBookingFromDetails = (bookingData: any) => {
    if (onBookViewing) {
      onBookViewing(bookingData);
    }
  };

  const handleCallbackSubmit = (data: any) => {
    if (onRequestCallback) {
      onRequestCallback(data);
    }
  };

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Luxury Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 overflow-hidden p-8 sm:p-12 text-center shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
            الشركة الرائدة في التسويق العقاري بمصر 🇪🇬
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            الماسة للتسويق العقاري <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
              رفاهية السكن وأمان الاستثمار
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            تصفح وحجز أرقى العقارات في التجمع الخامس، الشيخ زايد، العاصمة الإدارية والساحل الشمالي مع إمكانية جدولة المعاينات الميدانية فوراً.
          </p>

          {/* Business Activity & Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{totalAvailable} عقار متاح الآن</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
              <span>🎉</span>
              <span>{totalSold} صفقة بيع مكتملة</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <span>🔑</span>
              <span>{totalRented} عقد إيجار مغلق</span>
            </div>
            {favoriteIds.length > 0 && (
              <button
                onClick={() => setStatusFilter('المفضلة')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/30"
              >
                <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
                <span>لديك {favoriteIds.length} عقارات مفضلة</span>
              </button>
            )}
          </div>

          {/* Quick Search Bar */}
          <div className="pt-3 max-w-2xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالمنطقة، الكمبوند، أو نوع الوحدة (مثال: شقة التجمع، فيلا زايد، ALM-1001)..."
                  className="w-full pr-11 pl-4 py-3.5 text-xs bg-slate-950/95 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xl"
                />
              </div>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  showAdvancedFilters
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فلاتر متقدمة</span>
              </button>
            </div>

            {/* Quick Actions Links */}
            <div className="flex items-center justify-center gap-5 text-xs pt-1">
              <button
                onClick={() => setShowSubmitOwnerModal(true)}
                className="text-amber-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <span>+ اعرض عقارك معنا كمالك</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => {
                  setCallbackPropertyCode('');
                  setShowCallbackModal(true);
                }}
                className="text-emerald-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>طلب اتصال هاتفي فوري</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvancedFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>تخصيص معايير البحث الدقيقة</span>
            </h3>

            <button
              onClick={() => {
                setDistrictFilter('all');
                setTypeFilter('all');
                setMinBedrooms('all');
                setFinishingFilter('all');
                setMinPrice(0);
                setMaxPrice(50000000);
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* District Filter */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">المنطقة والحي:</label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">كل المناطق والأحياء</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">نوع العقار:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="شقة">شقة سكنية</option>
                <option value="فيلا">فيلا مستقلة</option>
                <option value="تاون هاوس">تاون هاوس</option>
                <option value="بنتهاوس">بنتهاوس</option>
                <option value="دوبلكس">دوبلكس</option>
                <option value="مكتب إداري">مكتب إداري</option>
                <option value="محل تجاري">محل تجاري</option>
              </select>
            </div>

            {/* Bedrooms Filter */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">عدد الغرف الأدنى:</label>
              <select
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">أي عدد غرف</option>
                <option value="1">غرفة واحدة فأكثر</option>
                <option value="2">غرفتان فأكثر (2+)</option>
                <option value="3">3 غرف فأكثر (3+)</option>
                <option value="4">4 غرف فأكثر (4+)</option>
              </select>
            </div>

            {/* Finishing Filter */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">مستوى التشطيب:</label>
              <select
                value={finishingFilter}
                onChange={(e) => setFinishingFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">جميع مستويات التشطيب</option>
                <option value="سوبر لوكس">سوبر لوكس</option>
                <option value="ألترا لوكس">ألترا لوكس</option>
                <option value="تشطيب كامل">تشطيب كامل</option>
                <option value="نصف تشطيب">نصف تشطيب</option>
                <option value="بدون تشطيب">بدون تشطيب</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Featured Properties Section with Tabs & View Controls */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>معرض العقارات المتاحة والصفقات</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              عرض {displayedProperties.length} من أصل {properties.length} عقار متوفر
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Tabs (Including Favorites) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
              {[
                { id: 'الكل', label: `الكل (${properties.length})` },
                { id: 'متاح', label: `متاح (${totalAvailable})` },
                { id: 'تم البيع', label: `تم البيع 🎉 (${totalSold})` },
                { id: 'تم التأجير', label: `تم التأجير 🔑 (${totalRented})` },
                {
                  id: 'المفضلة',
                  label: `المفضلة ❤️ (${favoriteIds.length})`,
                  activeClass: 'bg-rose-600 text-white shadow-md font-black',
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? tab.activeClass || 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort & Layout Mode */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="default" className="bg-slate-900">الترتيب الافتراضي</option>
                  <option value="price-asc" className="bg-slate-900">الأقل سعراً أولاً</option>
                  <option value="price-desc" className="bg-slate-900">الأعلى سعراً أولاً</option>
                  <option value="area-desc" className="bg-slate-900">الأكبر مساحة أولاً</option>
                </select>
              </div>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    layoutMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    layoutMode === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="عرض قائمة"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Listings */}
        {displayedProperties.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">لا توجد عقارات مطابقة لمعايير البحث حالياً</h3>
            <p className="text-xs text-slate-400">
              جرب تغيير المنطقة، توسيع نطاق السعر، أو مسح خانة البحث.
            </p>
            {statusFilter === 'المفضلة' && (
              <p className="text-xs text-rose-300">
                لم تقم بإضافة عقارات لقائمتك المفضلة بعد. انقر على أيقونة القلب على أي عقار لإضافته!
              </p>
            )}
          </div>
        ) : (
          <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {displayedProperties.map((property) => {
              const isSold = property.status === 'تم البيع' || property.status === 'مباع';
              const isRented = property.status === 'تم التأجير';
              const isReserved = property.status === 'محجوز';
              const isFav = favoriteIds.includes(property.id);
              const isComp = comparisonPropertyIds.includes(property.id);

              return (
                <div
                  key={property.id}
                  onClick={() => setSelectedPropertyForDetails(property)}
                  className={`group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:border-amber-500/50 hover:shadow-2xl transition-all cursor-pointer flex ${
                    layoutMode === 'grid' ? 'flex-col justify-between' : 'flex-col sm:flex-row'
                  }`}
                >
                  {/* Property Image & Overlays */}
                  <div className={`relative bg-slate-950 overflow-hidden shrink-0 ${
                    layoutMode === 'grid' ? 'h-56' : 'sm:w-72 h-52 sm:h-auto'
                  }`}>
                    <img
                      src={property.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
                      alt={property.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        isSold || isRented ? 'filter brightness-90' : ''
                      }`}
                    />

                    {/* Code & Status Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <span className="px-2.5 py-1 text-xs font-bold bg-slate-950/90 backdrop-blur-md text-amber-400 rounded-xl border border-amber-500/30">
                        {property.code}
                      </span>
                      {isSold ? (
                        <span className="px-2.5 py-1 text-xs font-black bg-rose-600 text-white rounded-xl shadow-lg border border-rose-400/40">
                          🎉 تم البيع
                        </span>
                      ) : isRented ? (
                        <span className="px-2.5 py-1 text-xs font-black bg-purple-600 text-white rounded-xl shadow-lg border border-purple-400/40">
                          🔑 تم التأجير
                        </span>
                      ) : isReserved ? (
                        <span className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-slate-950 rounded-xl shadow-lg">
                          ⏳ محجوز
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-lg">
                          متاح للعرض
                        </span>
                      )}
                    </div>

                    {/* Quick Action Overlays (Heart & Compare) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(property.id);
                        }}
                        className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                          isFav
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'bg-slate-950/70 text-slate-300 hover:text-rose-400 hover:bg-slate-950'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComparison(property);
                        }}
                        className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                          isComp
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-950/70 text-slate-300 hover:text-blue-400 hover:bg-slate-950'
                        }`}
                        title={isComp ? 'في المقارنة' : 'إضافة للمقارنة'}
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Closed Deals Overlay Stamp */}
                    {(isSold || isRented) && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                        <div className={`px-4 py-2 rounded-2xl border-2 font-black text-sm tracking-wider shadow-2xl transform -rotate-6 text-center ${
                          isSold
                            ? 'border-rose-500 bg-rose-950/90 text-rose-200'
                            : 'border-purple-500 bg-purple-950/90 text-purple-200'
                        }`}>
                          {isSold ? '🎉 صفقة ناجحة - تم البيع' : '🔑 تم التأجير بواسطة الماسة'}
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-white font-bold bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
                      <span>{property.type} • {property.purpose}</span>
                      <span className="text-amber-400">{property.areaSqM} م²</span>
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                        {property.title}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{property.district} - {property.city}</span>
                      </div>
                    </div>

                    {/* Specs snippet */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 block">الغرف</span>
                        <strong className="text-white flex items-center justify-center gap-1 mt-0.5">
                          <Bed className="w-3.5 h-3.5 text-blue-400" />
                          <span>{property.bedrooms}</span>
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الحمامات</span>
                        <strong className="text-white flex items-center justify-center gap-1 mt-0.5">
                          <Bath className="w-3.5 h-3.5 text-purple-400" />
                          <span>{property.bathrooms}</span>
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">التشطيب</span>
                        <span className="text-[11px] font-bold text-emerald-400 block truncate mt-0.5">
                          {property.finishing || 'سوبر لوكس'}
                        </span>
                      </div>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          {isSold ? 'سعر البيع النهائي' : isRented ? 'قيمة الإيجار' : 'السعر المطلوب'}
                        </span>
                        <span className={`text-base font-black ${isSold ? 'text-rose-400 line-through opacity-80' : isRented ? 'text-purple-300' : 'text-amber-400'}`}>
                          {formatEGP(property.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingProperty(property);
                          }}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                          title="مشاركة العقار"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPropertyForDetails(property);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>التفاصيل</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Egyptian Mortgage Calculator Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">حاسبة التمويل والتقسيط العقاري (بالجنيه المصري)</h3>
            <p className="text-xs text-slate-400">احسب القسط الشهري المتوقع لشراء عقار أحلامك في مصر وتخطيط الميزانية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">سعر العقار التقديري (ج.م):</label>
            <input
              type="number"
              value={mortgagePrice}
              onChange={(e) => setMortgagePrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">الدفعة الأولى (%):</label>
            <input
              type="number"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">مدة السداد (سنوات):</label>
            <input
              type="number"
              value={loanYears}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
            />
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-transparent border border-amber-500/30 text-center flex flex-col justify-center">
            <span className="text-slate-400 text-[10px] block">القسط الشهري التقديري:</span>
            <div className="text-xl font-black text-amber-400 mt-1">{formatEGP(monthlyPayment)} / شهرياً</div>
          </div>
        </div>
      </div>

      {/* Floating Comparison Bar (When 1-3 properties are selected) */}
      {comparisonPropertyIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-amber-500/40 backdrop-blur-md rounded-2xl p-3 px-5 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span className="text-white font-bold">
              تم تحديد {comparisonPropertyIds.length} من 3 عقارات للمقارنة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              عرض جدول المقارنة ➔
            </button>

            <button
              onClick={() => setComparisonPropertyIds([])}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
              title="إلغاء المقارنة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Contact Utilities (WhatsApp & Call Back Request) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
        <button
          onClick={() => {
            setCallbackPropertyCode('');
            setShowCallbackModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-amber-500/40 text-amber-400 font-black text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 cursor-pointer group"
        >
          <Phone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">طلب اتصال فوري</span>
        </button>

        <a
          href="https://wa.me/201000000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%85%D8%A7%D8%B3%D8%A9%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D9%85%D8%AA%D8%A7%D8%AD%D8%A9"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-2 cursor-pointer group"
          title="تحدث عبر واتساب مع خدمة العملاء"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">تحدث عبر واتساب</span>
        </a>
      </div>

      {/* Property Customer Details Modal */}
      {selectedPropertyForDetails && (
        <PropertyCustomerDetailsModal
          property={selectedPropertyForDetails}
          onClose={() => setSelectedPropertyForDetails(null)}
          isFavorite={favoriteIds.includes(selectedPropertyForDetails.id)}
          onToggleFavorite={toggleFavorite}
          isInComparison={comparisonPropertyIds.includes(selectedPropertyForDetails.id)}
          onToggleComparison={toggleComparison}
          onOpenShareModal={(p) => setSharingProperty(p)}
          onBookViewing={handleBookingFromDetails}
        />
      )}

      {/* Property Comparison Modal */}
      {showComparisonModal && (
        <PropertyComparisonModal
          properties={comparisonProperties}
          onClose={() => setShowComparisonModal(false)}
          onRemoveFromComparison={(id) =>
            setComparisonPropertyIds((prev) => prev.filter((item) => item !== id))
          }
          onSelectPropertyDetails={(p) => setSelectedPropertyForDetails(p)}
          onClearComparison={() => setComparisonPropertyIds([])}
        />
      )}

      {/* Request Callback Modal */}
      {showCallbackModal && (
        <RequestCallbackModal
          onClose={() => setShowCallbackModal(false)}
          onSubmit={handleCallbackSubmit}
          initialPropertyCode={callbackPropertyCode}
        />
      )}

      {/* Share Property Modal */}
      <SharePropertyModal property={sharingProperty} onClose={() => setSharingProperty(null)} />

      {/* Submit Property as Owner Modal */}
      {showSubmitOwnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col p-6 space-y-4 text-xs text-slate-100 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>اعرض عقارك معنا كمالك</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    مع تحديد الموقع الذكي
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  حدد موقع وحدتك على الخريطة لاكتشاف أهم الخدمات المحيطة وعرضها للعملاء بأمان تام.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitOwnerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ownerSubmitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">تم استلام بيانات عقارك وموقعه بنجاح!</h4>
                <p className="text-slate-300 max-w-md mx-auto leading-relaxed">
                  تم تسجيل إحداثيات الحي والخدمات المحيطة بالوحدة. سيتواصل معك أحد مديري التعاقدات بشركة الماسة لمعاينة العقار وتوقيع عقد التسويق.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOwnerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="اسم المالك"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (واتساب) *</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* Map Location Picker in Client Mode */}
                <div>
                  <label className="block text-amber-400 font-bold mb-1">
                    📍 تحديد موقع العقار على الخريطة لاكتشاف الخدمات المحيطة *
                  </label>
                  <MapLocationPicker
                    lat={ownerLat}
                    lng={ownerLng}
                    address={ownerAddress}
                    district={ownerDistrict}
                    mode="client"
                    onChange={(loc) => {
                      setOwnerLat(loc.lat);
                      setOwnerLng(loc.lng);
                      setOwnerAddress(loc.address);
                      setOwnerDistrict(loc.district);
                      setOwnerNearbyCount(loc.nearbyPlaces?.length || 0);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تفاصيل ومواصفات العقار والسعر المطلوب *</label>
                  <textarea
                    rows={2}
                    required
                    value={ownerPropertyDetails}
                    onChange={(e) => setOwnerPropertyDetails(e.target.value)}
                    placeholder="المساحة بالمتر، عدد الغرف، الدور، مستوى التشطيب، السعر المطلوب..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitOwnerModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 cursor-pointer"
                  >
                    إرسال الطلب وحفظ الموقع
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
