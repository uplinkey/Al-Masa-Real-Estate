import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PropertyManagementView } from './components/PropertyManagementView';
import { CustomerCRMView } from './components/CustomerCRMView';
import { SalesPipelineView } from './components/SalesPipelineView';
import { OwnerCRMView } from './components/OwnerCRMView';
import { ViewingManagementView } from './components/ViewingManagementView';
import { MarketingManagementView } from './components/MarketingManagementView';
import { TaskManagementView } from './components/TaskManagementView';
import { CommissionAccountingView } from './components/CommissionAccountingView';
import { AIAssistantView } from './components/AIAssistantView';
import { PublicWebsiteView } from './components/PublicWebsiteView';
import { QRCodeModal } from './components/QRCodeModal';
import { SystemAdministrationModal } from './components/SystemAdministrationModal';
import { RBACManagementView } from './components/RBACManagementView';
import { PartnerNetworkCRMView } from './components/PartnerNetworkCRMView';
import { ToastContainer, toast } from './components/Toast';
import { api, setActiveRoleHeader } from './services/api';

import {
  INITIAL_PROPERTIES,
  INITIAL_OWNERS,
  INITIAL_CLIENTS,
  INITIAL_VIEWINGS,
  INITIAL_TASKS,
  INITIAL_CAMPAIGNS,
  INITIAL_COMMISSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_STATS,
  USER_ROLES,
} from './data/mockData';

import {
  Property,
  PropertyOwner,
  CustomerLead,
  PropertyViewing,
  AppTask,
  MarketingCampaign,
  CommissionRecord,
  AccountingTransaction,
  UserRole,
  LeadStatus,
  PropertyStatus,
} from './types';

