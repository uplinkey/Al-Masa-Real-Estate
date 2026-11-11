import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Sparkles,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Globe,
  Plus,
  PhoneCall,
} from 'lucide-react';
import { UserRole, UserRoleOption, PropertyViewing } from '../types';
import { USER_ROLES } from '../data/mockData';
import { calculateViewingAlerts, ViewingAlert } from '../utils/viewingAlerts';

interface NavbarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenAIAssistant: () => void;
  onOpenNewProperty: () => void;
  onOpenNewLead: () => void;
  onOpenSystemAdmin?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  viewings?: PropertyViewing[];
  onNavigateTab?: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  onRoleChange,
  onOpenAIAssistant,
  onOpenNewProperty,
  onOpenNewLead,
  onOpenSystemAdmin,
  searchTerm,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  viewings = [],
  onNavigateTab,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentRoleObj = USER_ROLES.find((r) => r.key === activeRole) || USER_ROLES[0];

  // Automated viewing alerts calculation
  const viewingAlerts = useMemo(() => calculateViewingAlerts(viewings), [viewings]);
  const hasCriticalViewing = viewingAlerts.some((a) => a.urgency === 'critical');

  const notifications = [
    { id: 1, title: 'تحويل جديد بالبنك', time: 'منذ ساعة', text: 'تم استلام دفعة 200,000 ج.م حجز تاون هاوس دريم لاند' },
    { id: 2, title: 'مهمة مبيعات عاجلة', time: 'منذ 3 ساعات', text: 'تأكيد إرسال عرض تسعير د. محمود حسني للتجمع الخامس' },
  ];

  return (
    <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-8 backdrop-blur-md z-30 flex-shrink-0 sticky top-0 w-full transition-colors duration-200 shadow-md ${
      darkMode
        ? 'bg-[#0F172A]/90 border-slate-800 text-slate-100'
        : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <span className={`cursor-pointer transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>الرئيسية</span>
          <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'} accent-gold`}>لوحة القيادة</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 lg:gap-3.5">
        {/* Global Search */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث شامل..."
            className={`py-1.5 pr-4 pl-9 text-xs w-48 lg:w-64 rounded-full border focus:outline-none transition-all ${
              darkMode
                ? 'bg-slate-900 border-slate-700/80 focus:border-gold text-slate-200 placeholder-slate-400'
                : 'bg-slate-100 border-slate-300 focus:border-amber-500 text-slate-800 placeholder-slate-400'
            }`}
          />
          <Search className={`absolute left-3 top-2 w-3.5 h-3.5 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>

        {/* Theme Switcher Button (☀️ نهار / 🌙 ليل) */}
        <button
          onClick={onToggleDarkMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-gold/50'
              : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm'
          }`}
          title={darkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline">نهار</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">ليل</span>
            </>
          )}
        </button>

        {/* Notifications & Quick Actions */}
          {onOpenSystemAdmin && (
            <button
              onClick={onOpenSystemAdmin}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
              title="مركز أمان ورقابة قاعدة البيانات والنسخ الاحتياطي"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>الرقابة والنسخ</span>
            </button>
          )}

          <button
            onClick={onOpenAIAssistant}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-gold/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 accent-gold" />
            <span>مساعد AI</span>
          </button>

          <button
            onClick={onOpenNewProperty}
            className="px-3.5 py-1.5 bg-gold text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عقار +</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border relative transition-colors cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
              title="نظام التنبيهات الآلي للمعاينات والإدارة"
            >
              <Bell className="w-4 h-4" />
              {viewingAlerts.length > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  {hasCriticalViewing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black text-white items-center justify-center border-2 border-white dark:border-[#0B1120]">
                    {viewingAlerts.length}
                  </span>
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className={`absolute left-0 mt-2 w-88 rounded-2xl shadow-2xl overflow-hidden z-50 border ${
                darkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div>
                    <h3 className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      نظام التنبيهات الآلي للإدارة
                    </h3>
                    <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      المعاينات المجدولة والعاجلة
                    </p>
                  </div>
                  <span className="text-[10px] bg-gold/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {viewingAlerts.length} معاينة قادمة
                  </span>
                </div>

                <div className={`divide-y max-h-80 overflow-y-auto ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {/* Viewing alerts section */}
                  {viewingAlerts.length > 0 ? (
                    viewingAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 text-right transition-colors ${
                          alert.urgency === 'critical'
                            ? darkMode
                              ? 'bg-rose-950/20 hover:bg-rose-950/30'
                              : 'bg-rose-50 hover:bg-rose-100/60'
                            : darkMode
                            ? 'hover:bg-slate-800/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${alert.badgeColor}`}>
                            {alert.badgeLabel}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-500">
                            {alert.timeFormatted}
                          </span>
                        </div>

                        <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {alert.title}
                        </p>

                        <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span>العميل: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{alert.clientName}</strong></span>
                            {alert.clientPhone && <span>📞 {alert.clientPhone}</span>}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>المسئول: {alert.agentName}</span>
                            {alert.driverName && <span>السائق: {alert.driverName}</span>}
                          </div>
                        </div>

                        {onNavigateTab && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateTab('viewings');
                                setShowNotifications(false);
                              }}
                              className="text-[10px] font-bold text-amber-500 hover:text-amber-400 underline cursor-pointer"
                            >
                              عرض في جدول المعاينات ←
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      لا توجد معاينات عاجلة مجدولة لليوم أو الغد 👍
                    </div>
                  )}

                  {/* General notifications */}
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 text-right transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold accent-gold mb-1">
                        <span>{n.title}</span>
                        <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{n.time}</span>
                      </div>
                      <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{n.text}</p>
                    </div>
                  ))}
                </div>

                {onNavigateTab && (
                  <div className={`p-2.5 text-center border-t ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('viewings');
                        setShowNotifications(false);
                      }}
                      className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                    >
                      فتح مركز المعاينات الميدانية بالكامل
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Role Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer font-semibold ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 hover:border-gold/50 text-slate-200'
                  : 'bg-slate-100 border-slate-300 hover:border-amber-500 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 accent-gold" />
              <span className="hidden sm:inline">{currentRoleObj.labelAr.split('(')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className={`absolute left-0 mt-2 w-72 border rounded-xl shadow-2xl overflow-hidden z-50 divide-y ${
                darkMode ? 'bg-[#0F172A] border-slate-700 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'
              }`}>
                <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                  darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'
                }`}>
                  اختر الدور الوظيفي (RBAC)
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {USER_ROLES.map((role) => (
                    <button
                      key={role.key}
                      onClick={() => {
                        onRoleChange(role.key);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                        darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                      } ${
                        activeRole === role.key ? 'bg-amber-500/10 border-r-2 border-gold text-amber-500 font-bold' : darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{role.labelAr}</span>
                        {activeRole === role.key && <UserCheck className="w-3.5 h-3.5 accent-gold" />}
                      </div>
                      <span className={`text-[10px] font-normal ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{role.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  };
