import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building,
  Users,
  Kanban,
  UserCheck2,
  CalendarCheck,
  Megaphone,
  CheckSquare,
  Sparkles,
  Globe2,
  BadgePercent,
  ShieldAlert,
  Handshake,
  Menu,
  X,
} from 'lucide-react';

export type SidebarTab =
  | 'dashboard'
  | 'properties'
  | 'clients'
  | 'pipeline'
  | 'owners'
  | 'viewings'
  | 'marketing'
  | 'partners'
  | 'tasks'
  | 'accounting'
  | 'rbac'
  | 'ai_assistant'
  | 'public_website';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  counts?: {
    properties: number;
    clients: number;
    viewings: number;
    tasks: number;
  };
  isDarkMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  counts = { properties: 0, clients: 0, viewings: 0, tasks: 0 },
  isDarkMode = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const safeCounts = counts || { properties: 0, clients: 0, viewings: 0, tasks: 0 };

  const navItems: { id: SidebarTab; label: string; icon: React.ReactNode; badge?: number; highlight?: boolean }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'properties', label: 'الوحدات والعقارات', icon: <Building className="w-4 h-4" />, badge: safeCounts.properties },
    { id: 'clients', label: 'سجل العملاء والطلبات', icon: <Users className="w-4 h-4" />, badge: safeCounts.clients },
    { id: 'pipeline', label: 'مراحل المبيعات', icon: <Kanban className="w-4 h-4" /> },
    { id: 'owners', label: 'سجل ملاك العقارات', icon: <UserCheck2 className="w-4 h-4" /> },
    { id: 'viewings', label: 'جدول المعاينات', icon: <CalendarCheck className="w-4 h-4" />, badge: safeCounts.viewings },
    { id: 'marketing', label: 'التسويق وتوافر الوحدات', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'partners' as any, label: 'الشركات المتعاونة والعمولات', icon: <Handshake className="w-4 h-4 text-indigo-400" /> },
    { id: 'tasks', label: 'المهام والمتابعة', icon: <CheckSquare className="w-4 h-4" />, badge: safeCounts.tasks },
    { id: 'accounting', label: 'العمولات والحسابات المالية', icon: <BadgePercent className="w-4 h-4" /> },
    { id: 'rbac', label: 'إدارة الصلاحيات والمستخدمين', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
    { id: 'ai_assistant', label: 'المساعد الذكي', icon: <Sparkles className="w-4 h-4" />, highlight: true },
    { id: 'public_website', label: 'الموقع العام للتسويق', icon: <Globe2 className="w-4 h-4" /> },
  ];

  const quickMobileItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'properties', label: 'العقارات', icon: <Building className="w-5 h-5" /> },
    { id: 'clients', label: 'العملاء', icon: <Users className="w-5 h-5" /> },
    { id: 'ai_assistant', label: 'المساعد الذكي', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
  ];

  const handleMobileSelect = (tabId: string) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`w-64 border-l flex flex-col justify-between hidden md:flex shrink-0 z-20 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0F172A] border-slate-800 text-slate-300'
          : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#0F172A] shadow-sm'
      }`}>
        {/* Brand Header */}
        <div className={`p-4 border-b flex flex-col items-center gap-1.5 ${
          isDarkMode ? 'border-slate-800' : 'border-[#CBD5E1]'
        }`}>
          <div className={`w-11 h-11 rounded-full border-2 border-gold flex items-center justify-center font-black text-lg accent-gold gold-glow ${
            isDarkMode ? 'bg-slate-900/80' : 'bg-amber-50'
          }`}>
            أ
          </div>
          <div className="text-center">
            <h1 className="text-base font-bold tracking-tight accent-gold gold-glow">الماسة العقارية</h1>
            <p className={`text-[10px] font-semibold ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>إدارة وتسويق العقارات</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-slate-500' : 'text-slate-500'
          }`}>
            أقسام النظام
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'bg-slate-800/80 text-white border-r-4 border-gold shadow-md font-bold'
                      : 'bg-amber-500/10 text-amber-900 border-r-4 border-gold shadow-sm font-bold'
                    : item.highlight
                    ? isDarkMode
                      ? 'text-amber-300 hover:bg-slate-800/60 bg-amber-500/10 border border-amber-500/20'
                      : 'text-amber-800 hover:bg-amber-100/60 bg-amber-500/10 border border-amber-500/30'
                    : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-700 hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-amber-500 accent-gold' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-gold text-slate-950 font-bold'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-white text-slate-700 border border-[#CBD5E1]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Profile Footer */}
        <div className={`p-3.5 border-t ${
          isDarkMode ? 'border-slate-800 bg-[#0B1120]/40' : 'border-[#CBD5E1] bg-[#F1F5F9]'
        }`}>
          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-[#CBD5E1] shadow-xs'
          }`}>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-gold/40 flex items-center justify-center text-[11px] font-black text-amber-600 dark:text-amber-400 shrink-0">
              ع/م
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-black leading-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                أحمد عيسوي & السيد محسن
              </p>
              <p className={`text-[10px] font-bold ${isDarkMode ? 'text-amber-400/90' : 'text-amber-700'}`}>
                المدير التنفيذي & المدير العام
              </p>
            </div>
            <span className="text-xs text-slate-400">👑</span>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-4 left-3 right-3 z-40">
        <div className={`p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-around transition-all ${
          isDarkMode
            ? 'bg-[#0F172A]/95 border-amber-500/30 text-slate-200'
            : 'bg-white/95 border-amber-500/40 text-slate-700 shadow-amber-500/10'
        }`}>
          {quickMobileItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMobileSelect(item.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gold text-slate-950 shadow-md scale-105'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              isMobileMenuOpen
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : isDarkMode
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span>القائمة</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sheet / Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className={`max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-x p-5 shadow-2xl transition-all ${
            isDarkMode
              ? 'bg-[#0F172A] border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center font-black text-lg accent-gold bg-amber-500/10">
                  أ
                </div>
                <div>
                  <h3 className="text-base font-bold accent-gold">الماسة العقارية</h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    القائمة الرئيسية لجميع أقسام المنظومة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileSelect(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all text-right cursor-pointer ${
                      isActive
                        ? 'bg-gold text-slate-950 border-gold shadow-md'
                        : item.highlight
                        ? isDarkMode
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                        : isDarkMode
                        ? 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-slate-950' : 'text-amber-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive
                            ? 'bg-slate-950 text-gold'
                            : isDarkMode
                            ? 'bg-slate-900 text-amber-400 border border-slate-700'
                            : 'bg-white text-amber-700 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Profile info in Drawer */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  ع/م
                </div>
                <div>
                  <p className="text-xs font-bold">م. أحمد عيسوي & أ. السيد محسن</p>
                  <p className={`text-[10px] font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    المدير التنفيذي & المدير العام
                  </p>
                </div>
              </div>

              <span className="text-xs px-2 py-1 bg-gold/20 text-amber-600 dark:text-amber-300 rounded-lg font-bold">
                الإدارة العليا
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
