import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Award,
  ChevronLeft,
  Filter,
  PieChart,
  BarChart3,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Car,
  MapPin,
  Phone,
  Calendar,
} from 'lucide-react';
import { ExecutiveStats, Property, CustomerLead, PropertyViewing, AppTask, CommissionRecord, MarketingCampaign } from '../types';
import { ExecutiveAnalyticsCharts } from './ExecutiveAnalyticsCharts';
import { calculateViewingAlerts, ViewingAlert } from '../utils/viewingAlerts';

interface DashboardViewProps {
  stats: ExecutiveStats;
  properties: Property[];
  clients: CustomerLead[];
  viewings: PropertyViewing[];
  tasks: AppTask[];
  commissions?: CommissionRecord[];
  campaigns?: MarketingCampaign[];
  onNavigateTab: (tab: any) => void;
  onOpenNewProperty: () => void;
  onOpenNewLead: () => void;
  isDarkMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  properties,
  clients,
  viewings,
  tasks,
  commissions,
  campaigns,
  onNavigateTab,
  onOpenNewProperty,
  onOpenNewLead,
  isDarkMode = true,
}) => {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount || 0) + ' ج.م';
  };

  // Automated viewing alerts calculation
  const viewingAlerts = useMemo(() => calculateViewingAlerts(viewings), [viewings]);
  const criticalAlerts = useMemo(() => viewingAlerts.filter((a) => a.urgency === 'critical' || a.urgency === 'urgent'), [viewingAlerts]);

  const employeeRankings = [
    { name: 'م. محمود علي', role: 'مدير مبيعات التجمع', totalValue: '14,200,000 ج.م', deals: 8, avatar: 'م' },
    { name: 'أ. سناء هلال', role: 'مستشار كبار العملاء', totalValue: '9,800,000 ج.م', deals: 5, avatar: 'س' },
    { name: 'ك. ياسر جابر', role: 'مسئول مبيعات الشيخ زايد', totalValue: '7,400,000 ج.م', deals: 4, avatar: 'ي' },
    { name: 'د. هند الشافعي', role: 'مستشار العقارات التجارية', totalValue: '5,100,000 ج.م', deals: 3, avatar: 'هـ' },
  ];

  const quickStats = [
    {
      title: 'إجمالي العقارات بالمحفظة',
      value: properties.length || stats.totalProperties,
      subtext: '+3 وحدات جديدة هذا الأسبوع',
      change: '+12%',
      isPositive: true,
      icon: '🏘️',
      tab: 'properties',
      borderAccent: 'border-gold',
      textColor: 'text-amber-500',
    },
    {
      title: 'العملاء النشطون (Leads)',
      value: clients.length || stats.activeLeads,
      subtext: '4 عملاء مؤهلين للشراء',
      change: '+18.5%',
      isPositive: true,
      icon: '👥',
      tab: 'clients',
      borderAccent: 'border-blue-500',
      textColor: 'text-blue-500',
    },
    {
      title: 'إجمالي حجم المبيعات',
      value: `${(stats.totalRevenueEGP / 1000000).toFixed(1)}M ج.م`,
      subtext: 'مبيعات محققة في Q1',
      change: '+24%',
      isPositive: true,
      icon: '📈',
      tab: 'accounting',
      borderAccent: 'border-emerald-500',
      textColor: 'text-emerald-500',
    },
    {
      title: 'المعاينات الميدانية',
      value: viewings.length,
      subtext: `${viewingAlerts.length} معاينة قادمة ومجدولة`,
      change: '+8%',
      isPositive: true,
      icon: '🚗',
      tab: 'viewings',
      borderAccent: 'border-purple-500',
      textColor: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Quick Actions Bar */}
      <div className={`p-5 rounded-2xl border transition-all shadow-sm ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-slate-800'
          : 'bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 border-amber-200/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gold/20 text-amber-600 dark:text-amber-300 border border-gold/30">
                لوحة القيادة التنفيذية
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                تحديث حي مباشر
              </span>
            </div>
            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              مرحباً بكم: م. أحمد عيسوي (المدير التنفيذي) & أ. السيد محسن (المدير العام) 👋
            </h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              لوحة المتابعة التنفيذية الشاملة للأداء العقاري، الحسابات، والمبيعات لشركة الماسة.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenNewProperty}
              className="px-3.5 py-2 bg-gold hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عقار جديد</span>
            </button>

            <button
              onClick={onOpenNewLead}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>عميل جديد</span>
            </button>

            <button
              onClick={() => onNavigateTab('ai_assistant')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-gold/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>مساعد AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* AUTOMATED VIEWING ALERT SYSTEM (نظام التنبيهات الآلي للمعاينات المجدولة والعاجلة) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        criticalAlerts.length > 0
          ? isDarkMode
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-rose-50/80 border-rose-300'
          : isDarkMode
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              criticalAlerts.length > 0
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-amber-500/20 text-amber-500'
            }`}>
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  نظام التنبيهات الآلي للمعاينات الميدانية (Viewing Notification & Dispatch Center)
                </h3>
                {criticalAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {criticalAlerts.length} معاينة عاجلة
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                إشعارات وتنبيهات فورية للإدارة لتنسيق السيارات، السائقين، ومستشاري المبيعات قبل الموعد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigateTab('viewings')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Car className="w-3.5 h-3.5" />
              <span>إدارة جدول المعاينات بالكامل</span>
            </button>
          </div>
        </div>

        {/* Viewing alert items list */}
        {viewingAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {viewingAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  alert.urgency === 'critical'
                    ? isDarkMode
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-sm shadow-rose-950/50'
                      : 'bg-rose-50 border-rose-200'
                    : isDarkMode
                    ? 'bg-slate-800/60 border-slate-700/80'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${alert.badgeColor}`}>
                      {alert.badgeLabel}
                    </span>
                    <span className="text-xs font-mono font-black text-amber-500">
                      ⏰ {alert.timeFormatted}
                    </span>
                  </div>

                  <h4 className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {alert.propertyTitle || alert.propertyCode}
                  </h4>

                  <div className="text-[11px] space-y-1 mt-2 text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>العميل: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{alert.clientName}</strong></span>
                      {alert.clientPhone && (
                        <a
                          href={`tel:${alert.clientPhone}`}
                          className="text-amber-500 hover:underline flex items-center gap-1 font-mono font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{alert.clientPhone}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>المستشار: {alert.agentName}</span>
                      {alert.driverName && <span>🚗 السائق: {alert.driverName}</span>}
                    </div>
                    {alert.locationAddress && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{alert.locationAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${
                    alert.status === 'مؤكدة' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    الحالة: {alert.status}
                  </span>
                  <button
                    onClick={() => onNavigateTab('viewings')}
                    className="text-[11px] font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                  >
                    تأكيد / تفاصيل ←
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-slate-400">
            جميع المعاينات الميدانية مجدولة بانتظام، ولا توجد معاينات عاجلة تستلزم انتباه الإدارة حالياً.
          </div>
        )}
      </div>

      {/* High Density KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onNavigateTab(item.tab)}
            className={`glass p-4 rounded-2xl flex flex-col justify-between border-r-4 ${item.borderAccent} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.title}
                </p>
                <p className={`text-2xl font-black mt-1 ${item.textColor}`}>
                  {item.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                isDarkMode ? 'bg-slate-800/80 border border-slate-700/80' : 'bg-slate-100 border border-slate-200'
              }`}>
                {item.icon}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/20 text-[10px]">
              <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {item.subtext}
              </span>
              <span className="font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Recharts Analytics Section: Monthly Sales Evolution & Profitable Sources */}
      <ExecutiveAnalyticsCharts
        stats={stats}
        clients={clients}
        commissions={commissions}
        campaigns={campaigns}
        isDarkMode={isDarkMode}
        onNavigateTab={onNavigateTab}
      />

      {/* Main Content Area: Sales Funnel & Sub Cards + AI Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Sales Funnel Card */}
          <div className="glass p-5 rounded-2xl flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 accent-gold" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    مسار تحويل المبيعات (Sales Conversion Funnel)
                  </h3>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    معدل التحويل الكلي من العميل المحتمل حتى توقيع العقد النهائي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-800/20 dark:bg-slate-800 p-1 rounded-lg border border-slate-700/50">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                      timePeriod === p
                        ? 'bg-gold text-slate-950 shadow-xs'
                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'day' ? 'اليوم' : p === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}
                  </button>
                ))}
              </div>
            </div>

            {/* Funnel Progress Bars */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-bold">
                  <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    1. عملاء جدد (Lead Intake)
                  </span>
                  <span className="text-slate-400 font-mono">540 عميل (100%)</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-slate-400 rounded-full w-[100%] transition-all duration-500" />
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-bold">
                  <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    2. الاتصال والتأهيل (Contacted & Qualified)
                  </span>
                  <span className="text-blue-500 font-mono">320 عميل (59.2%)</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-blue-500 rounded-full w-[59.2%] transition-all duration-500" />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-bold">
                  <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    3. تنفيذ المعاينات الميدانية (Viewings Done)
                  </span>
                  <span className="text-amber-500 font-mono">124 معاينة (22.9%)</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gold rounded-full w-[22.9%] transition-all duration-500" />
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-bold">
                  <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    4. إغلاق الصفقات والتوقيع (Deals Won)
                  </span>
                  <span className="text-emerald-500 font-mono">42 صفقة (7.7%)</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full w-[14%] transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub Row: Upcoming Viewings & Best Sales Agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Viewings */}
            <div className="glass p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-700/20">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <CalendarCheck className="w-4 h-4 text-amber-500" />
                  <span>المعاينات الميدانية القادمة</span>
                </h3>
                <button
                  onClick={() => onNavigateTab('viewings')}
                  className="text-[11px] accent-gold font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>الكل</span>
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {viewings.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-slate-800/50 border-slate-700/70 hover:border-gold/40'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-amber-500">{v.viewingTime}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        v.status === 'مؤكدة' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {v.propertyTitle}
                    </p>
                    <div className={`flex items-center justify-between text-[10px] mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>العميل: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{v.clientName}</strong></span>
                      <span>مسئول المعاينة: {v.agentName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sales Agents Leaderboard */}
            <div className="glass p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-700/20">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Award className="w-4 h-4 text-gold" />
                  <span>أفضل المستشارين أداءً</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded">
                  Q1 Leaderboard
                </span>
              </div>

              <div className="space-y-3">
                {employeeRankings.map((emp, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-gold text-slate-950 shadow-sm' : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-gold/40 flex items-center justify-center font-bold text-xs text-amber-600 dark:text-amber-400 shrink-0">
                      {emp.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {emp.name}
                      </p>
                      <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {emp.role}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-emerald-500">
                        {emp.totalValue}
                      </p>
                      <p className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {emp.deals} صفقات
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) AI Assistant & Activity Stream */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Smart Assistant Insights Widget */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDarkMode
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800'
              : 'bg-gradient-to-b from-amber-500/10 to-white border-amber-200'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    مساعد الماسة الذكي
                  </h3>
                </div>
                <span className="text-[10px] bg-gold/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  AI Active
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isDarkMode ? 'bg-slate-800/70 border-slate-700/80 text-slate-200' : 'bg-white border-amber-200/80 text-slate-800 shadow-xs'
              }`}>
                <p className="font-semibold text-amber-600 dark:text-amber-300 mb-1">
                  💡 توصية نظام المبيعات:
                </p>
                تم رصد زيادة في طلبات شقق التجمع الخامس بنسبة 35%. يُنصح بإعادة استهداف العملاء المهتمين بالتجمع ببوستات تسويقية مخصصة عبر مساعد الذكاء الاصطناعي.
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => onNavigateTab('ai_assistant')}
                  className="w-full py-2 bg-gold hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد وصف وإعلان بالذكاء الاصطناعي</span>
                </button>
                <button
                  onClick={() => onNavigateTab('marketing')}
                  className={`w-full py-2 font-bold text-xs rounded-xl border transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  إطلاق حملة تسويقية جديدة
                </button>
              </div>
            </div>
          </div>

          {/* Live System Activity Feed */}
          <div className="glass p-5 rounded-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/20">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-4 h-4 text-blue-500" />
                <span>سجل النشاطات المباشرة</span>
              </h3>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                تحديث تلقائي
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 text-xs items-start">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/10" />
                <div className="flex-1">
                  <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    تم تسجيل عربون حجز لشقة <strong className="accent-gold">ALM-101</strong>
                  </p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>منذ 15 دقيقة • بواسطة محمود علي</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs items-start">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-blue-500/10" />
                <div className="flex-1">
                  <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    إضافة عميل محتمل جديد: <strong className="text-blue-500">د. طارق مراد</strong>
                  </p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>منذ 45 دقيقة • من إعلان فيسبوك</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs items-start">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0 ring-4 ring-amber-500/10" />
                <div className="flex-1">
                  <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    تمت معاينة بنجاح: <strong className="text-amber-500">فيلا زايد ديجويا</strong>
                  </p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>منذ 3 ساعات • العميل أظهر اهتماماً عليالً</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
