import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  QrCode,
  Eye,
  FileText,
  BadgePercent,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  DollarSign,
  Layers,
  Sparkles,
  Share2,
  UserPlus,
  UserCheck,
  Phone,
  Edit3,
  History,
  RotateCcw,
  FileCheck,
  Compass,
  ArrowUpDown,
  SlidersHorizontal,
  Home,
  Store,
  Tag,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Property, PropertyType, PropertyPurpose, PropertyStatus, PropertyOwner } from '../types';
import { SharePropertyModal } from './SharePropertyModal';
import { PropertyImageGallery } from './PropertyImageGallery';
import { PropertyHistoryModal } from './PropertyHistoryModal';
import { OwnerFollowupModal } from './OwnerFollowupModal';
import { ExternalDealReportModal } from './ExternalDealReportModal';
import { ReverseMatchModal } from './ReverseMatchModal';
import { LocationIntelligenceModal } from './LocationIntelligenceModal';
import { MapLocationPicker } from './MapLocationPicker';
import { toast } from './Toast';
import { api } from '../services/api';

interface PropertyManagementViewProps {
  properties: Property[];
  owners: PropertyOwner[];
  onAddProperty: (newProp: Partial<Property>) => void;
  onUpdateProperty?: (id: string, updates: Partial<Property>, reason?: string) => Promise<any>;
  onUpdatePropertyState?: (prop: Property) => void;
  onAddOwner?: (newOwner: Partial<PropertyOwner>) => void;
  onUpdateStatus: (id: string, status: PropertyStatus) => void;
  onOpenQR: (property: Property) => void;
  onOpenAIForProperty: (property: Property) => void;
  onRefreshData?: () => void;
  isDarkMode?: boolean;
}

