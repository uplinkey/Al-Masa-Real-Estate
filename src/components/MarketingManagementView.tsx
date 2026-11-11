import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  ShieldAlert,
  Calendar,
  Filter,
  Search,
  CheckSquare,
  Building,
  RotateCcw,
  UserCheck,
  Eye,
  FileText,
  BadgePercent,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  Property,
  PropertyOwner,
  CustomerLead,
  MarketingCampaign,
  UnitAvailabilityStatus,
  OwnerFollowupRecord,
  FollowupTask,
  ExternalDealReport,
  DealClosing,
} from '../types';
import { api } from '../services/api';
import { OwnerFollowupModal } from './OwnerFollowupModal';
import { ExternalDealReportModal } from './ExternalDealReportModal';
import { DealClosingModal } from './DealClosingModal';
import { FollowupTaskModal } from './FollowupTaskModal';
import { TeamAssignmentModal } from './TeamAssignmentModal';

interface MarketingManagementViewProps {
  campaigns: MarketingCampaign[];
  onAddCampaign: (campaign: Partial<MarketingCampaign>) => void;
  properties?: Property[];
  owners?: PropertyOwner[];
  clients?: CustomerLead[];
  currentUser?: any;
  onRefreshData?: () => void;
  isDarkMode?: boolean;
}

