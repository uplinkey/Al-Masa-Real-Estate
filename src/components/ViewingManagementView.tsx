import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Clock,
  MapPin,
  Car,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageCircle,
  Check,
  X,
  ExternalLink,
  Download,
  List,
  Grid,
  Share2,
  Building2,
  Eye,
  CalendarCheck
} from 'lucide-react';
import { PropertyViewing, Property, CustomerLead } from '../types';

interface ViewingManagementViewProps {
  viewings: PropertyViewing[];
  properties: Property[];
  clients: CustomerLead[];
  onAddViewing: (viewing: Partial<PropertyViewing>) => void;
  onUpdateViewingStatus: (id: string, status: any, feedback?: string) => void;
  isDarkMode?: boolean;
}

type CalendarViewMode = 'month' | 'week' | 'list';

const MONTH_NAMES_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const WEEK_DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ViewingManagementView: React.FC<ViewingManagementViewProps> = ({
  viewings,
  properties,
  clients,
  onAddViewing,
  onUpdateViewingStatus,
  isDarkMode = true,
}) => {
  // Calendar & View Mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Find latest viewing date or default to Feb 2026 (where the mock records are)
  const defaultDate = useMemo(() => {
    if (viewings.length > 0) {
      const dates = viewings.map((v) => new Date(v.viewingDate)).filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        // pick first viewing's date
        return new Date(viewings[0].viewingDate);
      }
    }
    return new Date(2026, 1, 18); // Feb 18, 2026
  }, [viewings]);

  const [currentDate, setCurrentDate] = useState<Date>(defaultDate);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    viewings[0]?.viewingDate || '2026-02-18'
  );

  // Filters
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Inspection Details
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedViewingForDetails, setSelectedViewingForDetails] = useState<PropertyViewing | null>(null);
  const [statusUpdateModalViewing, setStatusUpdateModalViewing] = useState<PropertyViewing | null>(null);
  const [newStatus, setNewStatus] = useState<'مجدولة' | 'مكتملة' | 'ملغاة' | 'مؤجلة'>('مكتملة');
  const [newFeedback, setNewFeedback] = useState<string>('');
  const [newResult, setNewResult] = useState<string>('مهتم بالشراء');

  // Form State for Adding Viewing
  const [formData, setFormData] = useState<Partial<PropertyViewing>>({
    propertyId: properties[0]?.id || '',
    propertyTitle: properties[0]?.title || '',
    propertyCode: properties[0]?.code || '',
    clientId: clients[0]?.id || '',
    clientName: clients[0]?.name || '',
    clientPhone: clients[0]?.phone || '',
    agentName: 'محمد سامي',
    driverName: 'عم إبراهيم',
    vehicle: 'تويوتا فورتشنر (أ د ج 159)',
    viewingDate: '2026-02-18',
    viewingTime: '04:00 مساءً',
    locationAddress: properties[0]?.address || 'التجمع الخامس - شارع التسعين الجنوبي',
    status: 'مجدولة',
    customerFeedback: '',
  });

  // Extract unique agents & vehicles for filter dropdowns
  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    viewings.forEach((v) => {
      if (v.agentName) set.add(v.agentName);
    });
    // Add default sales reps if missing
    set.add('محمد سامي');
    set.add('أحمد مراد');
    set.add('سارة يوسف');
    set.add('عمر خالد');
    return Array.from(set);
  }, [viewings]);

  const availableVehicles = useMemo(() => {
    const set = new Set<string>();
    viewings.forEach((v) => {
      if (v.vehicle) set.add(v.vehicle);
    });
    set.add('تويوتا فورتشنر (أ د ج 159)');
    set.add('نيسان صني (س ط ل 882)');
    set.add('كيا سبورتاج (ب ر ن 342)');
    return Array.from(set);
  }, [viewings]);

  // Filtered Viewings
  const filteredViewings = useMemo(() => {
    return viewings.filter((v) => {
      if (filterAgent !== 'all' && v.agentName !== filterAgent) return false;
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      if (filterVehicle !== 'all' && v.vehicle !== filterVehicle) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = v.propertyTitle?.toLowerCase().includes(q);
        const matchCode = v.propertyCode?.toLowerCase().includes(q);
        const matchClient = v.clientName?.toLowerCase().includes(q);
        const matchPhone = v.clientPhone?.toLowerCase().includes(q);
        const matchAddress = v.locationAddress?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchClient && !matchPhone && !matchAddress) {
          return false;
        }
      }
      return true;
    });
  }, [viewings, filterAgent, filterStatus, filterVehicle, searchQuery]);

  // Conflict Detection: check if any agent or vehicle has 2+ viewings on same day and close time
  const conflicts = useMemo(() => {
    const map = new Map<string, PropertyViewing[]>();
    filteredViewings.forEach((v) => {
      const keyAgent = `${v.viewingDate}_agent_${v.agentName}`;
      if (!map.has(keyAgent)) map.set(keyAgent, []);
      map.get(keyAgent)!.push(v);

      if (v.vehicle) {
        const keyVeh = `${v.viewingDate}_veh_${v.vehicle}`;
        if (!map.has(keyVeh)) map.set(keyVeh, []);
        map.get(keyVeh)!.push(v);
      }
    });

    const conflictList: { type: 'agent' | 'vehicle'; name: string; date: string; items: PropertyViewing[] }[] = [];
    map.forEach((items, key) => {
      if (items.length > 1) {
        if (key.includes('_agent_')) {
          conflictList.push({
            type: 'agent',
            name: items[0].agentName,
            date: items[0].viewingDate,
            items,
          });
        }
      }
    });
    return conflictList;
  }, [filteredViewings]);

  // Quick stats
  const stats = useMemo(() => {
    const total = viewings.length;
    const scheduled = viewings.filter((v) => v.status === 'مجدولة').length;
    const completed = viewings.filter((v) => v.status === 'مكتملة').length;
    const postponed = viewings.filter((v) => v.status === 'مؤجلة').length;
    const cancelled = viewings.filter((v) => v.status === 'ملغاة').length;

    // Viewings on selected date
    const onSelectedDate = filteredViewings.filter((v) => v.viewingDate === selectedDateStr).length;

    return { total, scheduled, completed, postponed, cancelled, onSelectedDate };
  }, [viewings, filteredViewings, selectedDateStr]);

  // Rep workload distribution
  const agentWorkload = useMemo(() => {
    const countMap: Record<string, number> = {};
    availableAgents.forEach((a) => (countMap[a] = 0));
    viewings.forEach((v) => {
      if (v.agentName) {
        countMap[v.agentName] = (countMap[v.agentName] || 0) + 1;
      }
    });
    return countMap;
  }, [viewings, availableAgents]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  const goToFeb2026 = () => {
    const feb = new Date(2026, 1, 18);
    setCurrentDate(feb);
    setSelectedDateStr('2026-02-18');
  };

  // Month Calendar Days Generator
  const monthCalendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      viewings: PropertyViewing[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dString = `${prevDate.getFullYear()}-${mStr}-${dStr}`;
      const dayViewings = filteredViewings.filter((v) => v.viewingDate === dString);
      days.push({
        dateStr: dString,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dString === todayStr,
        isSelected: dString === selectedDateStr,
        viewings: dayViewings,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dString = `${year}-${mStr}-${dStr}`;
      const dayViewings = filteredViewings.filter((v) => v.viewingDate === dString);
      days.push({
        dateStr: dString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dString === todayStr,
        isSelected: dString === selectedDateStr,
        viewings: dayViewings,
      });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dString = `${nextDate.getFullYear()}-${mStr}-${dStr}`;
      const dayViewings = filteredViewings.filter((v) => v.viewingDate === dString);
      days.push({
        dateStr: dString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dString === todayStr,
        isSelected: dString === selectedDateStr,
        viewings: dayViewings,
      });
    }

    return days;
  }, [currentDate, filteredViewings, selectedDateStr]);

  // Week Calendar Days Generator
  const weekCalendarData = useMemo(() => {
    // Determine the week of the selectedDateStr or currentDate
    const base = new Date(selectedDateStr || currentDate);
    const dayOfWeek = isNaN(base.getDay()) ? 0 : base.getDay(); // 0 is Sunday
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - dayOfWeek);

    const weekDays = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${dayNum}`;

      const dayViewings = filteredViewings.filter((v) => v.viewingDate === dateString);

      weekDays.push({
        dateStr: dateString,
        dayName: WEEK_DAYS_AR[i],
        dayNumber: d.getDate(),
        monthName: MONTH_NAMES_AR[d.getMonth()],
        isToday: dateString === todayStr,
        isSelected: dateString === selectedDateStr,
        viewings: dayViewings,
      });
    }

    return weekDays;
  }, [currentDate, selectedDateStr, filteredViewings]);

  // Week navigation
  const prevWeek = () => {
    const base = new Date(selectedDateStr || currentDate);
    base.setDate(base.getDate() - 7);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    const newStr = `${y}-${m}-${d}`;
    setSelectedDateStr(newStr);
    setCurrentDate(base);
  };

  const nextWeek = () => {
    const base = new Date(selectedDateStr || currentDate);
    base.setDate(base.getDate() + 7);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    const newStr = `${y}-${m}-${d}`;
    setSelectedDateStr(newStr);
    setCurrentDate(base);
  };

  // Selected date viewings
  const viewingsForSelectedDate = useMemo(() => {
    return filteredViewings.filter((v) => v.viewingDate === selectedDateStr);
  }, [filteredViewings, selectedDateStr]);

  // Handle Add Viewing Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddViewing(formData);
    setShowAddModal(false);
  };

  // Quick WhatsApp message generator
  const sendWhatsAppReminder = (v: PropertyViewing) => {
    const text = encodeURIComponent(
      `مرحباً ${v.clientName} المحترم،\nنود تذكير سيادتكم بموعد معاينة عقار شركة الماسة للتطوير والاستثمار العقاري:\n` +
      `🏷️ العقار: ${v.propertyTitle} (${v.propertyCode})\n` +
      `📍 العنوان: ${v.locationAddress}\n` +
      `📅 الموعد: ${v.viewingDate} الساعة ${v.viewingTime}\n` +
      `👤 المستشار العقاري: ${v.agentName}\n` +
      `🚗 السائق المرافق: ${v.driverName || 'سائق الماسة'} - ${v.vehicle || ''}\n` +
      `نتمنى لكم جولة موفقة ومثمرة دائماً!`
    );
    window.open(`https://wa.me/${v.clientPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  // Generate iCalendar / Google Calendar link
  const openGoogleCalendar = (v: PropertyViewing) => {
    const title = encodeURIComponent(`معاينة عقار الماسة [${v.propertyCode}] - ${v.clientName}`);
    const details = encodeURIComponent(
      `معاينة عقار: ${v.propertyTitle}\nالعميل: ${v.clientName} (${v.clientPhone})\nالمستشار العقاري: ${v.agentName}\nالسائق والسيارة: ${v.driverName} - ${v.vehicle}\nالعنوان: ${v.locationAddress}`
    );
    const location = encodeURIComponent(v.locationAddress);

    // Format date YYYYMMDD
    const cleanDate = v.viewingDate.replace(/-/g, '');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${cleanDate}T140000Z/${cleanDate}T153000Z`;
    window.open(gCalUrl, '_blank');
  };

  // Handle Status Update
  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusUpdateModalViewing) {
      onUpdateViewingStatus(
        statusUpdateModalViewing.id,
        newStatus,
        newFeedback ? `${newFeedback} [النتيجة: ${newResult}]` : undefined
      );
      setStatusUpdateModalViewing(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'مكتملة':
        return isDarkMode
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'مجدولة':
        return isDarkMode
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'مؤجلة':
        return isDarkMode
          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
          : 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'ملغاة':
        return isDarkMode
          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  جدول ومواعيد المعاينات
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  جدولة المعاينات الميدانية وتوزيع مواعيد المستشارين وحركة السيارات.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-black'
                }`}
                title="عرض شهري"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>شهري</span>
              </button>

              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-black'
                }`}
                title="عرض أسبوعي"
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>أسبوعي</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-black'
                }`}
                title="عرض القائمة"
              >
                <List className="w-3.5 h-3.5" />
                <span>قائمة</span>
              </button>
            </div>

            {/* Quick Add Viewing Button */}
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  viewingDate: selectedDateStr,
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>جدولة معاينة</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className={`p-3 rounded-xl border ${
            isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي المعاينات</span>
            <div className={`text-lg font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.total}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-[10px] font-bold text-amber-500 block">المعاينات المجدولة</span>
            <div className="text-lg font-black mt-0.5 text-amber-400">
              {stats.scheduled}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className="text-[10px] font-bold text-emerald-500 block">معاينات مكتملة</span>
            <div className="text-lg font-black mt-0.5 text-emerald-400">
              {stats.completed}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
          }`}>
            <span className="text-[10px] font-bold text-purple-400 block">معاينات مؤجلة</span>
            <div className="text-lg font-black mt-0.5 text-purple-400">
              {stats.postponed}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDarkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-[10px] font-bold text-rose-400 block">ملغاة أو مرفوضة</span>
            <div className="text-lg font-black mt-0.5 text-rose-400">
              {stats.cancelled}
            </div>
          </div>

          <div className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            isDarkMode
              ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}
          onClick={() => {
            const el = document.getElementById('selected-day-panel');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          >
            <span className="text-[10px] font-bold text-blue-400 block">معاينات اليوم المحدد</span>
            <div className="text-lg font-black mt-0.5 text-blue-400 flex items-center justify-between">
              <span>{stats.onSelectedDate}</span>
              <span className="text-[10px] font-normal text-slate-400">{selectedDateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Rep Planning Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالعميل، كود العقار، الموقع..."
              className={`w-full pr-9 pl-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
                isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className={`text-xs px-2.5 py-2 rounded-xl border font-bold cursor-pointer focus:outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">كل مناديب المبيعات</option>
              {availableAgents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent} ({agentWorkload[agent] || 0} معاينة)
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle / Driver Filter */}
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className={`text-xs px-2.5 py-2 rounded-xl border font-bold cursor-pointer focus:outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">كل السيارات والحركة</option>
              {availableVehicles.map((veh) => (
                <option key={veh} value={veh}>
                  {veh}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`text-xs px-2.5 py-2 rounded-xl border font-bold cursor-pointer focus:outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">جميع الحالات</option>
              <option value="مجدولة">مجدولة فقط</option>
              <option value="مكتملة">مكتملة فقط</option>
              <option value="مؤجلة">مؤجلة فقط</option>
              <option value="ملغاة">ملغاة فقط</option>
            </select>
          </div>
        </div>

        {/* Quick Date Jumps */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToFeb2026}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              currentDate.getMonth() === 1 && currentDate.getFullYear() === 2026
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
            }`}
          >
            شهر المعاينات (فبراير 2026)
          </button>

          <button
            onClick={goToToday}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
            }`}
          >
            اليوم الحالي
          </button>
        </div>
      </div>

      {/* Schedule Conflict Warning (if any) */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-400">
              تنبيه تخطيط: يوجد تعارض محتمل في جدول المعاينات ({conflicts.length} مواعيد متقاربة في نفس اليوم):
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {conflicts.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold"
                >
                  {c.name} لديه {c.items.length} معاينات يوم {c.date} (
                  {c.items.map((it) => it.viewingTime).join(' و ')})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rep Workload Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {availableAgents.map((agent) => {
          const count = agentWorkload[agent] || 0;
          const isSelected = filterAgent === agent;
          return (
            <button
              key={agent}
              onClick={() => setFilterAgent(isSelected ? 'all' : agent)}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-400'
                  : isDarkMode
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 truncate">{agent}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400">
                  {count} زيارة
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {count > 0 ? `${count} معاينات مجدولة للمندوب` : 'لا توجد معاينات مجدولة'}
              </p>
            </button>
          );
        })}
      </div>

      {/* MAIN VIEW AREA: MONTH, WEEK, OR LIST */}

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
                title="الشهر السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <h2 className={`text-lg sm:text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {MONTH_NAMES_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={nextMonth}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
                title="الشهر القادم"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">
                انقر على أي يوم لعرض تفاصيل المعاينات أو جدولة موعد جديد
              </span>
              <button
                onClick={() => {
                  setFormData({ ...formData, viewingDate: selectedDateStr });
                  setShowAddModal(true);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة لـ ({selectedDateStr})</span>
              </button>
            </div>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {WEEK_DAYS_AR.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 text-xs font-black rounded-lg ${
                  idx === 5 // Friday highlight
                    ? 'text-amber-400 bg-amber-500/10'
                    : isDarkMode
                    ? 'text-slate-400 bg-slate-800/40'
                    : 'text-slate-600 bg-slate-100'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7-Column Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthCalendarData.map((cell, idx) => {
              const hasViewings = cell.viewings.length > 0;
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[100px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 shadow-md ring-1 ring-amber-400/50'
                      : cell.isCurrentMonth
                      ? isDarkMode
                        ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      : isDarkMode
                      ? 'bg-slate-900/30 border-slate-900/50 opacity-40 hover:opacity-75'
                      : 'bg-slate-100/50 border-slate-200/50 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Day Number & Badges */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : isSelected
                          ? 'bg-amber-500/30 text-amber-300'
                          : isDarkMode
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasViewings && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {cell.viewings.length}
                      </span>
                    )}
                  </div>

                  {/* Viewing Pills for this Day */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {cell.viewings.slice(0, 2).map((v) => (
                      <div
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViewingForDetails(v);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border transition-transform hover:scale-[1.02] ${
                          v.status === 'مكتملة'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : v.status === 'مؤجلة'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : v.status === 'ملغاة'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                        title={`${v.viewingTime} - ${v.clientName} (${v.agentName})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span className="truncate">{v.viewingTime}</span>
                        <span className="truncate font-semibold">| {v.clientName}</span>
                      </div>
                    ))}

                    {cell.viewings.length > 2 && (
                      <div className="text-[9px] font-black text-amber-400/90 text-center py-0.5">
                        +{cell.viewings.length - 2} معاينات أخرى
                      </div>
                    )}
                  </div>

                  {/* Quick Add icon on hover */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate text-[9px]">
                      {cell.viewings[0]?.agentName ? cell.viewings[0].agentName.split(' ')[0] : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, viewingDate: cell.dateStr });
                        setShowAddModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-amber-400 p-0.5 rounded hover:bg-slate-700/50"
                      title="إضافة معاينة لهذا اليوم"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={prevWeek}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
                title="الأسبوع السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div>
                <h2 className={`text-lg sm:text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  أسبوع: {weekCalendarData[0]?.dayNumber} {weekCalendarData[0]?.monthName} -{' '}
                  {weekCalendarData[6]?.dayNumber} {weekCalendarData[6]?.monthName}
                </h2>
                <span className="text-xs text-slate-400">
                  عرض تخطيطي تفصيلي لتوزيع مواعيد مناديب المبيعات والسيارات
                </span>
              </div>

              <button
                onClick={nextWeek}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
                title="الأسبوع التالي"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setFormData({ ...formData, viewingDate: selectedDateStr });
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معاينة</span>
            </button>
          </div>

          {/* 7 Columns for the 7 days of the week */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekCalendarData.map((col) => {
              const isSelected = col.dateStr === selectedDateStr;
              return (
                <div
                  key={col.dateStr}
                  onClick={() => setSelectedDateStr(col.dateStr)}
                  className={`rounded-xl border p-3 flex flex-col gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/50'
                      : isDarkMode
                      ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                    <div>
                      <span className="text-xs font-black block text-amber-400">{col.dayName}</span>
                      <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {col.dayNumber} {col.monthName}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        col.isToday
                          ? 'bg-amber-500 text-slate-950'
                          : col.viewings.length > 0
                          ? 'bg-slate-700 text-amber-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {col.viewings.length}
                    </span>
                  </div>

                  {/* Day Schedule Cards */}
                  <div className="space-y-2 flex-1 min-h-[180px]">
                    {col.viewings.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
                        <span>لا توجد زيارات</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, viewingDate: col.dateStr });
                            setShowAddModal(true);
                          }}
                          className="mt-2 text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>حجز موعد</span>
                        </button>
                      </div>
                    ) : (
                      col.viewings.map((v) => (
                        <div
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedViewingForDetails(v);
                          }}
                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-transform hover:scale-[1.02] ${
                            isDarkMode ? 'bg-slate-900 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-amber-400 flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3" />
                              {v.viewingTime}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeClass(v.status)}`}>
                              {v.status}
                            </span>
                          </div>

                          <div className={`font-bold truncate text-[11px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {v.clientName}
                          </div>

                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-amber-500/70 shrink-0" />
                            <span>{v.propertyCode}</span>
                          </div>

                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate">{v.agentName}</span>
                          </div>

                          {v.vehicle && (
                            <div className="text-[9px] text-purple-300/80 truncate flex items-center gap-1 pt-1 border-t border-slate-800">
                              <Car className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{v.vehicle.split('(')[0]}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST / CARDS VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredViewings.length === 0 ? (
            <div className={`col-span-full p-12 text-center rounded-2xl border ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                لا توجد مواعيد معاينة مطابقة للتصفية
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                جرب تغيير مندوب المبيعات، الحالة، أو مسح خانة البحث
              </p>
            </div>
          ) : (
            filteredViewings.map((v) => (
              <div
                key={v.id}
                className={`p-5 rounded-2xl border shadow-lg space-y-4 transition-all hover:border-amber-500/50 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {v.propertyCode}
                    </span>
                    <h3 className={`text-sm font-bold mt-1 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {v.propertyTitle}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getStatusBadgeClass(v.status)}`}>
                    {v.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      العميل:
                    </span>
                    <span className="font-bold text-white">{v.clientName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      الموعد:
                    </span>
                    <span className="font-bold text-amber-300">
                      {v.viewingDate} ({v.viewingTime})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      المندوب:
                    </span>
                    <span className="font-bold text-slate-200">{v.agentName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Car className="w-3.5 h-3.5 text-purple-400" />
                      السيارة والسائق:
                    </span>
                    <span className="font-medium text-slate-300 truncate max-w-[160px]">
                      {v.driverName} - {v.vehicle}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-400 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="truncate">{v.locationAddress}</span>
                  </div>
                </div>

                {v.customerFeedback && (
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-amber-400 block text-[11px] mb-0.5">
                      ملاحظات ونتيجة المعاينة:
                    </span>
                    <p className="line-clamp-2">{v.customerFeedback}</p>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => sendWhatsAppReminder(v)}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      title="إرسال تذكير واتساب بالمعاينة"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openGoogleCalendar(v)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="إضافة لتقويم جوجل"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setStatusUpdateModalViewing(v);
                        setNewStatus(v.status);
                        setNewFeedback(v.customerFeedback || '');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold transition-all"
                    >
                      تحديث الحالة
                    </button>

                    <button
                      onClick={() => setSelectedViewingForDetails(v)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 font-bold transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>تفاصيل</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SELECTED DAY DETAILS ACCORDION / PANEL (When in Month/Week view) */}
      {(viewMode === 'month' || viewMode === 'week') && (
        <div
          id="selected-day-panel"
          className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  جدول مواعيد يوم: {selectedDateStr}
                </h3>
                <span className="text-xs text-slate-400">
                  {viewingsForSelectedDate.length} معاينات مجدولة للمناديب في هذا التاريخ
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  viewingDate: selectedDateStr,
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 text-xs font-black rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معاينة لهذا اليوم</span>
            </button>
          </div>

          {viewingsForSelectedDate.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>لا توجد مواعيد معاينات مجدولة في هذا اليوم. انقر فوق الزر أعلاه لإضافة موعد جديد.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {viewingsForSelectedDate.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {v.propertyCode}
                      </span>
                      <h4 className={`text-xs font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {v.propertyTitle}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${getStatusBadgeClass(v.status)}`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-amber-300">{v.viewingTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-bold text-white truncate">{v.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{v.agentName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Car className="w-3.5 h-3.5 text-purple-400" />
                      <span className="truncate">{v.driverName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-[10px] truncate">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">{v.locationAddress}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => sendWhatsAppReminder(v)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        title="إرسال تذكير واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openGoogleCalendar(v)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        title="إضافة لتقويم جوجل"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setStatusUpdateModalViewing(v);
                          setNewStatus(v.status);
                          setNewFeedback(v.customerFeedback || '');
                        }}
                        className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-[10px] font-bold hover:bg-slate-600"
                      >
                        تسجيل النتيجة
                      </button>
                      <button
                        onClick={() => setSelectedViewingForDetails(v)}
                        className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/30"
                      >
                        تفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEWING INSPECTION & DETAILS MODAL */}
      {selectedViewingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {selectedViewingForDetails.propertyCode}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedViewingForDetails.propertyTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedViewingForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-amber-400 block">بيانات العميل ومسار التواصل:</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">اسم العميل:</span>
                  <span className="font-bold text-white">{selectedViewingForDetails.clientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">الهاتف:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">{selectedViewingForDetails.clientPhone}</span>
                    <button
                      onClick={() => sendWhatsAppReminder(selectedViewingForDetails)}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>واتساب</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-amber-400 block">التوقيت واللوجستيات والمندوب:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">التاريخ والوقت:</span>
                    <span className="font-bold text-amber-300">
                      {selectedViewingForDetails.viewingDate} ({selectedViewingForDetails.viewingTime})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المستشار المسؤول:</span>
                    <span className="font-bold text-white">{selectedViewingForDetails.agentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">السائق المرافق:</span>
                    <span className="font-bold text-slate-200">
                      {selectedViewingForDetails.driverName || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">السيارة:</span>
                    <span className="font-bold text-slate-200">
                      {selectedViewingForDetails.vehicle || 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">عنوان المعاينة:</span>
                    <span className="text-slate-200 font-semibold">{selectedViewingForDetails.locationAddress}</span>
                  </div>
                </div>
              </div>

              {selectedViewingForDetails.customerFeedback && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="font-bold text-amber-400 block">ملاحظات ونتيجة المعاينة:</span>
                  <p className="text-slate-200">{selectedViewingForDetails.customerFeedback}</p>
                  {selectedViewingForDetails.result && (
                    <div className="pt-1 text-xs">
                      النتيجة: <strong className="text-amber-300">{selectedViewingForDetails.result}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openGoogleCalendar(selectedViewingForDetails)}
                  className="px-3 py-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>إضافة لتقويم جوجل</span>
                </button>

                <button
                  onClick={() => sendWhatsAppReminder(selectedViewingForDetails)}
                  className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStatusUpdateModalViewing(selectedViewingForDetails);
                    setNewStatus(selectedViewingForDetails.status);
                    setNewFeedback(selectedViewingForDetails.customerFeedback || '');
                    setSelectedViewingForDetails(null);
                  }}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  تعديل الحالة والنتيجة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS & FEEDBACK UPDATE MODAL */}
      {statusUpdateModalViewing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStatusUpdate}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">تسجيل نتيجة وحالة المعاينة</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  معاينة {statusUpdateModalViewing.clientName} - عقار {statusUpdateModalViewing.propertyCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusUpdateModalViewing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">حالة المعاينة *</label>
              <div className="grid grid-cols-4 gap-2">
                {(['مجدولة', 'مكتملة', 'مؤجلة', 'ملغاة'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      newStatus === st
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">انطباع ونتيجة العميل الميدانية</label>
              <select
                value={newResult}
                onChange={(e) => setNewResult(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              >
                <option value="مهتم بالشراء">مهتم بالشراء وجاري التفاوض</option>
                <option value="طلب تخفيض السعر">طلب تخفيض السعر أو تسهيلات</option>
                <option value="طلب بديل">طلب معاينة وحدة بديلة</option>
                <option value="غير مهتم">غير مهتم (العقار غير مناسب)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                ملاحظات المندوب التفصيلية بعد المعاينة
              </label>
              <textarea
                rows={3}
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="اكتب ملاحظات المعاينة، رأي العميل في التشطيب، نقاط القوة والاعتراضات..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusUpdateModalViewing(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                حفظ التحديث
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD VIEWING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">جدولة معاينة ميدانية جديدة</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  تحديد العقار، العميل، المندوب، والسيارة لتنظيم حركة الفريق الميداني
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">اختر العقار المعين *</label>
              <select
                value={formData.propertyId}
                onChange={(e) => {
                  const p = properties.find((item) => item.id === e.target.value);
                  setFormData({
                    ...formData,
                    propertyId: e.target.value,
                    propertyTitle: p?.title || '',
                    propertyCode: p?.code || '',
                    locationAddress: p?.address || p?.district || 'التجمع الخامس',
                  });
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} - ({p.price.toLocaleString('en-US')} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">اختر العميل *</label>
              <select
                value={formData.clientId}
                onChange={(e) => {
                  const c = clients.find((item) => item.id === e.target.value);
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    clientName: c?.name || '',
                    clientPhone: c?.phone || '',
                  });
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.preferredDistrict}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">تاريخ المعاينة *</label>
                <input
                  type="date"
                  required
                  value={formData.viewingDate}
                  onChange={(e) => setFormData({ ...formData, viewingDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">وقت المعاينة *</label>
                <select
                  value={formData.viewingTime}
                  onChange={(e) => setFormData({ ...formData, viewingTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="10:00 صباحاً">10:00 صباحاً</option>
                  <option value="11:30 صباحاً">11:30 صباحاً</option>
                  <option value="01:00 مساءً">01:00 مساءً</option>
                  <option value="02:30 مساءً">02:30 مساءً</option>
                  <option value="04:00 مساءً">04:00 مساءً</option>
                  <option value="05:30 مساءً">05:30 مساءً</option>
                  <option value="07:00 مساءً">07:00 مساءً</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">مندوب المبيعات المسؤول *</label>
                <select
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  {availableAgents.map((ag) => (
                    <option key={ag} value={ag}>
                      {ag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">سيارة المعاينة والسائق *</label>
                <select
                  value={formData.vehicle}
                  onChange={(e) => {
                    const veh = e.target.value;
                    let driver = 'عم إبراهيم';
                    if (veh.includes('نيسان')) driver = 'عم مصطفى';
                    if (veh.includes('كيا')) driver = 'كابتن هاني';
                    setFormData({ ...formData, vehicle: veh, driverName: driver });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  {availableVehicles.map((vh) => (
                    <option key={vh} value={vh}>
                      {vh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">عنوان ونقطة اللقاء *</label>
              <input
                type="text"
                required
                value={formData.locationAddress}
                onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                placeholder="التجمع الخامس - شارع التسعين الجنوبي، أمام بوابة الكمبوند"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">ملاحظات التحضير للمعاينة</label>
              <input
                type="text"
                value={formData.customerFeedback}
                onChange={(e) => setFormData({ ...formData, customerFeedback: e.target.value })}
                placeholder="مثلاً: العميل يرغب في التأكد من فتحات التكييف والفيو المباشر"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                تأكيد وجدولة المعاينة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