export const PropertyManagementView: React.FC<PropertyManagementViewProps> = ({
  properties,
  owners,
  onAddProperty,
  onUpdateProperty,
  onUpdatePropertyState,
  onAddOwner,
  onUpdateStatus,
  onOpenQR,
  onOpenAIForProperty,
  onRefreshData,
  isDarkMode = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('جميع الأنواع');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('الكل');
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('جميع المناطق');

  // Toolbar Enhanced Filtering & Sorting States
  // Price brackets: 'all' | '1m' | '2m' | '3m-5m' | '6m+' | 'custom'
  const [priceBracket, setPriceBracket] = useState<'all' | '1m' | '2m' | '3m-5m' | '6m+' | 'custom'>('all');
  const [customMinPrice, setCustomMinPrice] = useState<number>(0);
  const [customMaxPrice, setCustomMaxPrice] = useState<number>(0);
  const [showCustomPriceInputs, setShowCustomPriceInputs] = useState<boolean>(false);

  // Quick Type Filter: 'all' | 'شقة' | 'فيلا' | 'محل'
  const [quickTypeFilter, setQuickTypeFilter] = useState<'all' | 'شقة' | 'فيلا' | 'محل'>('all');

  // Sort By: 'price_asc' | 'price_desc' | 'area_desc' | 'area_asc' | 'location_asc' | 'date_desc'
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'area_desc' | 'area_asc' | 'location_asc' | 'date_desc'>('price_asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null);
  const [reverseMatchProperty, setReverseMatchProperty] = useState<Property | null>(null);
  const [locationIntelProperty, setLocationIntelProperty] = useState<Property | null>(null);
  const [historyProperty, setHistoryProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedPropForFollowup, setSelectedPropForFollowup] = useState<Property | null>(null);
  const [externalDealModalOpen, setExternalDealModalOpen] = useState(false);

  // Owner Selection / Creation state for Add Property Modal
  const [ownerMode, setOwnerMode] = useState<'registered' | 'new'>('registered');
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [newOwnerData, setNewOwnerData] = useState({
    name: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    nationalId: '',
    address: '',
    notes: '',
  });

  // Form State for new or edited property
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    type: 'شقة',
    purpose: 'بيع',
    status: 'متاح',
    governorate: 'القاهرة',
    city: 'القاهرة الجديدة',
    district: 'التجمع الخامس',
    address: '',
    mapLat: 30.0275,
    mapLng: 31.4721,
    price: 5000000,
    negotiable: true,
    minPrice: 4800000,
    commissionPct: 2.5,
    areaSqM: 180,
    bedrooms: 3,
    bathrooms: 2,
    floor: 2,
    totalFloors: 5,
    unitFloor: 2,
    finishing: 'تشطيب كامل',
    finishingLevel: 'تشطيب كامل',
    hasElevator: true,
    hasRoof: false,
    landShare: true,
    legalStatus: 'مرخص ومسجل شهر عقاري',
    reconciliationStatus: 'لا يخضع للتصالح (مباني قديمة مرخصة قبل القانون)',
    currency: 'EGP',
    operationType: 'بيع كاش',
    marketingAgreement: 'عقد تسويق حصري لشركة الماسة',
    partnerCompanyName: '',
    partnerCompanySharePct: 0,
    parking: true,
    garden: false,
    pool: false,
    balcony: true,
    furniture: false,
    ownerId: owners[0]?.id || 'own-1',
    ownerName: owners[0]?.name || 'غير محدد',
    ownerPhone: owners[0]?.phones[0] || '',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const propertyTypes = [
    'شقة',
    'شقق للبيع',
    'شقق للإيجار',
    'شقق مفروشة للإيجار',
    'بيوت كاملة للبيع',
    'محلات للبيع أو الإيجار',
    'أراضٍ للبيع',
    'أراضٍ للمشاركة أو الاستثمار',
    'فيلا',
    'دوبلكس',
    'توين هاوس',
    'تاون هاوس',
    'بنتهاوس',
    'محل تجاري',
    'مكتب إداري',
    'عيادة طبية',
    'مخزن',
    'مصنع',
    'عمارة سكنية',
    'أرض سكنية',
    'أرض زراعية',
    'أرض صناعية',
  ];

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop);
    setEditReason('');
    setFormData({
      ...prop,
      totalFloors: prop.totalFloors || 1,
      unitFloor: prop.unitFloor || prop.floor || 1,
      hasRoof: prop.hasRoof || false,
      hasElevator: prop.hasElevator || false,
      landShare: prop.landShare !== false,
      finishingLevel: prop.finishingLevel || prop.finishing || 'تشطيب كامل',
      legalStatus: prop.legalStatus || 'مرخص ومسجل شهر عقاري',
      reconciliationStatus: prop.reconciliationStatus || 'لا يخضع للتصالح',
      marketingAgreement: prop.marketingAgreement || 'عقد تسويق حصري لشركة الماسة',
      currency: prop.currency || 'EGP',
      operationType: prop.operationType || 'بيع كاش',
      partnerCompanyName: prop.partnerCompanyName || '',
      partnerCompanySharePct: prop.partnerCompanySharePct || 0,
    });
    setOwnerMode('registered');
    setShowAddModal(true);
  };

  const handleOpenNew = () => {
    setEditingProperty(null);
    setEditReason('');
    setFormData({
      title: '',
      type: 'شقة',
      purpose: 'بيع',
      status: 'متاح',
      governorate: 'القاهرة',
      city: 'القاهرة الجديدة',
      district: 'التجمع الخامس',
      address: '',
      mapLat: 30.0275,
      mapLng: 31.4721,
      price: 5000000,
      negotiable: true,
      minPrice: 4800000,
      commissionPct: 2.5,
      areaSqM: 180,
      bedrooms: 3,
      bathrooms: 2,
      floor: 2,
      totalFloors: 5,
      unitFloor: 2,
      finishing: 'تشطيب كامل',
      finishingLevel: 'تشطيب كامل',
      hasElevator: true,
      hasRoof: false,
      landShare: true,
      legalStatus: 'مرخص ومسجل شهر عقاري',
      reconciliationStatus: 'لا يخضع للتصالح (مباني قديمة مرخصة قبل القانون)',
      currency: 'EGP',
      operationType: 'بيع كاش',
      marketingAgreement: 'عقد تسويق حصري لشركة الماسة',
      partnerCompanyName: '',
      partnerCompanySharePct: 0,
      parking: true,
      garden: false,
      pool: false,
      balcony: true,
      furniture: false,
      ownerId: owners[0]?.id || 'own-1',
      ownerName: owners[0]?.name || 'غير محدد',
      ownerPhone: owners[0]?.phones[0] || '',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setShowAddModal(true);
  };

  const districts = useMemo(() => {
    const defaultList = ['جميع المناطق', 'التجمع الخامس', 'الشيخ زايد', 'العاصمة الإدارية', '6 أكتوبر', 'الساحل الشمالي', 'المعادي', 'الشروق', 'مدينة نصر', 'المقطم'];
    const extracted = properties.map((p) => p.district).filter(Boolean);
    const set = new Set<string>([...defaultList, ...extracted]);
    return Array.from(set);
  }, [properties]);

  // Dynamic counts for price brackets
  const priceBracketCounts = useMemo(() => {
    let count1m = 0;
    let count2m = 0;
    let count3to5m = 0;
    let count6mPlus = 0;

    properties.forEach((p) => {
      const price = p.price || 0;
      if (price <= 1500000) count1m++;
      if (price > 1500000 && price <= 2500000) count2m++;
      if (price >= 3000000 && price <= 5000000) count3to5m++;
      if (price > 6000000) count6mPlus++;
    });

    return {
      all: properties.length,
      '1m': count1m,
      '2m': count2m,
      '3m-5m': count3to5m,
      '6m+': count6mPlus,
    };
  }, [properties]);

  // Dynamic counts for quick types
  const typeCounts = useMemo(() => {
    let apartments = 0;
    let villas = 0;
    let stores = 0;

    properties.forEach((p) => {
      const t = p.type || '';
      if (t.includes('شقة') || t.includes('شقق') || t.includes('دوبلكس') || t.includes('بنتهاوس')) apartments++;
      if (t.includes('فيلا') || t.includes('تاون') || t.includes('توين')) villas++;
      if (t.includes('محل') || t.includes('تجاري')) stores++;
    });

    return {
      apartments,
      villas,
      stores,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const list = properties.filter((p) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          p.title?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.ownerName?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Quick Type Filter (شقة، فيلا، محل)
      if (quickTypeFilter === 'شقة') {
        const t = p.type || '';
        if (!t.includes('شقة') && !t.includes('شقق') && !t.includes('دوبلكس') && !t.includes('بنتهاوس')) {
          return false;
        }
      } else if (quickTypeFilter === 'فيلا') {
        const t = p.type || '';
        if (!t.includes('فيلا') && !t.includes('تاون') && !t.includes('توين')) {
          return false;
        }
      } else if (quickTypeFilter === 'محل') {
        const t = p.type || '';
        if (!t.includes('محل') && !t.includes('تجاري')) {
          return false;
        }
      }

      // 3. Specific Detailed Type dropdown
      if (selectedType !== 'جميع الأنواع' && p.type !== selectedType) {
        return false;
      }

      // 4. District / Location Filter
      if (selectedDistrict !== 'جميع المناطق' && !p.district?.includes(selectedDistrict)) {
        return false;
      }

      // 5. Purpose & Status
      if (selectedPurpose !== 'الكل' && p.purpose !== selectedPurpose) {
        return false;
      }
      if (selectedStatus !== 'الكل' && p.status !== selectedStatus) {
        return false;
      }

      // 6. Price Brackets Filter
      const price = p.price || 0;
      if (priceBracket === '1m') {
        // وحدات بـ ١ مليون (حتى 1.5 مليون)
        if (price > 1500000) return false;
      } else if (priceBracket === '2m') {
        // وحدات بـ ٢ مليون (1.5 مليون إلى 2.5 مليون)
        if (price <= 1500000 || price > 2500000) return false;
      } else if (priceBracket === '3m-5m') {
        // وحدات بـ ٣ مليون إلى ٥ مليون
        if (price < 3000000 || price > 5000000) return false;
      } else if (priceBracket === '6m+') {
        // وحدات أكثر من ٦ مليون
        if (price <= 6000000) return false;
      } else if (priceBracket === 'custom') {
        if (customMinPrice > 0 && price < customMinPrice) return false;
        if (customMaxPrice > 0 && price > customMaxPrice) return false;
      }

      return true;
    });

    // 7. Multi-Criteria Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'area_asc') {
        return (a.areaSqM || 0) - (b.areaSqM || 0);
      }
      if (sortBy === 'area_desc') {
        return (b.areaSqM || 0) - (a.areaSqM || 0);
      }
      if (sortBy === 'location_asc') {
        return (a.district || '').localeCompare(b.district || '', 'ar');
      }
      // date_desc
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return list;
  }, [
    properties,
    searchTerm,
    quickTypeFilter,
    selectedType,
    selectedDistrict,
    selectedPurpose,
    selectedStatus,
    priceBracket,
    customMinPrice,
    customMaxPrice,
    sortBy,
  ]);

  const hasActiveFilters =
    searchTerm !== '' ||
    quickTypeFilter !== 'all' ||
    selectedType !== 'جميع الأنواع' ||
    selectedDistrict !== 'جميع المناطق' ||
    selectedPurpose !== 'الكل' ||
    selectedStatus !== 'الكل' ||
    priceBracket !== 'all' ||
    customMinPrice > 0 ||
    customMaxPrice > 0 ||
    sortBy !== 'price_asc';

  const handleResetFilters = () => {
    setSearchTerm('');
    setQuickTypeFilter('all');
    setSelectedType('جميع الأنواع');
    setSelectedDistrict('جميع المناطق');
    setSelectedPurpose('الكل');
    setSelectedStatus('الكل');
    setPriceBracket('all');
    setCustomMinPrice(0);
    setCustomMaxPrice(0);
    setShowCustomPriceInputs(false);
    setSortBy('price_asc');
  };

  // Summary statistics for displayed properties
  const summaryStats = useMemo(() => {
    const total = filteredProperties.length;
    if (total === 0) return { total: 0, avgPrice: 0, totalValue: 0 };
    const totalValue = filteredProperties.reduce((acc, p) => acc + (p.price || 0), 0);
    const avgPrice = Math.round(totalValue / total);
    return { total, avgPrice, totalValue };
  }, [filteredProperties]);

  const filteredOwners = owners.filter((o) => {
    if (!ownerSearchQuery.trim()) return true;
    const q = ownerSearchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.phones.some((p) => p.includes(q)) ||
      (o.email && o.email.toLowerCase().includes(q)) ||
      (o.nationalId && o.nationalId.includes(q))
    );
  });

  const handleSubmitNewProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyComm = Math.round((formData.price || 0) * ((formData.commissionPct || 2.5) / 100));

    let finalOwnerId = formData.ownerId;
    let finalOwnerName = formData.ownerName;
    let finalOwnerPhone = formData.ownerPhone;

    if (ownerMode === 'new' && !editingProperty) {
      if (!newOwnerData.name || !newOwnerData.phone) {
        alert('برجاء إدخال اسم المالك ورقم الهاتف الرئيسي على الأقل.');
        return;
      }

      const createdOwnerId = `own-${Date.now()}`;
      const createdOwner: Partial<PropertyOwner> = {
        id: createdOwnerId,
        name: newOwnerData.name,
        phones: [newOwnerData.phone, newOwnerData.secondaryPhone].filter(Boolean),
        email: newOwnerData.email,
        nationalId: newOwnerData.nationalId || '29501011234567',
        address: newOwnerData.address || 'القاهرة',
        notes: newOwnerData.notes,
      };

      if (onAddOwner) {
        onAddOwner(createdOwner);
      }

      finalOwnerId = createdOwnerId;
      finalOwnerName = newOwnerData.name;
      finalOwnerPhone = newOwnerData.phone;
    }

    if (editingProperty) {
      if (onUpdateProperty) {
        try {
          const updated = await onUpdateProperty(
            editingProperty.id,
            {
              ...formData,
              companyCommission: companyComm,
            },
            editReason || 'تعديل بيانات الوحدة العقارية'
          );
          if (updated && selectedPropertyDetails?.id === editingProperty.id) {
            setSelectedPropertyDetails(updated);
          }
        } catch (err: any) {
          return;
        }
      }
    } else {
      if (onAddProperty) {
        try {
          await onAddProperty({
            ...formData,
            ownerId: finalOwnerId,
            ownerName: finalOwnerName,
            ownerPhone: finalOwnerPhone,
            companyCommission: companyComm,
            ownerCommission: 0,
          });
          // Reset filters so the newly added unit is immediately visible in the grid
          handleResetFilters();
        } catch (err) {
          return;
        }
      }
    }

    if (onRefreshData) {
      onRefreshData();
    }

    setShowAddModal(false);
    setEditingProperty(null);
  };

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-amber-400" />
            <span>إدارة العقارات والوحدات المتاحة</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة شاملة لجميع أنواع العقارات بمصر، حساب العمولات التلقائي 2.5%، واستخراج بطاقات المعاينة برمز QR.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عقار جديد</span>
        </button>
      </div>

      {/* Smart Property Toolbar (شريط أدوات وتصفية وفرز العقارات) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Toolbar Header & Search + Quick Type Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>تصفية وفرز الوحدات العقارية</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {filteredProperties.length} وحدة متوفرة
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">فرز وتصفية فورية حسب السعر، المساحة، الموقع والحي، ونوع الوحدة</p>
            </div>
          </div>

          {/* Quick Property Type Segmented Buttons (شقة، فيلا، محل) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setQuickTypeFilter('all');
                setSelectedType('جميع الأنواع');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                quickTypeFilter === 'all' && selectedType === 'جميع الأنواع'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>الكل</span>
              <span className="text-[10px] opacity-80">({properties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickTypeFilter('شقة');
                setSelectedType('جميع الأنواع');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                quickTypeFilter === 'شقة'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>شقة</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                quickTypeFilter === 'شقة' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeCounts.apartments}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickTypeFilter('فيلا');
                setSelectedType('جميع الأنواع');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                quickTypeFilter === 'فيلا'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>فيلا</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                quickTypeFilter === 'فيلا' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeCounts.villas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickTypeFilter('محل');
                setSelectedType('جميع الأنواع');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                quickTypeFilter === 'محل'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>محل تجاري</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                quickTypeFilter === 'محل' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeCounts.stores}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Price Ranges Bar (نطاقات الأسعار المباشرة السريعة) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>فرز وتصفية سريعة بنطاق السعر (جنيه مصري):</span>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* All Prices */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('all');
                setShowCustomPriceInputs(false);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                priceBracket === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>جميع الأسعار</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                priceBracket === 'all' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {priceBracketCounts.all}
              </span>
            </button>

            {/* 1 Million */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('1m');
                setSortBy('price_asc'); // Default sort ascending as requested
                setShowCustomPriceInputs(false);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                priceBracket === '1m'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title="وحدات سعرها في حدود ١ مليون (حتى 1.5 مليون)"
            >
              <span>وحدات بـ ١ مليون</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                priceBracket === '1m' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-emerald-400'
              }`}>
                {priceBracketCounts['1m']}
              </span>
            </button>

            {/* 2 Million */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('2m');
                setSortBy('price_asc');
                setShowCustomPriceInputs(false);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                priceBracket === '2m'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title="وحدات سعرها في حدود ٢ مليون (1.5 إلى 2.5 مليون)"
            >
              <span>وحدات بـ ٢ مليون</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                priceBracket === '2m' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-cyan-400'
              }`}>
                {priceBracketCounts['2m']}
              </span>
            </button>

            {/* 3 to 5 Million */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('3m-5m');
                setSortBy('price_asc');
                setShowCustomPriceInputs(false);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                priceBracket === '3m-5m'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title="وحدات سعرها من ٣ مليون إلى ٥ مليون"
            >
              <span>وحدات بـ ٣ إلى ٥ مليون</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                priceBracket === '3m-5m' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
              }`}>
                {priceBracketCounts['3m-5m']}
              </span>
            </button>

            {/* > 6 Million */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('6m+');
                setSortBy('price_asc');
                setShowCustomPriceInputs(false);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                priceBracket === '6m+'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title="وحدات فاخرة أكثر من ٦ مليون"
            >
              <span>وحدات أكثر من ٦ مليون</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                priceBracket === '6m+' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-purple-400'
              }`}>
                {priceBracketCounts['6m+']}
              </span>
            </button>

            {/* Custom Range Button */}
            <button
              type="button"
              onClick={() => {
                setPriceBracket('custom');
                setShowCustomPriceInputs(!showCustomPriceInputs);
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                priceBracket === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black'
                  : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>نطاق مخصص...</span>
            </button>
          </div>

          {/* Expandable Custom Price Inputs */}
          {showCustomPriceInputs && (
            <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">الحد الأدنى للسعر (ج.م):</label>
                <input
                  type="number"
                  placeholder="مثال: 1000000"
                  value={customMinPrice || ''}
                  onChange={(e) => {
                    setCustomMinPrice(Number(e.target.value) || 0);
                    setPriceBracket('custom');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">الحد الأقصى للسعر (ج.م):</label>
                <input
                  type="number"
                  placeholder="مثال: 5000000"
                  value={customMaxPrice || ''}
                  onChange={(e) => {
                    setCustomMaxPrice(Number(e.target.value) || 0);
                    setPriceBracket('custom');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setPriceBracket('custom')}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg hover:bg-amber-400 cursor-pointer"
                >
                  تطبيق النطاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomMinPrice(0);
                    setCustomMaxPrice(0);
                    setPriceBracket('all');
                    setShowCustomPriceInputs(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Controls Row: Search, Sorting, Location & District, Detailed Type, Purpose, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالكود، العنوان، أو اسم المالك..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Selector (فرز الوحدات حسب السعر والمساحة والموقع) */}
          <div>
            <div className="relative">
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pr-8 pl-2 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                title="اختر طريقة فرز وترتيب الوحدات"
              >
                <option value="price_asc">السعر: من الأقل للأعلى ⬆️</option>
                <option value="price_desc">السعر: من الأعلى للأقل ⬇️</option>
                <option value="area_desc">المساحة: من الأكبر للأصغر ⬇️</option>
                <option value="area_asc">المساحة: من الأصغر للأكبر ⬆️</option>
                <option value="location_asc">الموقع والحي: أبجدياً (أ - ي)</option>
                <option value="date_desc">تاريخ الإضافة: الأحدث أولاً</option>
              </select>
            </div>
          </div>

          {/* District / Location Filter (الموقع والحي) */}
          <div>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 pointer-events-none" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pr-8 pl-2 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                title="تصفية حسب المنطقة والحي"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific Detailed Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                if (e.target.value !== 'جميع الأنواع') {
                  setQuickTypeFilter('all');
                }
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              title="تصفية تفصيلية بنوع العقار"
            >
              <option value="جميع الأنواع">نوع محدد: جميع الأنواع</option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose & Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="w-1/2 px-2 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="الكل">الهدف: الكل</option>
              <option value="بيع">بيع</option>
              <option value="إيجار">إيجار</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-1/2 px-2 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="الكل">الحالة: الكل</option>
              <option value="متاح">متاح</option>
              <option value="تم البيع">تم البيع</option>
              <option value="تم التأجير">تم التأجير</option>
              <option value="محجوز">محجوز</option>
            </select>
          </div>
        </div>

        {/* Results Strip & Active Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-200">
              نتائج الفرز: <strong className="text-amber-400">{filteredProperties.length}</strong> من أصل {properties.length} وحدة
            </span>

            {summaryStats.total > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span>
                  متوسط السعر: <strong className="text-emerald-400 font-bold">{formatEGP(summaryStats.avgPrice)}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="hidden sm:inline">
                  إجمالي قيمة المعروض: <strong className="text-amber-400 font-bold">{formatEGP(summaryStats.totalValue)}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Active Sorting indicator */}
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
              الفرز الحالي:{' '}
              <strong className="text-amber-400">
                {sortBy === 'price_asc'
                  ? 'السعر (الأقل للأعلى ⬆️)'
                  : sortBy === 'price_desc'
                  ? 'السعر (الأعلى للأقل ⬇️)'
                  : sortBy === 'area_desc'
                  ? 'المساحة (الأكبر للأصغر)'
                  : sortBy === 'area_asc'
                  ? 'المساحة (الأصغر للأكبر)'
                  : sortBy === 'location_asc'
                  ? 'الموقع والحي'
                  : 'الأحدث أولاً'}
              </strong>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="إلغاء جميع الفلاتر والعودة للوضع الافتراضي"
              >
                <X className="w-3 h-3" />
                <span>مسح الفلاتر</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when no properties match */}
      {filteredProperties.length === 0 && (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <Building className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">لا توجد وحدات عقارية مطابقة لمعايير الفرز الحالية</h4>
            <p className="text-xs text-slate-400">
              جرب تغيير نطاق السعر، اختيار نوع عقار آخر، أو مسح خانة البحث لإظهار باقي العقارات.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط جميع الفلاتر والفرز</span>
          </button>
        </div>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 hover:shadow-2xl transition-all flex flex-col justify-between"
          >
            {/* Image & Status Badge */}
            <div className="relative h-52 overflow-hidden bg-slate-800">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                  {property.code}
                </span>
                {property.availabilityStatus ? (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg backdrop-blur-md border ${
                      property.availabilityStatus === 'متاحة ومؤكدة'
                        ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40'
                        : property.availabilityStatus === 'متاحة لكن تحتاج إعادة تأكيد'
                        ? 'bg-amber-950/90 text-amber-400 border-amber-500/40'
                        : property.availabilityStatus === 'تم البيع'
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                        : property.availabilityStatus === 'تم التأجير'
                        ? 'bg-teal-950/90 text-teal-300 border-teal-500/40'
                        : property.availabilityStatus === 'تحت التفاوض'
                        ? 'bg-blue-950/90 text-blue-300 border-blue-500/40'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {property.availabilityStatus}
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${
                      property.status === 'متاح'
                        ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                        : property.status === 'تم البيع' || property.status === 'مباع'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                        : property.status === 'تم التأجير'
                        ? 'bg-purple-950/90 text-purple-300 border border-purple-500/40'
                        : 'bg-amber-950/90 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {property.status === 'تم البيع' ? '🎉 تم البيع' : property.status === 'تم التأجير' ? '🔑 تم التأجير' : property.status}
                  </span>
                )}
                {property.dealClosingId && !property.isArchived && (
                  <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-rose-600 text-white animate-pulse shadow-md">
                    24h أرشفة ⏱️
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-white font-bold bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
                <span>
                  {property.type} • {property.purpose}
                </span>
                <span className="text-amber-400">{property.areaSqM} م²</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-2 hover:text-amber-400 transition-colors">
                  {property.title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{property.district}</span>
                </p>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-[11px] text-slate-300 text-center">
                <div className="flex items-center justify-center gap-1 bg-slate-800/40 py-1 rounded-md">
                  <Bed className="w-3.5 h-3.5 text-blue-400" />
                  <span>{property.bedrooms} غرف</span>
                </div>
                <div className="flex items-center justify-center gap-1 bg-slate-800/40 py-1 rounded-md">
                  <Bath className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{property.bathrooms} حمام</span>
                </div>
                <div className="flex items-center justify-center gap-1 bg-slate-800/40 py-1 rounded-md">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>دور {property.floor}</span>
                </div>
              </div>

              {/* Price & Dynamic Commission */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-400">السعر المطلوب</div>
                  <div className="text-base font-black text-amber-400">{formatEGP(property.price)}</div>
                </div>

                <div className="text-left bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <div className="text-[10px] text-amber-300 font-semibold">عمولة الشركة ({property.commissionPct}%)</div>
                  <div className="text-xs font-bold text-amber-400">{formatEGP(property.companyCommission)}</div>
                </div>
              </div>
            </div>

            {/* Quick Status Management Bar */}
            <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-400 font-bold text-[10px] shrink-0">تغيير الحالة:</span>
              <div className="flex items-center gap-1 flex-1 overflow-x-auto justify-end">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(property.id, 'متاح')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    property.status === 'متاح'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                  }`}
                  title="تغيير الحالة إلى متاح"
                >
                  متاح
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(property.id, 'تم البيع')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    property.status === 'تم البيع' || property.status === 'مباع'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                  }`}
                  title="تغيير الحالة إلى تم البيع"
                >
                  تم البيع 🎉
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(property.id, 'تم التأجير')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    property.status === 'تم التأجير'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-purple-300 hover:bg-slate-700'
                  }`}
                  title="تغيير الحالة إلى تم التأجير"
                >
                  تم التأجير 🔑
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(property.id, 'محجوز')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    property.status === 'محجوز'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                  }`}
                  title="تغيير الحالة إلى محجوز"
                >
                  محجوز
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedPropertyDetails(property)}
                className="flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>التفاصيل</span>
              </button>

              <button
                onClick={() => handleOpenEdit(property)}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="تعديل بيانات العقار"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>

              <button
                onClick={() => setHistoryProperty(property)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="سجل التعديلات والتاريخ (History)"
              >
                <History className="w-3.5 h-3.5" />
                <span>السجل</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPropForFollowup(property);
                  setFollowupModalOpen(true);
                }}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="تسجيل متابعة وتأكيد توافر الوحدة"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>متابعة</span>
              </button>

              <button
                onClick={() => setSharingProperty(property)}
                className="p-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                title="مشاركة العقار (واتساب، فيسبوك، ماسنجر)"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setReverseMatchProperty(property)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="المطابقة العكسية: فحص العملاء الذين يطلبون هذه الوحدة"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>العملاء المطابقون</span>
              </button>

              <button
                onClick={() => setLocationIntelProperty(property)}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="التحليل الجغرافي والخدمات المحيطة (Google Places & Maps)"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>الخدمات المحيطة</span>
              </button>

              <button
                onClick={() => onOpenQR(property)}
                className="p-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                title="بطاقة QR للمعاينة"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAIForProperty(property)}
                className="p-1.5 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
                title="توليد إعلان بالذكاء الاصطناعي AI"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Property Details Modal */}
      {selectedPropertyDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  كود العقار: {selectedPropertyDetails.code}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{selectedPropertyDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPropertyDetails(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Responsive Image Gallery */}
            <PropertyImageGallery images={selectedPropertyDetails.images} title={selectedPropertyDetails.title} />

            {/* Key Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">النوع والهدف:</span>
                <div className="font-bold text-white mt-0.5">
                  {selectedPropertyDetails.type} ({selectedPropertyDetails.purpose})
                </div>
              </div>

              <div>
                <span className="text-slate-400">المساحة والتشطيب:</span>
                <div className="font-bold text-white mt-0.5">
                  {selectedPropertyDetails.areaSqM} م² - {selectedPropertyDetails.finishing}
                </div>
              </div>

              <div>
                <span className="text-slate-400">السعر المطلوب:</span>
                <div className="font-bold text-amber-400 mt-0.5">{formatEGP(selectedPropertyDetails.price)}</div>
              </div>

              <div>
                <span className="text-slate-400">المالك المسجل:</span>
                <div className="font-bold text-white mt-0.5 flex items-center gap-1">
                  <span>{selectedPropertyDetails.ownerName}</span>
                  {selectedPropertyDetails.ownerPhone && (
                    <span className="text-[11px] text-slate-400">({selectedPropertyDetails.ownerPhone})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Commission breakdown */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-300">اتفاقية عمولة الشركة (2.5%)</div>
                <div className="text-sm text-slate-300 mt-0.5">
                  صافي العمولة عند إغلاق البيع: <strong>{formatEGP(selectedPropertyDetails.companyCommission)}</strong>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                selectedPropertyDetails.status === 'متاح'
                  ? 'bg-emerald-500 text-slate-950'
                  : selectedPropertyDetails.status === 'تم البيع' || selectedPropertyDetails.status === 'مباع'
                  ? 'bg-rose-500 text-white'
                  : selectedPropertyDetails.status === 'تم التأجير'
                  ? 'bg-purple-600 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}>
                حالة العقار: {selectedPropertyDetails.status}
              </span>
            </div>

            {/* Quick Change Status Box in Modal */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>تحديث حالة العقار مباشرة (صلاحيات الإدارة):</span>
                <span className="text-amber-400 font-bold">الحالة الحالية: {selectedPropertyDetails.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'متاح', label: '✅ متاح للعرض والطلب', bg: 'bg-emerald-500 text-slate-950' },
                  { id: 'تم البيع', label: '🎉 تم البيع (إغلاق صفقة بيع)', bg: 'bg-rose-500 text-white' },
                  { id: 'تم التأجير', label: '🔑 تم التأجير (إغلاق عقد إيجار)', bg: 'bg-purple-600 text-white' },
                  { id: 'محجوز', label: '⏳ محجوز (مفاوضات جارية)', bg: 'bg-amber-500 text-slate-950' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedPropertyDetails.id, st.id as any);
                      setSelectedPropertyDetails({ ...selectedPropertyDetails, status: st.id as any });
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedPropertyDetails.status === st.id
                        ? `${st.bg} ring-2 ring-white scale-105 shadow-md`
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const p = selectedPropertyDetails;
                  setSelectedPropertyDetails(null);
                  setHistoryProperty(p);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                title="عرض سجل تاريخ وتعديلات الوحدة"
              >
                <History className="w-4 h-4" />
                <span>سجل الوحدة والتاريخ</span>
              </button>

              <button
                onClick={() => setSharingProperty(selectedPropertyDetails)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة العقار (واتساب / فيسبوك)</span>
              </button>

              <button
                onClick={() => {
                  onOpenQR(selectedPropertyDetails);
                  setSelectedPropertyDetails(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>عرض كود QR للمعاينة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitNewProperty}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {editingProperty ? (
                  <>
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <span>تعديل بيانات العقار: {editingProperty.code} - {editingProperty.title}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-amber-400" />
                    <span>تسجيل عقار جديد في المنظومة</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProperty(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {editingProperty && (
                <div className="md:col-span-2 lg:col-span-3 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl">
                  <label className="block text-amber-300 mb-1 font-bold text-xs">
                    سبب التعديل (مطلوب للتوثيق في سجل التاريخ والمراجعة الرقابية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="مثال: تعديل السعر بناء على طلب المالك / تحديث التشطيب / إضافة مواصفات جديدة..."
                    className="w-full px-3 py-2 bg-slate-800 border border-amber-500/40 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="md:col-span-2 lg:col-span-2">
                <label className="block text-slate-300 mb-1 font-semibold">عنوان العقار التسويقي *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: شقة مودرن للبيع شارع التسعين 200م"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">النوع *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                >
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">الهدف من العرض *</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                >
                  <option value="بيع">بيع</option>
                  <option value="إيجار">إيجار</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المنطقة والحي *</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="التجمع الخامس، الشيخ زايد، العاصمة..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Interactive Smart Map Location Picker & Nearby Services */}
              <div className="md:col-span-2 lg:col-span-3 my-1">
                <MapLocationPicker
                  lat={formData.mapLat || 30.0275}
                  lng={formData.mapLng || 31.4721}
                  address={formData.address || ''}
                  district={formData.district || 'التجمع الخامس'}
                  city={formData.city || 'القاهرة الجديدة'}
                  governorate={formData.governorate || 'القاهرة'}
                  mode="admin"
                  onChange={(locData) => {
                    setFormData((prev) => ({
                      ...prev,
                      mapLat: locData.lat,
                      mapLng: locData.lng,
                      address: locData.address,
                      district: locData.district,
                      city: locData.city || prev.city,
                      governorate: locData.governorate || prev.governorate,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">السعر المطلوب *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">العملة</label>
                <select
                  value={formData.currency || 'EGP'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نسبة عمولة الشركة %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commissionPct}
                  onChange={(e) => setFormData({ ...formData, commissionPct: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المساحة (متر مربع) *</label>
                <input
                  type="number"
                  value={formData.areaSqM}
                  onChange={(e) => setFormData({ ...formData, areaSqM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Dynamic Fields: Bedrooms & Bathrooms (Hidden for Land and Commercial Shops) */}
              {!(formData.type?.includes('أرض') || formData.type?.includes('أراض') || formData.type?.includes('محل')) && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">عدد الغرف</label>
                    <input
                      type="number"
                      value={formData.bedrooms || 0}
                      onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">عدد الحمامات</label>
                    <input
                      type="number"
                      value={formData.bathrooms || 0}
                      onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </>
              )}

              {/* Dynamic Floors (Hidden for Land) */}
              {!(formData.type?.includes('أرض') || formData.type?.includes('أراض')) && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">دور الوحدة</label>
                    <input
                      type="number"
                      value={formData.unitFloor || formData.floor || 0}
                      onChange={(e) => setFormData({ ...formData, unitFloor: Number(e.target.value), floor: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">إجمالي أدوار المبنى</label>
                    <input
                      type="number"
                      value={formData.totalFloors || 1}
                      onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </>
              )}

              {/* Finishing level (Hidden for Land) */}
              {!(formData.type?.includes('أرض') || formData.type?.includes('أراض')) && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">مستوى التشطيب</label>
                  <select
                    value={formData.finishingLevel || formData.finishing || 'تشطيب كامل'}
                    onChange={(e) => setFormData({ ...formData, finishingLevel: e.target.value, finishing: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="تشطيب كامل">تشطيب كامل</option>
                    <option value="سوبر لوكس">سوبر لوكس</option>
                    <option value="الترا سوبر لوكس">الترا سوبر لوكس</option>
                    <option value="نصف تشطيب">نصف تشطيب (محارة وحلوق)</option>
                    <option value="على المحارة">على المحارة</option>
                    <option value="مفروش فاخر">مفروش فاخر</option>
                    <option value="طوب أحمر">طوب أحمر</option>
                  </select>
                </div>
              )}

              {/* Legal Status */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">الوضع القانوني والملكية</label>
                <select
                  value={formData.legalStatus || 'مرخص ومسجل شهر عقاري'}
                  onChange={(e) => setFormData({ ...formData, legalStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="مرخص ومسجل شهر عقاري">مرخص ومسجل شهر عقاري</option>
                  <option value="صحة ونفاذ">صحة ونفاذ بحكم محكمة</option>
                  <option value="صحة توقيع">صحة توقيع</option>
                  <option value="عقد بيع ابتدائي">عقد بيع ابتدائي</option>
                  <option value="تخصيص هيئة المجتمعات العمرانية">تخصيص جهاز / هيئة المجتمعات</option>
                  <option value="مسجل جمعية زراعية">مسجل جمعية زراعية</option>
                </select>
              </div>

              {/* Reconciliation Status */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">موقف قانون التصالح</label>
                <select
                  value={formData.reconciliationStatus || 'لا يخضع للتصالح (مباني قديمة مرخصة قبل القانون)'}
                  onChange={(e) => setFormData({ ...formData, reconciliationStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="لا يخضع للتصالح (مباني قديمة مرخصة قبل القانون)">لا يخضع للتصالح (مرخص)</option>
                  <option value="نموذج 10 نهائي (تم التصالح)">نموذج 10 نهائي (تم التصالح)</option>
                  <option value="نموذج 8 ومسدد جدية التصالح">نموذج 8 ومسدد جدية التصالح</option>
                  <option value="تحت إجراءات الفحص والبت">تحت إجراءات الفحص والبت</option>
                  <option value="غير مصالح عليه">غير مصالح عليه</option>
                </select>
              </div>

              {/* Operation Type */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">نظام العملية / السداد</label>
                <select
                  value={formData.operationType || 'بيع كاش'}
                  onChange={(e) => setFormData({ ...formData, operationType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="بيع كاش">بيع كاش</option>
                  <option value="تقسيط مباشر">تقسيط مباشر</option>
                  <option value="تمويل عقاري بنكي">تمويل عقاري بنكي</option>
                  <option value="مشاركة استثمارية">مشاركة استثمارية</option>
                  <option value="إيجار شهري">إيجار شهري</option>
                  <option value="إيجار سنوي">إيجار سنوي</option>
                </select>
              </div>

              {/* Marketing Agreement */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اتفاقية التسويق</label>
                <select
                  value={formData.marketingAgreement || 'عقد تسويق حصري لشركة الماسة'}
                  onChange={(e) => setFormData({ ...formData, marketingAgreement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="عقد تسويق حصري لشركة الماسة">عقد تسويق حصري لشركة الماسة</option>
                  <option value="عقد تسويق غير حصري">عقد تسويق غير حصري</option>
                  <option value="تفويض تسويق رقمي">تفويض تسويق رقمي</option>
                </select>
              </div>

              {/* Partner Company (For partnership land or investments) */}
              {(formData.type?.includes('مشاركة') || formData.operationType === 'مشاركة استثمارية') && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">اسم الشركة الشريكة / المطور</label>
                    <input
                      type="text"
                      value={formData.partnerCompanyName || ''}
                      onChange={(e) => setFormData({ ...formData, partnerCompanyName: e.target.value })}
                      placeholder="اسم شركة التطوير أو المقاولات..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">نسبة الشراكة %</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.partnerCompanySharePct || 0}
                      onChange={(e) => setFormData({ ...formData, partnerCompanySharePct: Number(e.target.value) })}
                      placeholder="50"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </>
              )}

              {/* Checkbox Features */}
              <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-4 py-2 border-t border-slate-800">
                {!(formData.type?.includes('أرض') || formData.type?.includes('أراض')) && (
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hasElevator)}
                      onChange={(e) => setFormData({ ...formData, hasElevator: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>يوجد مصعد (أسانسير)</span>
                  </label>
                )}

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.landShare !== false}
                    onChange={(e) => setFormData({ ...formData, landShare: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <span>حصة محددة في الأرض</span>
                </label>

                {!(formData.type?.includes('أرض') || formData.type?.includes('أراض')) && (
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hasRoof)}
                      onChange={(e) => setFormData({ ...formData, hasRoof: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>روف خاص بالوحدة</span>
                  </label>
                )}

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.parking)}
                    onChange={(e) => setFormData({ ...formData, parking: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <span>جراج / موقف سيارات</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.furniture)}
                    onChange={(e) => setFormData({ ...formData, furniture: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <span>مفروش بالكامل</span>
                </label>
              </div>

              {/* Owner Assignment Section */}
              <div className="md:col-span-2 lg:col-span-3 border-t border-slate-800 pt-4 mt-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>ربط العقار بمالك/عميل مسجل *</span>
                  </label>

                  {!editingProperty && (
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setOwnerMode('registered')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          ownerMode === 'registered' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>اختيار عميل مسجل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOwnerMode('new')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          ownerMode === 'new' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>إضافة مالك/عميل جديد ➕</span>
                      </button>
                    </div>
                  )}
                </div>

                {ownerMode === 'registered' || editingProperty ? (
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={ownerSearchQuery}
                        onChange={(e) => setOwnerSearchQuery(e.target.value)}
                        placeholder="ابحث عن المالك بالاسم أو رقم الهاتف أو الرقم القومي..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {filteredOwners.length === 0 ? (
                        <p className="text-center text-slate-400 py-3 text-xs">لا يوجد عميل يطابق البحث.</p>
                      ) : (
                        filteredOwners.map((o) => {
                          const isSelected = formData.ownerId === o.id;
                          return (
                            <div
                              key={o.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  ownerId: o.id,
                                  ownerName: o.name,
                                  ownerPhone: o.phones[0] || '',
                                });
                              }}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{o.name}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>📞 {o.phones[0]}</span>
                                  {o.nationalId && <span>• 🪪 {o.nationalId}</span>}
                                </div>
                              </div>

                              {isSelected ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">محدد ✅</span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">انقر للاختيار</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                      <span>💡</span>
                      <span>سيتم حفظ بيانات المالك الجديد في قاعدة بيانات العملاء فور إضافة العقار:</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">اسم المالك بالكامل *</label>
                        <input
                          type="text"
                          required={ownerMode === 'new'}
                          value={newOwnerData.name}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, name: e.target.value })}
                          placeholder="مثال: المهندس أحمد محمود السيد"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">رقم الهاتف الرئيسي *</label>
                        <input
                          type="text"
                          required={ownerMode === 'new'}
                          value={newOwnerData.phone}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, phone: e.target.value })}
                          placeholder="01000000000"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">رقم هاتف ثانوي (إضافي)</label>
                        <input
                          type="text"
                          value={newOwnerData.secondaryPhone}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, secondaryPhone: e.target.value })}
                          placeholder="01100000000"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={newOwnerData.email}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, email: e.target.value })}
                          placeholder="owner@example.com"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">الرقم القومي / الهوية</label>
                        <input
                          type="text"
                          value={newOwnerData.nationalId}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, nationalId: e.target.value })}
                          placeholder="29501011234567"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">عنوان المالك السكني</label>
                        <input
                          type="text"
                          value={newOwnerData.address}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, address: e.target.value })}
                          placeholder="القاهرة - التجمع الخامس"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProperty(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                {editingProperty ? (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>حفظ التعديلات وتوثيق السجل</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>حفظ العقار ونشره</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Property Modal */}
      <SharePropertyModal property={sharingProperty} onClose={() => setSharingProperty(null)} />

      {/* Property Modification History Modal */}
      <PropertyHistoryModal
        isOpen={Boolean(historyProperty)}
        property={historyProperty}
        onClose={() => setHistoryProperty(null)}
        onPropertyChanged={(updated) => {
          setHistoryProperty(updated);
          if (selectedPropertyDetails && selectedPropertyDetails.id === updated.id) {
            setSelectedPropertyDetails(updated);
          }
          if (onUpdatePropertyState) {
            onUpdatePropertyState(updated);
          }
          if (onRefreshData) {
            onRefreshData();
          }
        }}
      />

      {/* Owner Followup Modal */}
      <OwnerFollowupModal
        isOpen={followupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        property={selectedPropForFollowup}
        properties={properties}
        owners={owners}
        onFollowupSuccess={() => {}}
      />

      {/* External Deal Incident Report Modal */}
      <ExternalDealReportModal
        isOpen={externalDealModalOpen}
        onClose={() => setExternalDealModalOpen(false)}
        properties={properties}
        onSuccess={() => {}}
      />

      {/* Reverse Matching Modal: Discovers clients seeking this property */}
      {reverseMatchProperty && (
        <ReverseMatchModal
          isOpen={true}
          onClose={() => setReverseMatchProperty(null)}
          property={reverseMatchProperty}
          currentUser={{ id: 'usr-1', name: 'أحمد مراد (مدير المبيعات)', role: 'ADMIN' }}
          onProposalCreated={() => {}}
        />
      )}

      {/* Smart Property Location Intelligence Modal */}
      {locationIntelProperty && (
        <LocationIntelligenceModal
          isOpen={true}
          onClose={() => setLocationIntelProperty(null)}
          property={locationIntelProperty}
          currentUser={{ id: 'usr-1', name: 'أحمد مراد (مدير المبيعات)', role: 'ADMIN' }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