const AVAILABILITY_COLORS: Record<UnitAvailabilityStatus, { text: string; bg: string; border: string }> = {
  'متاحة ومؤكدة': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'متاحة لكن تحتاج إعادة تأكيد': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'لم يتم الرد من المالك': { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'تحت التفاوض': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  'محجوزة': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'تم البيع': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  'تم التأجير': { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  'موقوفة بطلب المالك': { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  'غير متاحة لسبب آخر': { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export const MarketingManagementView: React.FC<MarketingManagementViewProps> = ({
  campaigns,
  onAddCampaign,
  properties = [],
  owners = [],
  clients = [],
  currentUser,
  onRefreshData,
  isDarkMode = true,
}) => {
  // Main Sub-tab selection
  const [activeSubTab, setActiveSubTab] = useState<
    'units' | 'tasks' | 'followups' | 'external_deals' | 'deal_closings' | 'marketers_performance' | 'campaigns'
  >('units');

  // Async Data States
  const [stats, setStats] = useState<any>(null);
  const [followups, setFollowups] = useState<OwnerFollowupRecord[]>([]);
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [externalDeals, setExternalDeals] = useState<ExternalDealReport[]>([]);
  const [dealClosings, setDealClosings] = useState<DealClosing[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<string>('الكل');
  const [filterDistrict, setFilterDistrict] = useState<string>('الكل');
  const [filterMarketer, setFilterMarketer] = useState<string>('الكل');
  const [filterValidity, setFilterValidity] = useState<string>('الكل'); // 'الكل' | 'صالح' | 'منتهي'

  // Modal States
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedPropForFollowup, setSelectedPropForFollowup] = useState<Property | null>(null);

  const [externalDealModalOpen, setExternalDealModalOpen] = useState(false);
  const [selectedReportForEdit, setSelectedReportForEdit] = useState<ExternalDealReport | null>(null);

  const [dealClosingModalOpen, setDealClosingModalOpen] = useState(false);
  const [selectedPropForClosing, setSelectedPropForClosing] = useState<Property | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToReassign, setTaskToReassign] = useState<FollowupTask | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedPropForAssignment, setSelectedPropForAssignment] = useState<Property | null>(null);

  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState<Partial<MarketingCampaign>>({
    name: '',
    platform: 'Facebook',
    budget: 50000,
    spend: 40000,
    leadsCount: 150,
    dealsWon: 3,
    status: 'نشطة',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, followupsData, tasksData, dealsData, closingsData, empsData] = await Promise.all([
        api.getMarketingDashboardStats().catch(() => null),
        api.getOwnerFollowups().catch(() => []),
        api.getFollowupTasks().catch(() => []),
        api.getExternalDeals().catch(() => []),
        api.getDealClosings().catch(() => []),
        api.getRbacUsers().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setFollowups(followupsData || []);
      setTasks(tasksData || []);
      setExternalDeals(dealsData || []);
      setDealClosings(closingsData || []);
      setEmployees(empsData || []);
    } catch (err) {
      console.error('Failed to load marketing dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
    if (onRefreshData) onRefreshData();
  };

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  const handleCancelDeal = async (closingId: string) => {
    const reason = prompt('يرجى إدخال سبب إلغاء الصفقة رسمياً:');
    if (!reason) return;
    try {
      await api.cancelDealClosing(closingId, reason);
      alert('تم إلغاء الصفقة بنجاح وإعادة الوحدة لحالة "تحتاج إعادة تأكيد".');
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء الصفقة');
    }
  };

  const handleReactivateProperty = async (propId: string) => {
    const reason = prompt('يرجى إدخال سبب إعادة التفعيل الإداري بعد المراجعة:');
    if (!reason) return;
    try {
      await api.reactivateProperty(propId, reason);
      alert('تمت إعادة تفعيل العقار بنجاح وتأكيد توافره.');
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إعادة التفعيل');
    }
  };

  const handleCompleteTask = async (task: FollowupTask) => {
    const outcome = prompt('أدخل نتيجة إنجاز مهمة المتابعة (مثال: تم التواصل وتأكيد التوافر):');
    if (!outcome) return;
    try {
      await api.completeFollowupTask(task.id, outcome);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إكمال المهمة');
    }
  };

  // Filter Properties
  const filteredProperties = properties.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDistrict = (p.district || '').toLowerCase().includes(q);
      const matchOwner = (p.ownerName || '').toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchDistrict && !matchOwner) return false;
    }
    if (filterAvailability !== 'الكل' && p.availabilityStatus !== filterAvailability) return false;
    if (filterDistrict !== 'الكل' && p.district !== filterDistrict) return false;
    if (filterMarketer !== 'الكل') {
      const assigned = p.assignedMarketerIds || [];
      if (!assigned.includes(filterMarketer)) return false;
    }
    if (filterValidity === 'صالح') {
      if (!p.confirmationValidUntil || new Date(p.confirmationValidUntil) <= new Date()) return false;
    }
    if (filterValidity === 'منتهي') {
      if (p.confirmationValidUntil && new Date(p.confirmationValidUntil) > new Date()) return false;
    }
    return true;
  });

  // Unique Districts
  const districts = Array.from(new Set(properties.map((p) => p.district).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <span>إدارة التسويق وتوافر الوحدات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة توافر الوحدات وسريان التأكيد وإسناد المهام للمسوقين والتحقق من الصفقات.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedPropForFollowup(null);
              setFollowupModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span>تسجيل متابعة</span>
          </button>

          <button
            onClick={() => {
              setTaskToReassign(null);
              setTaskModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>إنشاء مهمة</span>
          </button>

          <button
            onClick={() => {
              setSelectedReportForEdit(null);
              setExternalDealModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>بلاغ بيع خارجي</span>
          </button>

          <button
            onClick={() => {
              setSelectedPropForClosing(null);
              setDealClosingModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>اعتماد صفقة بيع (24h)</span>
          </button>

          <button
            onClick={handleRefresh}
            title="تحديث البيانات"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards: The 9 Availability States & Operational Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <div className="text-[10px] text-slate-400">إجمالي الوحدات</div>
          <div className="text-xl font-black text-white mt-0.5">{properties.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">المعروضة بالسيستم</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-md bg-emerald-500/5">
          <div className="text-[10px] text-emerald-400 font-bold">متاحة ومؤكدة</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {stats?.byAvailability?.['متاحة ومؤكدة'] || properties.filter((p) => p.availabilityStatus === 'متاحة ومؤكدة').length}
          </div>
          <div className="text-[10px] text-emerald-500/70 mt-1">جاهزة للمعاينة فوراً</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 shadow-md bg-amber-500/5">
          <div className="text-[10px] text-amber-400 font-bold">تحتاج إعادة تأكيد</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">
            {stats?.byAvailability?.['متاحة لكن تحتاج إعادة تأكيد'] || properties.filter((p) => p.availabilityStatus === 'متاحة لكن تحتاج إعادة تأكيد').length}
          </div>
          <div className="text-[10px] text-amber-500/70 mt-1">
            {stats?.expiredConfirmationCount || 0} منتهية الصلاحية
          </div>
        </div>

        <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-3 shadow-md bg-orange-500/5">
          <div className="text-[10px] text-orange-400 font-bold">لم يرد المالك</div>
          <div className="text-xl font-black text-orange-400 mt-0.5">
            {stats?.byAvailability?.['لم يتم الرد من المالك'] || properties.filter((p) => p.availabilityStatus === 'لم يتم الرد من المالك').length}
          </div>
          <div className="text-[10px] text-orange-500/70 mt-1">تتطلب إعادة اتصال</div>
        </div>

        <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-3 shadow-md bg-blue-500/5">
          <div className="text-[10px] text-blue-400 font-bold">تفاوض أو حجز</div>
          <div className="text-xl font-black text-blue-400 mt-0.5">
            {(stats?.byAvailability?.['تحت التفاوض'] || 0) + (stats?.byAvailability?.['محجوزة'] || 0)}
          </div>
          <div className="text-[10px] text-blue-500/70 mt-1">عروض قيد الحسم</div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-3 shadow-md bg-rose-500/5">
          <div className="text-[10px] text-rose-400 font-bold">بلاغات خارجية / صفقات</div>
          <div className="text-xl font-black text-rose-400 mt-0.5">
            {externalDeals.length + dealClosings.length}
          </div>
          <div className="text-[10px] text-rose-500/70 mt-1">
            {stats?.pendingExternalDeals || 0} قيد التحقيق
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'units', label: 'الوحدات والتوافر والمسوقين', icon: Building, badge: filteredProperties.length },
          { id: 'tasks', label: 'مهام المتابعة الدورية', icon: CheckSquare, badge: tasks.filter((t) => t.status === 'قيد الانتظار').length },
          { id: 'followups', label: 'سجل متابعات الملاك', icon: Phone, badge: followups.length },
          { id: 'external_deals', label: 'بلاغات البيع الخارجي والتحقيق', icon: ShieldAlert, badge: externalDeals.length },
          { id: 'deal_closings', label: 'الصفقات المعتمدة وأرشيف 24h', icon: Award, badge: dealClosings.length },
          { id: 'marketers_performance', label: 'أداء فريق التسويق والتقارير', icon: Users },
          { id: 'campaigns', label: 'الحملات الإعلانية الممولة', icon: Megaphone, badge: campaigns.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Tab 1: Units, Availability & Marketers Hub */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'units' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالكود، العنوان، أو المالك..."
                className="w-full pr-9 pl-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="الكل">حالة التوافر: الكل</option>
              {Object.keys(AVAILABILITY_COLORS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="الكل">المنطقة: الكل</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterValidity}
              onChange={(e) => setFilterValidity(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="الكل">صلاحية التأكيد: الكل</option>
              <option value="صالح">تأكيد سارٍ ونشط</option>
              <option value="منتهي">منتهي الصلاحية (يحتاج متابعة)</option>
            </select>

            <select
              value={filterMarketer}
              onChange={(e) => setFilterMarketer(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="الكل">المسوق المسؤول: الكل</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((prop) => {
              const availStatus = (prop.availabilityStatus as UnitAvailabilityStatus) || 'متاحة ومؤكدة';
              const colorInfo = AVAILABILITY_COLORS[availStatus] || AVAILABILITY_COLORS['متاحة ومؤكدة'];
              const isExpired = prop.confirmationValidUntil && new Date(prop.confirmationValidUntil) <= new Date();
              const is24hArchive = prop.dealClosingId && !prop.isArchived;

              return (
                <div
                  key={prop.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition hover:border-slate-700 ${
                    is24hArchive
                      ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 to-slate-900'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Status & 24h Archival Banner */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {prop.code}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                        >
                          {availStatus}
                        </span>

                        {isExpired && availStatus !== 'تم البيع' && availStatus !== 'تم التأجير' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>تأكيد منتهي</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {is24hArchive && (
                      <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 text-[10px] font-bold">
                        <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse text-rose-400" />
                        <span>تم إغلاق الصفقة - جاري الأرشفة بعد 24 ساعة ⏱️</span>
                      </div>
                    )}

                    {/* Title & Location */}
                    <div>
                      <h3 className="text-sm font-bold text-white hover:text-amber-400 transition">
                        {prop.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {prop.district} • {prop.city || 'القاهرة'} • {prop.areaSqM} م²
                      </p>
                    </div>

                    {/* Price & Owner Contact */}
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">السعر المطلوب:</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {formatEGP(prop.price)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-400">المالك:</span>
                        <span className="text-slate-300 font-bold truncate max-w-[140px]">
                          {prop.ownerName || 'مالك العقار'} ({prop.ownerPhone || '-'})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">آخر تأكيد:</span>
                        <span className="text-slate-300 font-mono">
                          {prop.lastConfirmedAt ? new Date(prop.lastConfirmedAt).toLocaleDateString('ar-EG') : 'لم يؤكد بعد'}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Marketers */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">فريق التسويق المكلف:</span>
                        <button
                          onClick={() => {
                            setSelectedPropForAssignment(prop);
                            setAssignmentModalOpen(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                        >
                          تعديل الإسناد ⚙️
                        </button>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {prop.assignedMarketerNames && prop.assignedMarketerNames.length > 0 ? (
                          prop.assignedMarketerNames.map((name, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">لا يوجد مسوقون مسندون حالياً</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-1.5 flex-wrap text-xs">
                    <button
                      onClick={() => {
                        setSelectedPropForFollowup(prop);
                        setFollowupModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>متابعة وتأكيد</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPropForClosing(prop);
                        setDealClosingModalOpen(true);
                      }}
                      disabled={availStatus === 'تم البيع' || availStatus === 'تم التأجير'}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      title="اعتماد صفقة بيع للوحدة"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>إغلاق الصفقة</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedReportForEdit(null);
                        setExternalDealModalOpen(true);
                      }}
                      className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold transition cursor-pointer"
                      title="إبلاغ بيع خارجي"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    </button>

                    {(availStatus === 'تم البيع' || availStatus === 'تم التأجير' || availStatus === 'موقوفة بطلب المالك') && (
                      <button
                        onClick={() => handleReactivateProperty(prop.id)}
                        className="py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 font-bold transition cursor-pointer"
                        title="إعادة تفعيل الوحدة إدارياً"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 2: Follow-up Tasks */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <span>قائمة مهام متابعة الملاك وتأكيد التوافر</span>
              </h3>
              <p className="text-xs text-slate-400">
                مهام دورية ومؤتمتة تفتح تلقائياً عند انتهاء صلاحية التأكيد أو عدم الرد
              </p>
            </div>
            <button
              onClick={() => {
                setTaskToReassign(null);
                setTaskModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>مهمة جديدة</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">العقار / الكود</th>
                    <th className="p-3">المالك المطلوب متابعته</th>
                    <th className="p-3">المسؤول</th>
                    <th className="p-3">الأولوية</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tasks.map((task) => {
                    const isOverdue = task.status === 'قيد الانتظار' && new Date(task.dueDate) < new Date();
                    return (
                      <tr key={task.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-bold text-white">{task.propertyTitle}</div>
                          <div className="text-[10px] text-amber-400 font-mono">[{task.propertyCode}]</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-200">{task.ownerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono dir-ltr">{task.ownerPhone}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-blue-400">{task.assignedToName}</span>
                          {task.reassignCount && task.reassignCount > 0 ? (
                            <span className="block text-[9px] text-amber-400">
                              (أعيد إسنادها {task.reassignCount} مرات)
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.priority === 'عاجلة جداً'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'مرتفعة'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          <div className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {task.dueDate}
                          </div>
                          {isOverdue && (
                            <span className="text-[9px] text-rose-400 block font-bold">
                              ⚠️ متأخرة (تنبيه مشرف)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === 'مكتملة'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : task.status === 'ملغاة'
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {task.status === 'قيد الانتظار' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleCompleteTask(task)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold transition cursor-pointer"
                              >
                                إنجاز
                              </button>
                              <button
                                onClick={() => {
                                  setTaskToReassign(task);
                                  setTaskModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold transition cursor-pointer"
                              >
                                إعادة إسناد
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">{task.outcome || 'تمت بنجاح'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                        لا توجد مهام متابعة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 3: Owner Follow-up Chronological Records */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-400" />
              <span>سجل المتابعات وتأكيد التوافر الموثق مع الملاك</span>
            </h3>
            <span className="text-xs text-slate-400">{followups.length} متابعة مسجلة</span>
          </div>

          <div className="space-y-3">
            {followups.map((f) => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{f.propertyTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-400">
                        {f.propertyCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      المالك: <span className="text-slate-200 font-bold">{f.ownerName}</span> ({f.ownerPhone}) •
                      الموظف القائم بالمتابعة: <span className="text-blue-400 font-bold">{f.employeeName}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {f.channel}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(f.contactDate).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">استجابة المالك:</span>
                    <span className={f.isAnswered ? 'text-emerald-400 font-bold' : 'text-orange-400 font-bold'}>
                      {f.isAnswered ? 'تم الرد والتأكيد' : 'لم يتم الرد'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">حالة التوافر الناتجة:</span>
                    <span className="text-amber-400 font-bold">{f.availabilityStatus}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">تغير السعر:</span>
                    <span className="text-slate-200 font-bold">
                      {f.priceChanged ? `${formatEGP(f.newPrice || 0)} (سابقاً: ${formatEGP(f.oldPrice || 0)})` : 'لم يتغير السعر'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">المتابعة القادمة:</span>
                    <span className="text-slate-300 font-mono">{f.nextFollowupDate || 'غير محدد'}</span>
                  </div>
                </div>

                {f.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                    <span className="text-slate-400 font-bold">ملاحظات: </span>
                    {f.notes}
                  </div>
                )}
              </div>
            ))}

            {followups.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                لا توجد متابعات مسجلة حتى الآن
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 4: External Deals & Administrative Investigation */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'external_deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>سجل بلاغات البيع والتأجير الخارجي والتحقيق الإداري</span>
              </h3>
              <p className="text-xs text-slate-400">
                حماية حقوق شركة الماسة في العمولات والتحقق من مصادر المشترين
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedReportForEdit(null);
                setExternalDealModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل بلاغ جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {externalDeals.map((deal) => (
              <div key={deal.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {deal.reportNumber}
                      </span>
                      <h4 className="font-bold text-white text-sm">{deal.propertyTitle}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">[{deal.propertyCode}]</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      المالك: <span className="text-slate-200 font-bold">{deal.ownerName}</span> ({deal.ownerPhone}) •
                      مُبلغ البلاغ: <span className="text-slate-300">{deal.reportedBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      مرحلة التحقيق: {deal.investigationStatus}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedReportForEdit(deal);
                        setExternalDealModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold transition cursor-pointer"
                    >
                      متابعة التحقيق ⚖️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">نوع الصفقة والتاريخ:</span>
                    <span className="text-rose-400 font-bold">{deal.dealType}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{deal.dealDate}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">السعر التقديري:</span>
                    <span className="text-amber-400 font-bold font-mono">{formatEGP(deal.estimatedPrice || 0)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">الوسيط الخارجي:</span>
                    <span className="text-slate-200 font-bold">{deal.externalBrokerName || 'غير معروف'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/40">
                    <span className="text-slate-400 text-[10px] block">مطابقة مصدر المشتري:</span>
                    <span className={deal.buyerSourceMatched === 'نعم' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {deal.buyerSourceMatched}
                    </span>
                  </div>
                </div>

                {deal.commissionClaimEligible && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-300 text-xs">
                    <span className="font-bold">⚠️ توجد مطالبة رسمية بالعمولة بقيمة:</span>
                    <span className="text-sm font-black font-mono">{formatEGP(deal.commissionClaimAmount || 0)}</span>
                  </div>
                )}

                {deal.investigationNotes && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap">
                    <span className="text-slate-400 font-bold">سجل التحقيق: </span>
                    {deal.investigationNotes}
                  </div>
                )}
              </div>
            ))}

            {externalDeals.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                لا توجد بلاغات خارجية مسجلة
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 5: Deal Closings & 24h Archival */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'deal_closings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>سجل الصفقات المعتمدة وأرشيف 24 ساعة</span>
              </h3>
              <p className="text-xs text-slate-400">
                توثيق العقود المنفذة، توزيع العمولات، وجدول الأرشفة التلقائية بعد 24 ساعة
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPropForClosing(null);
                setDealClosingModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>اعتماد صفقة بيع جديدة</span>
            </button>
          </div>

          <div className="space-y-3">
            {dealClosings.map((c) => {
              const isPast24h = new Date(c.archiveAt) <= new Date();
              return (
                <div
                  key={c.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-lg space-y-3 text-xs ${
                    c.status === 'ملغاة'
                      ? 'border-slate-800 opacity-60'
                      : 'border-emerald-500/30 bg-emerald-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.propertyTitle}</span>
                        <span className="text-[10px] text-amber-400 font-mono">[{c.propertyCode}]</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {c.dealType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        العميل المشتري: <span className="text-slate-200 font-bold">{c.clientName}</span> ({c.clientPhone}) •
                        المسوق المغلق: <span className="text-blue-400 font-bold">{c.closerEmployeeName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          c.status === 'معتمدة'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {c.status}
                      </span>

                      {c.status === 'معتمدة' && (
                        <button
                          onClick={() => handleCancelDeal(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition cursor-pointer"
                        >
                          إلغاء الصفقة ⚠️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">السعر النهائي:</span>
                      <span className="text-amber-400 font-bold font-mono">{formatEGP(c.finalPrice)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">إجمالي العمولة:</span>
                      <span className="text-emerald-400 font-bold font-mono">{formatEGP(c.commissionTotal)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">نصيب الشركة (70%):</span>
                      <span className="text-slate-200 font-bold font-mono">{formatEGP(c.companyShare)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">نصيب المسوق (30%):</span>
                      <span className="text-blue-400 font-bold font-mono">{formatEGP(c.marketerShare)}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>موعد الأرشفة بعد 24 ساعة: </span>
                      <span className="text-slate-200 font-mono">{new Date(c.archiveAt).toLocaleString('en-US')}</span>
                    </div>
                    <div>
                      {isPast24h ? (
                        <span className="text-emerald-400 font-bold">تمت الأرشفة التلقائية بنجاح ✅</span>
                      ) : (
                        <span className="text-amber-400 font-bold animate-pulse">شعار الإغلاق معروض بالواجهة ⏱️</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {dealClosings.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                لا توجد صفقات معتمدة مسجلة بعد
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 6: Marketers Performance & Team Reports */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'marketers_performance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>تقييم أداء فريق التسويق ومتابعة الوحدات</span>
            </h3>
            <span className="text-xs text-slate-400">
              متابعة الإسنادات، معدل المتابعات، ونسب الصفقات المغلقة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const assignedProps = properties.filter((p) => (p.assignedMarketerIds || []).includes(emp.id));
              const empTasks = tasks.filter((t) => t.assignedToId === emp.id);
              const overdueTasks = empTasks.filter((t) => t.status === 'قيد الانتظار' && new Date(t.dueDate) < new Date());
              const empFollowups = followups.filter((f) => f.employeeId === emp.id);
              const empClosings = dealClosings.filter((c) => c.closerEmployeeId === emp.id && c.status === 'معتمدة');

              return (
                <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                      <p className="text-[10px] text-slate-400">{emp.department || emp.role || 'فريق التسويق'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {emp.roleTitle || 'مسوق'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">الوحدات المسندة:</span>
                      <span className="text-amber-400 font-bold">{assignedProps.length} وحدة</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">المتابعات المنجزة:</span>
                      <span className="text-emerald-400 font-bold">{empFollowups.length} مكالمة</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">مهام قيد التنفيذ:</span>
                      <span className="text-blue-400 font-bold">
                        {empTasks.filter((t) => t.status === 'قيد الانتظار').length}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">مهام متأخرة:</span>
                      <span className={overdueTasks.length > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {overdueTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-300 font-bold">الصفقات المغلقة المعتمدة:</span>
                    <span className="text-xs font-black text-emerald-400">{empClosings.length} صفقة</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Tab 7: Paid Ad Campaigns (Preserved & Enhanced) */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>إدارة الحملات التسويقية الممولة ومتابعة CPL & ROI</span>
              </h3>
              <p className="text-xs text-slate-400">
                تحليل أداء إعلانات فيس بوك، إنستجرام، وتيك توك، حساب تكلفة الليد وعائد الاستثمار
              </p>
            </div>

            <button
              onClick={() => setShowAddCampaignModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حملة إعلانية</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {c.platform}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{c.name}</h3>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400">
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <span className="text-slate-400 text-[10px]">الميزانية المصروفة:</span>
                    <div className="font-bold text-amber-400">{formatEGP(c.spend)}</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <span className="text-slate-400 text-[10px]">عدد Leads:</span>
                    <div className="font-bold text-white">{c.leadsCount} عميل</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <span className="text-slate-400 text-[10px]">تكلفة الليد CPL:</span>
                    <div className="font-bold text-blue-400">{formatEGP(c.costPerLead)}</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/50">
                    <span className="text-slate-400 text-[10px]">العائد ROI:</span>
                    <div className="font-bold text-emerald-400">+{c.roiPct}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Modals Integration */}
      {/* --------------------------------------------------------------------- */}
      <OwnerFollowupModal
        isOpen={followupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        property={selectedPropForFollowup}
        properties={properties}
        owners={owners}
        currentUser={currentUser}
        onFollowupSuccess={handleRefresh}
      />

      <ExternalDealReportModal
        isOpen={externalDealModalOpen}
        onClose={() => setExternalDealModalOpen(false)}
        properties={properties}
        existingReport={selectedReportForEdit}
        currentUser={currentUser}
        onSuccess={handleRefresh}
      />

      <DealClosingModal
        isOpen={dealClosingModalOpen}
        onClose={() => setDealClosingModalOpen(false)}
        properties={properties}
        clients={clients}
        currentUser={currentUser}
        preselectedProperty={selectedPropForClosing}
        onSuccess={handleRefresh}
      />

      <FollowupTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        properties={properties}
        employees={employees}
        currentUser={currentUser}
        taskToReassign={taskToReassign}
        onSuccess={handleRefresh}
      />

      {selectedPropForAssignment && (
        <TeamAssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          property={selectedPropForAssignment}
          owner={owners.find((o) => o.id === selectedPropForAssignment.ownerId)}
          employees={employees}
          currentUser={currentUser}
          onSuccess={handleRefresh}
        />
      )}

      {/* Campaign Add Modal */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddCampaign(campaignFormData);
              setShowAddCampaignModal(false);
            }}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs text-slate-200"
          >
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">إنشاء حملة تسويقية جديدة</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الحملة:</label>
              <input
                type="text"
                required
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                placeholder="مثال: إعلانات كمبوندات زايد - مارس 2026"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">المنصة:</label>
                <select
                  value={campaignFormData.platform}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, platform: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Snapchat">Snapchat</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">الميزانية المقدرة (ج.م):</label>
                <input
                  type="number"
                  value={campaignFormData.budget}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCampaignModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 cursor-pointer"
              >
                حفظ الحملة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
