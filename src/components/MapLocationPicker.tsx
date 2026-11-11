import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Compass,
  Navigation,
  School,
  Stethoscope,
  ShoppingBag,
  Bus,
  Trees,
  Landmark,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { NearbyPlace } from '../types';

export interface MapLocationPickerProps {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
  city?: string;
  governorate?: string;
  mode?: 'admin' | 'client';
  onChange: (data: {
    lat: number;
    lng: number;
    address: string;
    district: string;
    city?: string;
    governorate?: string;
    nearbyPlaces?: NearbyPlace[];
    marketingDescription?: string;
  }) => void;
}

// Preset popular Cairo/Giza real-estate hubs with accurate coordinates
const POPULAR_LOCATIONS = [
  { name: 'التسعين الشمالي (القاهرة الجديدة)', district: 'التجمع الخامس', city: 'القاهرة الجديدة', governorate: 'القاهرة', lat: 30.0255, lng: 31.4365 },
  { name: 'التسعين الجنوبي - المستثمرين', district: 'التجمع الخامس', city: 'القاهرة الجديدة', governorate: 'القاهرة', lat: 30.0195, lng: 31.4988 },
  { name: 'محور محمد نجيب - النرجس', district: 'التجمع الخامس', city: 'القاهرة الجديدة', governorate: 'القاهرة', lat: 30.0289, lng: 31.4552 },
  { name: 'محور 26 يوليو (الشيخ زايد)', district: 'الشيخ زايد', city: 'الشيخ زايد', governorate: 'الجيزة', lat: 30.0385, lng: 31.0022 },
  { name: 'طريق الواحات - مدخل أكتوبر', district: '6 أكتوبر', city: '6 أكتوبر', governorate: 'الجيزة', lat: 29.9728, lng: 31.0185 },
  { name: 'محور بن زايد (العاصمة الإدارية)', district: 'الحي السكني R3', city: 'العاصمة الإدارية', governorate: 'القاهرة', lat: 30.0185, lng: 31.7125 },
  { name: 'دجلة المعادي (شارع 9)', district: 'المعادي', city: 'المعادي', governorate: 'القاهرة', lat: 29.9612, lng: 31.2785 },
  { name: 'طريق السويس - مدخل الشروق', district: 'الشروق', city: 'الشروق', governorate: 'القاهرة', lat: 30.1342, lng: 31.6215 },
  { name: 'شارع الثورة (مصر الجديدة)', district: 'مصر الجديدة', city: 'القاهرة', governorate: 'القاهرة', lat: 30.0982, lng: 31.3355 },
];

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  lat: initialLat,
  lng: initialLng,
  address: initialAddress = '',
  district: initialDistrict = 'التجمع الخامس',
  city: initialCity = 'القاهرة الجديدة',
  governorate: initialGovernorate = 'القاهرة',
  mode = 'admin',
  onChange,
}) => {
  const [currentLat, setCurrentLat] = useState<number>(initialLat || 30.0275);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 31.4721);
  const [address, setAddress] = useState<string>(initialAddress);
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [streetQuery, setStreetQuery] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(2500);

  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [marketingDescription, setMarketingDescription] = useState<string>('');
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [mapZoom, setMapZoom] = useState<number>(13);

  // Sync internal state if external props change
  useEffect(() => {
    if (initialLat && initialLat !== currentLat) setCurrentLat(initialLat);
    if (initialLng && initialLng !== currentLng) setCurrentLng(initialLng);
    if (initialAddress && initialAddress !== address) setAddress(initialAddress);
    if (initialDistrict && initialDistrict !== district) setDistrict(initialDistrict);
  }, [initialLat, initialLng, initialAddress, initialDistrict]);

  // Fetch nearby services when coordinates change
  const fetchNearbyServices = async (lat: number, lng: number, streetOrDist?: string) => {
    setIsLoadingPlaces(true);
    try {
      const res = await api.lookupNearbyPlaces({
        lat,
        lng,
        radiusMeters,
        streetOrDistrict: streetOrDist || district || address,
      });

      setNearbyPlaces(res.places || []);
      setMarketingDescription(res.description || '');

      onChange({
        lat,
        lng,
        address: address || streetOrDist || '',
        district,
        city: initialCity,
        governorate: initialGovernorate,
        nearbyPlaces: res.places || [],
        marketingDescription: res.description || '',
      });
    } catch (err) {
      console.error('Failed to lookup nearby places:', err);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNearbyServices(currentLat, currentLng, address);
  }, []);

  // Handle clicking on preset location
  const handleSelectPreset = (loc: typeof POPULAR_LOCATIONS[0]) => {
    setCurrentLat(loc.lat);
    setCurrentLng(loc.lng);
    setDistrict(loc.district);
    const newAddr = address || loc.name;
    setAddress(newAddr);
    setStreetQuery(loc.name);
    fetchNearbyServices(loc.lat, loc.lng, loc.name);
  };

  // Handle Street / Address Search
  const handleSearchStreet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetQuery.trim()) return;

    // Check if query matches any known preset or district
    const query = streetQuery.toLowerCase().trim();
    const matched = POPULAR_LOCATIONS.find(
      (l) => l.name.toLowerCase().includes(query) || l.district.toLowerCase().includes(query)
    );

    let targetLat = currentLat;
    let targetLng = currentLng;
    let targetDistrict = district;

    if (matched) {
      targetLat = matched.lat;
      targetLng = matched.lng;
      targetDistrict = matched.district;
    } else if (query.includes('زايد')) {
      targetLat = 30.0385;
      targetLng = 31.0022;
      targetDistrict = 'الشيخ زايد';
    } else if (query.includes('أكتوبر') || query.includes('واحات')) {
      targetLat = 29.9728;
      targetLng = 31.0185;
      targetDistrict = '6 أكتوبر';
    } else if (query.includes('عاصمة')) {
      targetLat = 30.0185;
      targetLng = 31.7125;
      targetDistrict = 'العاصمة الإدارية';
    } else if (query.includes('معادي')) {
      targetLat = 29.9612;
      targetLng = 31.2785;
      targetDistrict = 'المعادي';
    } else if (query.includes('شروق')) {
      targetLat = 30.1342;
      targetLng = 31.6215;
      targetDistrict = 'الشروق';
    } else if (query.includes('مصر الجديدة')) {
      targetLat = 30.0982;
      targetLng = 31.3355;
      targetDistrict = 'مصر الجديدة';
    } else {
      // Default nearby offset
      targetLat = 30.0275 + (Math.random() - 0.5) * 0.01;
      targetLng = 31.4721 + (Math.random() - 0.5) * 0.01;
      targetDistrict = district || 'التجمع الخامس';
    }

    setCurrentLat(targetLat);
    setCurrentLng(targetLng);
    setDistrict(targetDistrict);
    setAddress(streetQuery);
    fetchNearbyServices(targetLat, targetLng, streetQuery);
  };

  // Interactive Map click: calculate approximate lat/lng offset
  const handleMapCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Normalizing from center of canvas
    const normX = (clickX / rect.width - 0.5) * 2;
    const normY = (clickY / rect.height - 0.5) * 2;

    // Convert to lat/lng offset based on zoom
    const deltaScale = 0.03 / (mapZoom / 10);
    const newLat = Number((currentLat - normY * deltaScale).toFixed(5));
    const newLng = Number((currentLng + normX * deltaScale).toFixed(5));

    setCurrentLat(newLat);
    setCurrentLng(newLng);
    fetchNearbyServices(newLat, newLng, address);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'تعليم':
        return <School className="w-4 h-4 text-amber-400" />;
      case 'صحة':
        return <Stethoscope className="w-4 h-4 text-rose-400" />;
      case 'تسوق':
        return <ShoppingBag className="w-4 h-4 text-indigo-400" />;
      case 'مواصلات':
        return <Bus className="w-4 h-4 text-cyan-400" />;
      case 'ترفيه':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      default:
        return <Landmark className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'الكل') return nearbyPlaces;
    return nearbyPlaces.filter((p) => p.category === selectedCategory);
  }, [nearbyPlaces, selectedCategory]);

  return (
    <div className="space-y-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 p-4 text-slate-200">
      {/* Top Banner / Privacy Guarantee */}
      {mode === 'client' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-emerald-300">أمان وخصوصية تامة لموقع عقارك 🔒</h4>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              وفقاً لسياسة الخصوصية الصارمة لشركة الماسة، لن يتم إظهار رقم العقار أو الإحداثيات الدقيقة للجمهور على الموقع،
              وسيتم فقط عرض اسم الحي وأبرز الخدمات والمرافق المحيطة (المدارس، المستشفيات، والمولات) لتعظيم القيمة التسويقية.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>تحديد موقع العقار على الخريطة والتحليل الجغرافي الذكي</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  محدث حياً
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                انقر على الخريطة أو ابحث عن الشارع لتعيين الإحداثيات وجلب كافة الخدمات المحيطة تلقائياً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fetchNearbyServices(currentLat, currentLng, address)}
              disabled={isLoadingPlaces}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlaces ? 'animate-spin' : ''}`} />
              <span>تحديث الخدمات المحيطة</span>
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* Street & Landmark Search Input */}
      <form onSubmit={handleSearchStreet} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={streetQuery}
            onChange={(e) => setStreetQuery(e.target.value)}
            placeholder="اكتب اسم الشارع أو المعلم القريب (مثال: شارع التسعين، محور 26 يوليو، نادي بتروسبورت...)"
            className="w-full pr-9 pl-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>تحديد الموقع</span>
        </button>
      </form>

      {/* Quick Location Pills */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
          مواقع ومحاور رئيسية سريعة:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected =
              Math.abs(loc.lat - currentLat) < 0.005 && Math.abs(loc.lng - currentLng) < 0.005;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectPreset(loc)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Stylized Map View */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
        {/* Map Header Bar */}
        <div className="absolute top-2 right-2 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] flex items-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">الخريطة التفاعلية</span>
          <span className="text-slate-400">| انقر في أي مكان لتثبيت الدبوس</span>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setMapZoom((prev) => Math.min(prev + 1, 18))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-lg border border-slate-700 flex items-center justify-center text-xs shadow-md cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setMapZoom((prev) => Math.max(prev - 1, 10))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-lg border border-slate-700 flex items-center justify-center text-xs shadow-md cursor-pointer"
          >
            -
          </button>
        </div>

        {/* Map Surface Grid with vector styling */}
        <div
          onClick={handleMapCanvasClick}
          className="w-full h-56 sm:h-64 relative cursor-crosshair overflow-hidden select-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 60%),
              linear-gradient(to right, rgba(51, 65, 85, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px',
            backgroundColor: '#090d16',
          }}
        >
          {/* Stylized vector roads & metro lines */}
          <svg className="w-full h-full opacity-40 pointer-events-none absolute inset-0">
            <path d="M 0 120 Q 200 80, 450 140 T 900 110" fill="none" stroke="#f59e0b" strokeWidth="4" />
            <path d="M 80 0 Q 140 180, 260 300" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
            <path d="M 400 0 L 450 300" fill="none" stroke="#64748b" strokeWidth="6" />
            <path d="M 0 200 C 250 240, 500 160, 800 220" fill="none" stroke="#10b981" strokeWidth="3" />
            <circle cx="450" cy="140" r="8" fill="#f59e0b" fillOpacity="0.6" />
            <circle cx="200" cy="80" r="6" fill="#38bdf8" fillOpacity="0.6" />
            <circle cx="650" cy="190" r="7" fill="#10b981" fillOpacity="0.6" />
          </svg>

          {/* Area Labels on Canvas */}
          <div className="absolute top-6 left-12 text-[10px] text-slate-500 font-bold tracking-wider pointer-events-none">
            محور 26 يوليو • الشيخ زايد
          </div>
          <div className="absolute bottom-6 right-8 text-[10px] text-amber-500/70 font-bold tracking-wider pointer-events-none">
            شارع التسعين • التجمع الخامس
          </div>
          <div className="absolute top-10 right-16 text-[10px] text-sky-500/70 font-bold tracking-wider pointer-events-none">
            طريق السويس • الشروق
          </div>
          <div className="absolute bottom-8 left-16 text-[10px] text-emerald-500/70 font-bold tracking-wider pointer-events-none">
            محور بن زايد • العاصمة الإدارية
          </div>

          {/* Selected Coordinates Pin in the Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            <div className="relative">
              <span className="absolute -inset-2 rounded-full bg-amber-500 opacity-75 animate-ping" />
              <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl border-2 border-white relative z-10">
                <MapPin className="w-5 h-5 fill-slate-950" />
              </div>
            </div>
            <div className="mt-1.5 px-2.5 py-1 bg-slate-900/95 border border-amber-500/60 rounded-lg text-white font-bold text-[10px] shadow-lg whitespace-nowrap">
              📍 موقع العقار المحدد: {district}
            </div>
          </div>
        </div>

        {/* Bottom Coordinates & Address bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-semibold">العنوان والموقع:</span>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                onChange({
                  lat: currentLat,
                  lng: currentLng,
                  address: e.target.value,
                  district,
                  city: initialCity,
                  governorate: initialGovernorate,
                  nearbyPlaces,
                  marketingDescription,
                });
              }}
              placeholder="اكتب العنوان بالتفصيل..."
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs w-48 sm:w-72 focus:outline-none focus:border-amber-500"
            />
          </div>

          {mode === 'admin' && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>الإحداثيات:</span>
              <span className="font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Discovered Surrounding Services & Amenities */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h5 className="text-xs font-bold text-white">
              الخدمات والمعالم المحيطة المكتشفة ({nearbyPlaces.length} معلم وخدمة)
            </h5>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
            {['الكل', 'تعليم', 'صحة', 'تسوق', 'مواصلات', 'ترفيه', 'خدمات عامة'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoadingPlaces ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>جاري مسح وتحليل الخدمات المحيطة بالعقار...</span>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            لم يتم العثور على معالم محددة في هذا النطاق، انقر لتغيير الموقع أو توسيع نطاق البحث.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredPlaces.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-start gap-2.5 transition-colors text-xs"
              >
                <div className="p-1.5 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                  {getCategoryIcon(p.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white truncate">{p.name}</span>
                    <span className="text-[10px] text-amber-400 shrink-0 font-mono">
                      {p.distanceFormatted.split('(')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    <span>{p.type}</span>
                    {p.address && <span> • {p.address}</span>}
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>متاح لزوار الموقع ضمن مزايا الحي</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marketing Location Summary */}
        {marketingDescription && (
          <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="font-bold text-amber-300 block mb-1">
              📝 ملخص القيمة التسويقية للموقع والخدمات:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
              {marketingDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
