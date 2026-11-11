import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Tag,
  ChevronRight,
  Send,
  UserCheck,
  Building2,
  PhoneCall,
  SearchCheck,
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2,
  FileText,
  Star,
  ExternalLink,
  ChevronDown,
  Filter,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { CustomerLead, LeadStatus, LeadSource, ClientSearchRequest, PropertyMatchResult, ClientProposal, PropertyViewing, Property } from '../types';
import { api } from '../services/api';
import { SearchRequestModal } from './SearchRequestModal';
import { ClientProposalShareModal } from './ClientProposalShareModal';
import { ScheduleViewingModal } from './ScheduleViewingModal';
import { SourceDisputeModal } from './SourceDisputeModal';
import { toast } from './Toast';

interface CustomerCRMViewProps {
  clients: CustomerLead[];
  properties?: Property[];
  onAddClient: (newClient: Partial<CustomerLead>) => void;
  onUpdateClientStatus: (id: string, status: LeadStatus) => void;
  onAddCommunicationLog: (clientId: string, log: { type: any; summary: string }) => void;
  currentUser?: { id: string; name: string; role: string };
  onRefreshData?: () => void;
}

export const CustomerCRMView: React.FC<CustomerCRMViewProps> = ({
  clients,
  properties = [],
  onAddClient,
  onUpdateClientStatus,
  onAddCommunicationLog,
  currentUser = { id: 'usr-1', name: 'أحمد مراد (مدير المبيعات)', role: 'ADMIN' },
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');
  const [selectedSource, setSelectedSource] = useState<string>('الكل');
  const [activeClient, setActiveClient] = useState<CustomerLead | null>(clients[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogSummary, setNewLogSummary] = useState('');
  const [newLogType, setNewLogType] = useState<'اتصال' | 'اجتماع' | 'واتساب' | 'ملاحظة'>('اتصال');

  // Sub-tabs in Client Profile 360
  const [profileTab, setProfileTab] = useState<'requests' | 'matching' | 'proposals' | 'viewings' | 'history'>('requests');

  // 360 Full Data State for Active Client
  const [clientRequests, setClientRequests] = useState<ClientSearchRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matchingResults, setMatchingResults] = useState<PropertyMatchResult[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [clientProposals, setClientProposals] = useState<ClientProposal[]>([]);
  const [clientViewings, setClientViewings] = useState<PropertyViewing[]>([]);
  const [isLoading360, setIsLoading360] = useState(false);

  // Modals state
  const [searchRequestModalOpen, setSearchRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ClientSearchRequest | null>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedPropForProposal, setSelectedPropForProposal] = useState<any>(null);
  const [scheduleViewingModalOpen, setScheduleViewingModalOpen] = useState(false);
  const [sourceDisputeModalOpen, setSourceDisputeModalOpen] = useState(false);

  // Form State for Adding New Client
  const [formData, setFormData] = useState<Partial<CustomerLead>>({
    name: '',
    phone: '',
    secondary_phone: '',
    whatsapp: '',
    email: '',
    lead_status: 'عميل جديد',
    lead_source: 'إعلان فيسبوك',
    original_source: 'إعلان فيسبوك',
    budget_min: 3000000,
    budget_max: 7000000,
    preferred_district: 'التجمع الخامس',
    preferred_type: 'شقة',
    preferred_payment_method: 'كاش',
    assigned_agent_id: currentUser.id,
    assigned_agent_name: currentUser.name,
    assigned_marketer_name: 'محمد رضوان (مسوق رقمي)',
    notes: '',
  });

  const statuses: LeadStatus[] = [
    'عميل جديد',
    'تم تسجيل الطلب',
    'جاري البحث',
    'تم إرسال عروض',
    'بانتظار الرد',
    'مهتم',
    'طلب معاينة',
    'تمت المعاينة',
    'رفض الوحدات',
    'يحتاج إعادة بحث',
    'لم يقرر بعد',
    'تمت الصفقة',
    'مغلق أو غير نشط',
  ];

  const leadSources: (LeadSource | string)[] = [
    'إعلان فيسبوك',
    'إعلان جوجل',
    'إعلان تيك توك',
    'إعلان انستغرام',
    'واتساب',
    'توصية عميل سابق',
    'وسيط متعاون',
    'مكالمة واردة مباشرة',
    'زيارة مقر الشركة',
    'لافتة إعلانية خارجية',
    'أخرى',
  ];

  // Sync activeClient when clients prop updates
  useEffect(() => {
    if (!activeClient && clients.length > 0) {
      setActiveClient(clients[0]);
    } else if (activeClient) {
      const refreshed = clients.find((c) => c.id === activeClient.id);
      if (refreshed) {
        setActiveClient(refreshed);
      }
    }
  }, [clients]);

  // Load Client 360 Data when Active Client Changes
  useEffect(() => {
    if (activeClient?.id) {
      loadClient360(activeClient.id);
    }
  }, [activeClient?.id]);

  // Load Matching Results when selectedRequestId changes
  useEffect(() => {
    if (selectedRequestId) {
      loadMatchesForRequest(selectedRequestId);
    } else {
      setMatchingResults([]);
    }
  }, [selectedRequestId]);

  const loadClient360 = async (clientId: string) => {
    try {
      setIsLoading360(true);
      const profile = await api.getClientProfile360(clientId);
      setClientRequests(profile.search_requests || []);
      setClientProposals(profile.proposals || []);
      setClientViewings(profile.viewings || []);

      if (profile.search_requests && profile.search_requests.length > 0) {
        setSelectedRequestId(profile.search_requests[0].id);
      } else {
        setSelectedRequestId(null);
        setMatchingResults([]);
      }
    } catch (err) {
      console.error('Error loading Client 360 data:', err);
    } finally {
      setIsLoading360(false);
    }
  };

  const loadMatchesForRequest = async (requestId: string) => {
    try {
      setIsLoadingMatches(true);
      const matches = await api.getMatchesForRequest(requestId);
      setMatchingResults(matches);
    } catch (err) {
      console.error('Error loading matches for request:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.name || '').includes(searchTerm) ||
      (c.phone || '').includes(searchTerm) ||
      (c.preferred_district || c.preferredDistrict || '').includes(searchTerm);
    const clientStatus = c.lead_status || c.leadStatus;
    const clientSource = c.lead_source || c.leadSource;
    const matchesStatus = selectedStatus === 'الكل' || clientStatus === selectedStatus;
    const matchesSource = selectedSource === 'الكل' || clientSource === selectedSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await api.createClient(formData);
      setActiveClient(saved);
      if (onAddClient) onAddClient(saved);
      if (onRefreshData) onRefreshData();
      setShowAddModal(false);
      toast.success(`تم تسجيل العميل "${saved.name}" بنجاح في قاعدة البيانات`);
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل العميل');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !newLogSummary.trim()) return;
    const summary = newLogSummary.trim();
    const type = newLogType;
    setNewLogSummary('');

    try {
      const agentName = currentUser?.name || 'مستشار المبيعات';
      const savedLog = await api.addClientLog(activeClient.id, {
        type,
        agentName,
        summary,
      });

      // Update activeClient communicationHistory immediately in place!
      const updatedHistory = [savedLog, ...(activeClient.communicationHistory || [])];
      const today = new Date().toISOString().split('T')[0];
      const updatedClient = {
        ...activeClient,
        communicationHistory: updatedHistory,
        last_contact: today,
        lastContact: today,
      };
      setActiveClient(updatedClient);

      if (onAddCommunicationLog) {
        onAddCommunicationLog(activeClient.id, { type, summary });
      }

      toast.success('تم تسجيل الملاحظة والتواصل وتوثيقه في قاعدة البيانات');
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الملاحظة');
    }
  };

  const formatEGP = (num?: number) => {
    if (num === undefined || num === null) return '0 ج.م';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num) + ' ج.م';
  };

  const handleUpdateProposalReaction = async (proposalId: string, reaction: any, feedback?: string) => {
    try {
      await api.updateProposalReaction(proposalId, reaction, feedback);
      if (activeClient) {
        loadClient360(activeClient.id);
      }
      toast.success('تم تسجيل تفاعل العميل وتحديث السجل في قاعدة البيانات');
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث رد العميل');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              <span>نظام CRM العملاء 360 ومحرك المطابقة الذكية</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              إصدار CRM 360 الشامل
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة متقدمة لملفات العملاء، طلبات البحث المتعددة، محرك الترشيح الرياضي الذكي، وسجل المعاينات والنزاعات حول المصدر الإعلاني.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف أو المنطقة..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="الكل">جميع حالات العملاء ({statuses.length})</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="الكل">مصدر العميل: الكل</option>
          {leadSources.map((ls) => (
            <option key={ls} value={ls}>
              {ls}
            </option>
          ))}
        </select>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Clients List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 max-h-[82vh] overflow-y-auto pr-1">
          {filteredClients.map((client) => {
            const isSelected = activeClient?.id === client.id;
            const currentStatus = client.lead_status || client.leadStatus || 'عميل جديد';
            const currentSource = client.lead_source || client.leadSource || 'غير محدد';
            return (
              <div
                key={client.id}
                onClick={() => setActiveClient(client)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{client.name}</h4>
                      {client.source_locked && (
                        <span title="المصدر مقفل إدارياً" className="text-xs">🔒</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">{client.phone}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      currentStatus === 'تمت الصفقة'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : currentStatus === 'طلب معاينة' || currentStatus === 'تمت المعاينة'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : currentStatus === 'مغلق أو غير نشط' || currentStatus === 'رفض الوحدات'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
                  <span className="text-amber-400 font-medium">المصدر: {currentSource}</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{client.active_requests_count || 0} طلبات</span>
                    <span>•</span>
                    <span>{client.total_viewings_count || 0} معاينات</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Client Profile 360 (8 cols) */}
        {activeClient ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Header Profile 360 Info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black text-white">{activeClient.name}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {activeClient.lead_source || activeClient.leadSource}
                  </span>
                  {activeClient.source_locked ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700 flex items-center gap-1">
                      🔒 مصدر مقفل
                    </span>
                  ) : null}
                  <button
                    onClick={() => setSourceDisputeModalOpen(true)}
                    className="px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:text-amber-300 underline"
                  >
                    نزاع على المصدر؟
                  </button>
                </div>

                <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>الهاتف: <span className="font-mono text-slate-300" dir="ltr">{activeClient.phone}</span></span>
                  {activeClient.whatsapp && (
                    <span>واتساب: <span className="font-mono text-emerald-400" dir="ltr">{activeClient.whatsapp}</span></span>
                  )}
                  <span>المسوق: <span className="text-slate-300">{activeClient.assigned_marketer_name || 'غير محدد'}</span></span>
                  <span>المسؤول: <span className="text-slate-300">{activeClient.assigned_agent_name || activeClient.assignedAgentName || 'غير محدد'}</span></span>
                </div>
              </div>

              {/* Status Updater */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 shrink-0">تغيير الحالة:</label>
                <select
                  value={activeClient.lead_status || activeClient.leadStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as LeadStatus;
                    setActiveClient({
                      ...activeClient,
                      lead_status: newStatus,
                      leadStatus: newStatus,
                    });
                    onUpdateClientStatus(activeClient.id, newStatus);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg focus:outline-none cursor-pointer"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/2${(activeClient.whatsapp || activeClient.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>واتساب مباشر</span>
              </a>

              <a
                href={`tel:${activeClient.phone}`}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>اتصال هاتف</span>
              </a>

              <button
                onClick={() => {
                  setEditingRequest(null);
                  setSearchRequestModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة طلب بحث جديد</span>
              </button>

              <button
                onClick={() => setScheduleViewingModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>جدولة معاينة ميدانية</span>
              </button>
            </div>

            {/* Navigation Tabs for Profile 360 */}
            <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setProfileTab('requests')}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'requests'
                    ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <SearchCheck className="w-4 h-4" />
                <span>طلبات البحث ({clientRequests.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('matching')}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'matching'
                    ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>محرك المطابقة الذكي ({matchingResults.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('proposals')}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'proposals'
                    ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>العروض والمقترحات ({clientProposals.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('viewings')}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'viewings'
                    ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>سجل المعاينات ({clientViewings.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('history')}
                className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'history'
                    ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>الملاحظات والاتصالات</span>
              </button>
            </div>

            {/* TAB 1: Search Requests */}
            {profileTab === 'requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">طلبات البحث النشطة والمكتملة للعميل</h4>
                  <button
                    onClick={() => {
                      setEditingRequest(null);
                      setSearchRequestModalOpen(true);
                    }}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل طلب بحث إضافي</span>
                  </button>
                </div>

                {clientRequests.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">لا توجد طلبات بحث مسجلة لهذا العميل حتى الآن</p>
                    <button
                      onClick={() => {
                        setEditingRequest(null);
                        setSearchRequestModalOpen(true);
                      }}
                      className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                    >
                      إضافة أول طلب بحث الآن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedRequestId === req.id
                            ? 'bg-slate-800/80 border-amber-500'
                            : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-sm">{req.request_title || req.property_type}</h5>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">
                                {req.purpose}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                اكتمال البيانات: {req.completeness_score}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 mt-2 space-y-1">
                              <p>
                                <span className="text-slate-400">الميزانية:</span> {formatEGP(req.min_budget)} إلى {formatEGP(req.max_budget)}
                                <span className="text-slate-400 mr-3">مرونة الميزانية:</span> {req.budget_flexibility}
                              </p>
                              <p>
                                <span className="text-slate-400">الموقع:</span> {req.preferred_city} - {req.preferred_district || 'أي منطقة'}
                                {req.alternative_districts && req.alternative_districts.length > 0 && (
                                  <span className="text-slate-400 text-[11px] mr-2">
                                    (البدائل: {req.alternative_districts.join('، ')})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setProfileTab('matching');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>فحص التطابق الذكي</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingRequest(req);
                                setSearchRequestModalOpen(true);
                              }}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              تعديل الطلب
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Smart Matching Engine */}
            {profileTab === 'matching' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 font-bold">الطلب المختار للمطابقة:</span>
                    <select
                      value={selectedRequestId || ''}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      {clientRequests.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.request_title || r.property_type} ({r.preferred_city} - {formatEGP(r.max_budget)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => selectedRequestId && loadMatchesForRequest(selectedRequestId)}
                    disabled={isLoadingMatches || !selectedRequestId}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-lg flex items-center gap-1.5 border border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                    <span>إعادة تشغيل المحرك</span>
                  </button>
                </div>

                {isLoadingMatches ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">جاري فحص قاعدة البيانات وتطبيق معادلة التوافق الوزنية...</p>
                  </div>
                ) : matchingResults.length === 0 ? (
                  <div className="py-12 text-center bg-slate-800/20 rounded-xl border border-slate-800 text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                    <p className="font-semibold text-slate-300">لا توجد وحدات مطابقة حالياً تلبي هذا الطلب</p>
                    <p className="text-xs text-slate-500 mt-1">
                      جرب تعديل مرونة الميزانية إلى 10% أو 20% أو إضافة مناطق بديلة في إعدادات الطلب.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchingResults.map((match) => (
                      <div
                        key={match.property.id}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                              <img
                                src={match.property.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                                alt={match.property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-white text-sm">{match.property.title}</h5>
                                <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {match.property.code}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  نسبة التطابق: {match.match_score}%
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                                <span>السعر: <span className="font-bold text-amber-400">{formatEGP(match.property.price)}</span></span>
                                <span>الموقع: {match.property.location}</span>
                                <span>المساحة: {match.property.area_sq_m || match.property.areaSqM} م²</span>
                              </div>

                              {/* Reasons & Mismatch Points */}
                              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                                {match.match_reasons.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 rounded border border-emerald-800/50">
                                    ✓ {r}
                                  </span>
                                ))}
                                {match.mismatch_points.map((m, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-amber-950/60 text-amber-300 rounded border border-amber-800/50">
                                    ⚠ {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedPropForProposal(match.property);
                                setProposalModalOpen(true);
                              }}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>إرسال عبر واتساب</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Proposals */}
            {profileTab === 'proposals' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">سجل العروض والمقترحات المرسلة للعميل</h4>
                {clientProposals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لم يتم إرسال أو توثيق أي عروض لهذا العميل حتى الآن</p>
                ) : (
                  <div className="space-y-3">
                    {clientProposals.map((prop) => (
                      <div key={prop.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{prop.property_title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({prop.property_code})</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">{prop.shared_at}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>السعر المعروض: {formatEGP(prop.offered_price)}</span>
                          <span>القناة: {prop.share_channel}</span>
                          <span>بواسطة: {prop.proposed_by_name}</span>
                        </div>

                        {/* Reaction Selector */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <span className="text-slate-400">رد العميل:</span>
                          <button
                            onClick={() => handleUpdateProposalReaction(prop.id, 'مهتم')}
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              prop.client_reaction === 'مهتم'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            مهتم 👍
                          </button>
                          <button
                            onClick={() => handleUpdateProposalReaction(prop.id, 'طلب معاينة')}
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              prop.client_reaction === 'طلب معاينة'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-amber-400'
                            }`}
                          >
                            طلب معاينة 📅
                          </button>
                          <button
                            onClick={() => handleUpdateProposalReaction(prop.id, 'رفض السعر')}
                            className={`px-2 py-1 rounded text-[11px] font-bold ${
                              prop.client_reaction === 'رفض السعر'
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            رفض السعر 👎
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Viewings */}
            {profileTab === 'viewings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">سجل المعاينات الميدانية</h4>
                  <button
                    onClick={() => setScheduleViewingModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    جدولة معاينة جديدة
                  </button>
                </div>

                {clientViewings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا توجد معاينات مجدولة أو سابقة لهذا العميل</p>
                ) : (
                  <div className="space-y-3">
                    {clientViewings.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{v.propertyTitle || v.property_title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                            {v.status}
                          </span>
                        </div>
                        <div className="text-slate-300 flex items-center gap-4 text-[11px]">
                          <span>التاريخ: {v.date || v.viewing_date} {v.time || v.viewing_time}</span>
                          <span>المسؤول: {v.agentName || v.agent_name}</span>
                          {v.rating && (
                            <span className="text-amber-400">التقييم: {'★'.repeat(v.rating)}</span>
                          )}
                        </div>
                        {v.feedback && <p className="text-slate-400 text-[11px]">ملاحظات: {v.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: History & Communication Logs */}
            {profileTab === 'history' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>سجل الاتصالات والملاحظات المباشرة</span>
                </h4>

                {/* Add New Log Form */}
                <form onSubmit={handleAddLog} className="flex gap-2">
                  <select
                    value={newLogType}
                    onChange={(e) => setNewLogType(e.target.value as any)}
                    className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="اتصال">اتصال</option>
                    <option value="اجتماع">اجتماع</option>
                    <option value="واتساب">واتساب</option>
                    <option value="ملاحظة">ملاحظة</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={newLogSummary}
                    onChange={(e) => setNewLogSummary(e.target.value)}
                    placeholder="اكتب تفاصيل الاتصال أو نتيجة المعاينة..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors"
                  >
                    تسجيل
                  </button>
                </form>

                {/* Timeline list */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(activeClient.communicationHistory || []).map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">
                          {log.type} بواسطة {log.agentName}
                        </span>
                        <span className="text-[10px] text-slate-500">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-300">{log.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            اختر عميلاً من القائمة لعرض ملف 360 الشامل
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateClient}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">تسجيل عميل جديد (CRM 360)</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رقم الهاتف الرئيسي *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+20 100 123 4567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رقم الواتساب (اختياري)</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+20 100 123 4567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مصدر وصول العميل *</label>
                <select
                  value={formData.lead_source}
                  onChange={(e) => setFormData({ ...formData, lead_source: e.target.value as any, original_source: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {leadSources.map((ls) => (
                    <option key={ls} value={ls}>
                      {ls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المسوق المسؤول</label>
                <input
                  type="text"
                  value={formData.assigned_marketer_name || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_marketer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المنطقة المبدئية</label>
                <input
                  type="text"
                  value={formData.preferred_district}
                  onChange={(e) => setFormData({ ...formData, preferred_district: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                إلغاء
              </button>
              <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">
                حفظ العميل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Request Modal */}
      {activeClient && (
        <SearchRequestModal
          isOpen={searchRequestModalOpen}
          onClose={() => {
            setSearchRequestModalOpen(false);
            setEditingRequest(null);
          }}
          client={activeClient}
          requestToEdit={editingRequest}
          onSuccess={() => {
            loadClient360(activeClient.id);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Proposal & WhatsApp Share Modal */}
      {activeClient && selectedPropForProposal && (
        <ClientProposalShareModal
          isOpen={proposalModalOpen}
          onClose={() => {
            setProposalModalOpen(false);
            setSelectedPropForProposal(null);
          }}
          client={activeClient}
          property={selectedPropForProposal}
          searchRequestId={selectedRequestId || undefined}
          currentUser={currentUser}
          onSuccess={() => {
            loadClient360(activeClient.id);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Schedule Viewing Modal */}
      {activeClient && (
        <ScheduleViewingModal
          isOpen={scheduleViewingModalOpen}
          onClose={() => setScheduleViewingModalOpen(false)}
          client={activeClient}
          allProperties={properties}
          currentUser={currentUser}
          onSuccess={() => {
            loadClient360(activeClient.id);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Lead Source Dispute Modal */}
      {activeClient && (
        <SourceDisputeModal
          isOpen={sourceDisputeModalOpen}
          onClose={() => setSourceDisputeModalOpen(false)}
          client={activeClient}
          currentUser={currentUser}
          onSuccess={() => {
            loadClient360(activeClient.id);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