export default function App() {
  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('almasa_theme');
      if (saved) return saved === 'dark';
    } catch {
      // ignore
    }
    return true;
  });

  // Core Data State
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [owners, setOwners] = useState<PropertyOwner[]>(INITIAL_OWNERS);
  const [clients, setClients] = useState<CustomerLead[]>(INITIAL_CLIENTS);
  const [viewings, setViewings] = useState<PropertyViewing[]>(INITIAL_VIEWINGS);
  const [tasks, setTasks] = useState<AppTask[]>(INITIAL_TASKS);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(INITIAL_COMMISSIONS);
  const [transactions, setTransactions] = useState<AccountingTransaction[]>(INITIAL_TRANSACTIONS);
  const [stats, setStats] = useState(INITIAL_STATS);

  // Database Connection & Sync State
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [dbStatsInfo, setDbStatsInfo] = useState<string>('جاري فحص الاتصال بقاعدة البيانات...');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals & AI State
  const [qrProperty, setQrProperty] = useState<Property | null>(null);
  const [isSystemAdminOpen, setIsSystemAdminOpen] = useState<boolean>(false);

  // Initial Sync from Real Relational SQLite Database
  const loadDatabaseData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [
        healthData,
        propsData,
        ownersData,
        clientsData,
        viewingsData,
        tasksData,
        campaignsData,
        commissionsData,
        transactionsData,
        statsData,
      ] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getProperties().catch(() => null),
        api.getOwners().catch(() => null),
        api.getClients().catch(() => null),
        api.getViewings().catch(() => null),
        api.getTasks().catch(() => null),
        api.getCampaigns().catch(() => null),
        api.getCommissions().catch(() => null),
        api.getTransactions().catch(() => null),
        api.getStats().catch(() => null),
      ]);

      if (propsData) setProperties(propsData);
      if (ownersData) setOwners(ownersData);
      if (clientsData) setClients(clientsData);
      if (viewingsData) setViewings(viewingsData);
      if (tasksData) setTasks(tasksData);
      if (campaignsData) setCampaigns(campaignsData);
      if (commissionsData) setCommissions(commissionsData);
      if (transactionsData) setTransactions(transactionsData);
      if (statsData) setStats(statsData);

      if (healthData && healthData.status === 'healthy') {
        setDbConnected(true);
        setDbStatsInfo(
          `SQLite v${healthData.sqliteVersion || '3.x'} | متصل ومحفوظ (${healthData.counts.properties || 0} عقار، ${healthData.counts.clients || 0} عميل، ${healthData.counts.owners || 0} مالك)`
        );
      }
    } catch (err) {
      console.warn('Database load warning, working with cached records:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Synchronize theme on html (documentElement) and body with state and localStorage persistence
  useEffect(() => {
    try {
      localStorage.setItem('almasa_theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  // Sync role to API client headers for centralized RBAC enforcement
  useEffect(() => {
    setActiveRoleHeader(userRole);
  }, [userRole]);

  // Handlers for Properties (Real CRUD to Database)
  const handleAddProperty = async (newProp: Partial<Property>) => {
    const nextCode = `ALM-${properties.length + 101}`;
    const payload: Partial<Property> = {
      ...newProp,
      code: nextCode,
      internalId: `INT-EG-2026-${Math.floor(100 + Math.random() * 900)}`,
      ownerId: newProp.ownerId || (owners[0] ? owners[0].id : undefined),
      ownerName: newProp.ownerName || (owners[0] ? owners[0].name : 'مالك عقار'),
      ownerPhone: newProp.ownerPhone || (owners[0] ? owners[0].phones[0] : '+201000000000'),
    };

    try {
      const saved = await api.createProperty(payload);
      setProperties((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
      toast.success(`تم تسجيل الوحدة العقارية (${saved.code || saved.title}) بنجاح في قاعدة البيانات`);
      return saved;
    } catch (err: any) {
      console.error('Failed to save property in DB:', err);
      const fallback = { ...payload, id: `prop-${Date.now()}` } as Property;
      setProperties((prev) => [fallback, ...prev]);
      toast.error('حدث خطأ أثناء حفظ العقار: ' + (err?.message || 'خطأ'));
      throw err;
    }
  };

  const handleUpdateProperty = async (id: string, updates: Partial<Property>, reason?: string) => {
    try {
      const updated = await api.updateProperty(id, updates, reason);
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      api.getStats().then((s) => setStats(s)).catch(() => {});
      toast.success(`تم حفظ وتوثيق تعديل الوحدة (${updated.code || id}) في قاعدة البيانات`);
      return updated;
    } catch (err: any) {
      console.error('Failed to update property in DB:', err);
      toast.error('فشل تعديل العقار: ' + (err?.message || 'غير مصرح'));
      throw err;
    }
  };

  const handleUpdatePropertyStatus = async (id: string, newStatus: PropertyStatus) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    try {
      await api.updateProperty(id, { status: newStatus }, 'تحديث حالة العقار');
      api.getStats().then((s) => setStats(s)).catch(() => {});
      toast.success(`تم تحديث حالة العقار إلى "${newStatus}" في قاعدة البيانات`);
    } catch (err) {
      console.error('Failed to update property status in DB:', err);
    }
  };

  // Handlers for Clients (Real CRUD to Database)
  const handleAddClient = async (newClient: Partial<CustomerLead>) => {
    try {
      const saved = await api.createClient(newClient);
      setClients((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
      toast.success(`تم تسجيل العميل "${saved.name}" بنجاح في قاعدة البيانات`);
      return saved;
    } catch (err: any) {
      console.error('Failed to create client in DB:', err);
      const fallback = { ...newClient, id: `client-${Date.now()}` } as CustomerLead;
      setClients((prev) => [fallback, ...prev]);
      toast.error('فشل إضافة العميل: ' + (err?.message || 'خطأ'));
      throw err;
    }
  };

  const handleUpdateClientStatus = async (id: string, newStatus: LeadStatus) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, leadStatus: newStatus } : c)));
    try {
      await api.updateClient(id, { leadStatus: newStatus });
      api.getStats().then((s) => setStats(s)).catch(() => {});
      toast.success(`تم تحديث حالة العميل إلى "${newStatus}" في قاعدة البيانات`);
    } catch (err) {
      console.error('Failed to update client status in DB:', err);
    }
  };

  const handleAddCommunicationLog = async (clientId: string, log: { type: any; summary: string }) => {
    const agentName = USER_ROLES.find((r) => r.key === userRole)?.labelAr || 'الإدارة العامة';
    try {
      const savedLog = await api.addClientLog(clientId, {
        type: log.type,
        agentName,
        summary: log.summary,
      });
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              communicationHistory: [savedLog, ...(c.communicationHistory || [])],
            };
          }
          return c;
        })
      );
      toast.success('تم تسجيل الملاحظة والتواصل بنجاح في قاعدة البيانات');
      return savedLog;
    } catch (err) {
      console.error('Failed to record communication log in DB:', err);
      toast.error('فشل تسجيل الملاحظة');
    }
  };

  // Handlers for Owners (Real CRUD to Database)
  const handleAddOwner = async (newOwner: Partial<PropertyOwner>) => {
    try {
      const saved = await api.createOwner(newOwner);
      setOwners((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Failed to create owner in DB:', err);
      const fallback = { ...newOwner, id: `own-${Date.now()}` } as PropertyOwner;
      setOwners((prev) => [fallback, ...prev]);
    }
  };

  // Handlers for Viewings (Real CRUD with Foreign Keys)
  const handleAddViewing = async (v: Partial<PropertyViewing>) => {
    const payload: Partial<PropertyViewing> = {
      ...v,
      propertyId: v.propertyId || properties[0]?.id,
      propertyTitle: v.propertyTitle || properties[0]?.title,
      propertyCode: v.propertyCode || properties[0]?.code,
      clientId: v.clientId || clients[0]?.id,
      clientName: v.clientName || clients[0]?.name,
      clientPhone: v.clientPhone || clients[0]?.phone,
      agentName: v.agentName || 'محمد سامي',
      driverName: v.driverName || 'عم إبراهيم',
      vehicle: v.vehicle || 'تويوتا فورتشنر',
      viewingDate: v.viewingDate || '2026-02-20',
      viewingTime: v.viewingTime || '04:00 مساءً',
      locationAddress: v.locationAddress || 'التجمع الخامس',
      status: 'مجدولة',
    };

    try {
      const saved = await api.createViewing(payload);
      setViewings((prev) => [saved, ...prev]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to save viewing in DB:', err);
      const fallback = { ...payload, id: `view-${Date.now()}` } as PropertyViewing;
      setViewings((prev) => [fallback, ...prev]);
    }
  };

  const handleUpdateViewingStatus = async (id: string, status: any, feedback?: string) => {
    setViewings((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status, customerFeedback: feedback || v.customerFeedback } : v))
    );
    try {
      await api.updateViewing(id, { status, customerFeedback: feedback });
    } catch (err) {
      console.error('Failed to update viewing in DB:', err);
    }
  };

  const handleCustomerBookViewing = async (data: {
    propertyId: string;
    propertyTitle: string;
    propertyCode: string;
    clientName: string;
    clientPhone: string;
    viewingDate: string;
    viewingTime: string;
    notes?: string;
  }) => {
    const prop = properties.find((p) => p.id === data.propertyId);

    // 1. Create client first in database
    let savedClient: CustomerLead | null = null;
    try {
      savedClient = await api.createClient({
        name: data.clientName,
        phone: data.clientPhone,
        leadStatus: 'معاينة محددة',
        leadSource: 'الموقع الإلكتروني',
        budgetMin: prop ? Math.round(prop.price * 0.9) : 3000000,
        budgetMax: prop ? Math.round(prop.price * 1.1) : 7000000,
        preferredDistrict: prop?.district || 'التجمع الخامس',
        preferredType: prop?.type || 'شقة',
        preferredPaymentMethod: 'كاش',
        assignedAgentName: 'محمد سامي',
        notes: `حجز معاينة إلكترونية للوحدة [${data.propertyCode}] بتاريخ ${data.viewingDate} ${data.viewingTime}. ${data.notes || ''}`,
      });
      setClients((prev) => [savedClient!, ...prev]);
    } catch (err) {
      console.error('Failed to create lead for booking in DB:', err);
    }

    // 2. Create viewing linking to the property and client
    const viewingPayload: Partial<PropertyViewing> = {
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle,
      propertyCode: data.propertyCode,
      clientId: savedClient ? savedClient.id : `cli-${Date.now()}`,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      agentName: 'محمد سامي',
      driverName: 'عم إبراهيم',
      vehicle: 'تويوتا فورتشنر (أ د ج 159)',
      viewingDate: data.viewingDate,
      viewingTime: data.viewingTime,
      locationAddress: prop?.address || prop?.district || 'التجمع الخامس',
      status: 'مجدولة',
      customerFeedback: data.notes ? `طلب حجز ذاتي من العميل: ${data.notes}` : 'طلب حجز إلكتروني من الموقع',
    };

    try {
      const savedViewing = await api.createViewing(viewingPayload);
      setViewings((prev) => [savedViewing, ...prev]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to create viewing in DB:', err);
      const fallback = { ...viewingPayload, id: `vw-${Date.now()}` } as PropertyViewing;
      setViewings((prev) => [fallback, ...prev]);
    }
  };

  const handleCustomerRequestCallback = async (data: {
    name: string;
    phone: string;
    preferredTime: string;
    notes?: string;
  }) => {
    try {
      const savedLead = await api.createClient({
        name: data.name,
        phone: data.phone,
        leadStatus: 'عميل جديد',
        leadSource: 'الموقع الإلكتروني',
        budgetMin: 3000000,
        budgetMax: 10000000,
        preferredDistrict: 'التجمع الخامس',
        preferredType: 'شقة',
        preferredPaymentMethod: 'تقسيط',
        assignedAgentName: 'أحمد مراد (مدير المبيعات)',
        notes: `طلب اتصال سريع - التوقيت المفضل: ${data.preferredTime}. ${data.notes || ''}`,
      });
      setClients((prev) => [savedLead, ...prev]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to create callback lead in DB:', err);
    }
  };

  // Handlers for Tasks (Real CRUD to Database)
  const handleAddTask = async (t: Partial<AppTask>) => {
    try {
      const saved = await api.createTask({
        title: t.title || 'مهمة جديدة',
        description: t.description || '',
        assignedToName: t.assignedToName || 'أحمد مراد',
        priority: t.priority || 'عالية',
        deadline: t.deadline || '2026-02-25',
        category: t.category || 'اتصال',
      });
      setTasks((prev) => [saved, ...prev]);
      api.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to create task in DB:', err);
      const fallback = { ...t, id: `task-${Date.now()}` } as AppTask;
      setTasks((prev) => [fallback, ...prev]);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: any) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await api.updateTask(id, { status });
      api.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Failed to update task in DB:', err);
    }
  };

  // Handlers for Marketing
  const handleAddCampaign = async (c: Partial<MarketingCampaign>) => {
    try {
      const saved = await api.createCampaign(c);
      setCampaigns((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Failed to create campaign in DB:', err);
      const fallback = { ...c, id: `camp-${Date.now()}` } as MarketingCampaign;
      setCampaigns((prev) => [fallback, ...prev]);
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col dir-rtl antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
      isDarkMode ? 'dark bg-[#0B1120] text-slate-100' : 'light bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Global Mini Toast Notifications (3 to 4 seconds auto-dismiss) */}
      <ToastContainer />

      {/* Top Header Navbar */}
      <Navbar
        activeRole={userRole}
        onRoleChange={setUserRole}
        onOpenAIAssistant={() => setActiveTab('ai_assistant')}
        onOpenNewProperty={() => setActiveTab('properties')}
        onOpenNewLead={() => setActiveTab('clients')}
        onOpenSystemAdmin={() => setIsSystemAdminOpen(true)}
        searchTerm={globalSearch}
        onSearchChange={setGlobalSearch}
        darkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        viewings={viewings}
        onNavigateTab={setActiveTab}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isDarkMode={isDarkMode}
          counts={{
            properties: properties.length,
            clients: clients.length,
            viewings: viewings.length,
            tasks: tasks.length,
          }}
        />

        {/* Dynamic Main View Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {/* Live Database Real-time Persistence Status Indicator */}
          <div className={`mb-5 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs transition-all ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-slate-300'
              : 'bg-emerald-50/80 border-emerald-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                قاعدة البيانات متصلة ومحدثة
              </span>
              <span className="hidden md:inline text-slate-400 dark:text-slate-500">•</span>
              <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400">
                {dbStatsInfo}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold/15 text-amber-700 dark:text-amber-400 border border-gold/30">
                الربط العلائقي مفعل
              </span>
              <button
                onClick={() => setIsSystemAdminOpen(true)}
                title="فتح لوحة الرقابة وسجلات التعديل والنسخ الاحتياطي"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isDarkMode
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                <span>🛡️</span>
                <span>الرقابة والنسخ الاحتياطي</span>
              </button>
              <button
                onClick={() => loadDatabaseData()}
                disabled={isSyncing}
                title="إعادة مزامنة البيانات من قاعدة البيانات"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة حية'}</span>
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              properties={properties}
              clients={clients}
              viewings={viewings}
              tasks={tasks}
              commissions={commissions}
              campaigns={campaigns}
              onNavigateTab={setActiveTab}
              onOpenNewProperty={() => setActiveTab('properties')}
              onOpenNewLead={() => setActiveTab('clients')}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'properties' && (
            <PropertyManagementView
              properties={properties}
              owners={owners}
              onAddProperty={handleAddProperty}
              onUpdateProperty={handleUpdateProperty}
              onUpdatePropertyState={(updated) =>
                setProperties((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
              }
              onAddOwner={handleAddOwner}
              onUpdateStatus={handleUpdatePropertyStatus}
              onOpenQR={(p) => setQrProperty(p)}
              onOpenAIForProperty={(p) => setActiveTab('ai_assistant')}
              onRefreshData={loadDatabaseData}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'clients' && (
            <CustomerCRMView
              clients={clients}
              properties={properties}
              onAddClient={handleAddClient}
              onUpdateClientStatus={handleUpdateClientStatus}
              onAddCommunicationLog={handleAddCommunicationLog}
              onRefreshData={loadDatabaseData}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'pipeline' && (
            <SalesPipelineView clients={clients} onUpdateStatus={handleUpdateClientStatus} isDarkMode={isDarkMode} />
          )}

          {activeTab === 'owners' && (
            <OwnerCRMView owners={owners} properties={properties} onAddOwner={handleAddOwner} isDarkMode={isDarkMode} />
          )}

          {activeTab === 'viewings' && (
            <ViewingManagementView
              viewings={viewings}
              properties={properties}
              clients={clients}
              onAddViewing={handleAddViewing}
              onUpdateViewingStatus={handleUpdateViewingStatus}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'marketing' && (
            <MarketingManagementView
              campaigns={campaigns}
              onAddCampaign={handleAddCampaign}
              properties={properties}
              owners={owners}
              clients={clients}
              currentUser={{ role: userRole, name: userRole === 'ADMIN' ? 'المدير التنفيذي' : 'مسوق الماسة' }}
              onRefreshData={loadDatabaseData}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'partners' && (
            <PartnerNetworkCRMView
              currentUser={{
                id: userRole === 'ADMIN' ? 'usr-admin-1' : 'usr-agent-1',
                name: userRole === 'ADMIN' ? 'أحمد عيسوي & السيد محسن' : 'محمد سامي',
                role: userRole,
              }}
              properties={properties}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManagementView tasks={tasks} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} isDarkMode={isDarkMode} />
          )}

          {(activeTab === 'commissions' || activeTab === 'accounting') && (
            <CommissionAccountingView commissions={commissions} transactions={transactions} isDarkMode={isDarkMode} />
          )}

          {activeTab === 'rbac' && (
            <RBACManagementView isDarkMode={isDarkMode} />
          )}

          {(activeTab === 'ai-assistant' || activeTab === 'ai_assistant') && (
            <AIAssistantView properties={properties} clients={clients} isDarkMode={isDarkMode} />
          )}

          {(activeTab === 'public-portal' || activeTab === 'public_website') && (
            <PublicWebsiteView
              properties={properties}
              onOpenPropertyDetails={(p) => setQrProperty(p)}
              onBookViewing={handleCustomerBookViewing}
              onRequestCallback={handleCustomerRequestCallback}
              onAddOwnerListing={handleAddOwner}
              isDarkMode={isDarkMode}
            />
          )}
        </main>
      </div>

      {/* QR Code Printable Modal */}
      <QRCodeModal property={qrProperty} onClose={() => setQrProperty(null)} isDarkMode={isDarkMode} />

      {/* System Administration & Audit Modal */}
      <SystemAdministrationModal
        isOpen={isSystemAdminOpen}
        onClose={() => setIsSystemAdminOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
