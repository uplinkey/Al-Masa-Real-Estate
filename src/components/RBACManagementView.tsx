import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  Lock,
  Unlock,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  UserX,
  UserCheck,
  FileText,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { Department, SystemRoleModel, RolePermission, UserPermissionOverride, SystemUser } from '../types';

interface RBACManagementViewProps {
  isDarkMode?: boolean;
}

export const RBACManagementView: React.FC<RBACManagementViewProps> = ({ isDarkMode = true }) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'departments_roles' | 'user_overrides' | 'users_list'>('matrix');

  // Core Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<SystemRoleModel[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('role-employee');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<string>('');
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverride[]>([]);

  // UI & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Department & Role Modal
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ code: '', name: '', description: '', managerName: '' });
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ code: '', name: '', departmentId: '', description: '', hierarchyLevel: 5 });

  // Clone Form
  const [cloneForm, setCloneForm] = useState({
    fromType: 'role' as 'role' | 'user',
    fromId: '',
    toType: 'role' as 'role' | 'user',
    toId: '',
  });

  // User Override Form
  const [newOverrideForm, setNewOverrideForm] = useState({
    module: 'properties',
    action: 'edit_price',
    scope: 'ALL' as 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL',
    isAllowed: true,
    validFrom: '',
    validUntil: '',
    reason: 'تصريح استثنائي معتمد من الإدارة العليا',
  });

  const modulesList = [
    { key: 'properties', label: 'العقارات والوحدات' },
    { key: 'clients', label: 'سجل العملاء CRM' },
    { key: 'viewings', label: 'المعاينات الميدانية' },
    { key: 'commissions', label: 'العمولات والأرباح' },
    { key: 'financials', label: 'الحسابات والخزينة' },
    { key: 'tasks', label: 'المهام والمتابعات' },
    { key: 'marketing', label: 'الحملات التسويقية' },
    { key: 'employees', label: 'شؤون الموظفين' },
    { key: 'roles', label: 'إدارة الصلاحيات' },
    { key: 'reports', label: 'التقارير والإحصاءات' },
  ];

  const standardActionsList = [
    { key: 'view', label: 'مشاهدة' },
    { key: 'create', label: 'إضافة' },
    { key: 'edit', label: 'تعديل' },
    { key: 'delete', label: 'حذف/أرشفة' },
    { key: 'approve', label: 'اعتماد' },
    { key: 'reject', label: 'رفض' },
    { key: 'assign', label: 'إسناد' },
    { key: 'export', label: 'تصدير' },
    { key: 'print_reports', label: 'طباعة' },
    { key: 'view_financials', label: 'بيانات مالية' },
    { key: 'manage_permissions', label: 'تحكم بالصلاحيات' },
    { key: 'access_dept_reports', label: 'تقارير القسم' },
    { key: 'access_general_reports', label: 'التقارير العامة' },
  ];

  const propertyGranularActions = [
    { key: 'edit_basic', label: 'تعديل البيانات الأساسية' },
    { key: 'edit_location', label: 'تعديل الموقع والعنوان' },
    { key: 'edit_specs', label: 'تعديل المساحة والمواصفات' },
    { key: 'edit_price', label: 'تعديل السعر والشروط' },
    { key: 'edit_media', label: 'تعديل الصور والمستندات' },
    { key: 'edit_owner', label: 'تعديل بيانات المالك' },
    { key: 'edit_status', label: 'تعديل حالة الوحدة' },
    { key: 'edit_marketing_deal', label: 'تعديل اتفاق التسويق' },
    { key: 'edit_partner_company', label: 'تعديل الشركة المتعاونة' },
    { key: 'edit_commission', label: 'تعديل بيانات العمولة' },
  ];

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [depts, rls, usrs] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getRoles().catch(() => []),
        api.getRbacUsers().catch(() => []),
      ]);
      setDepartments(depts);
      setRoles(rls);
      setUsers(usrs);

      if (rls.length > 0 && !selectedRole) {
        setSelectedRole(rls[0].id);
      }
      if (usrs.length > 0 && !selectedUserForOverride) {
        setSelectedUserForOverride(usrs[0].id);
      }
    } catch (err: any) {
      showNotice('error', 'فشل تحميل بيانات الصلاحيات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      api.getRolePermissions(selectedRole).then((perms) => {
        setRolePermissions(perms);
      }).catch(() => setRolePermissions([]));
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedUserForOverride) {
      api.getUserOverrides(selectedUserForOverride).then((ovrs) => {
        setUserOverrides(ovrs);
      }).catch(() => setUserOverrides([]));
    }
  }, [selectedUserForOverride]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTogglePermission = (module: string, action: string) => {
    setRolePermissions((prev) => {
      const existing = prev.find((p) => p.module === module && p.action === action);
      if (existing) {
        return prev.map((p) =>
          p.module === module && p.action === action
            ? { ...p, isAllowed: !p.isAllowed }
            : p
        );
      } else {
        return [
          ...prev,
          {
            id: `perm-${selectedRole}-${module}-${action}`,
            roleId: selectedRole,
            module,
            action,
            scope: 'DEPARTMENT',
            isAllowed: true,
          },
        ];
      }
    });
  };

  const handleChangeScope = (module: string, action: string, scope: 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL') => {
    setRolePermissions((prev) => {
      const existing = prev.find((p) => p.module === module && p.action === action);
      if (existing) {
        return prev.map((p) =>
          p.module === module && p.action === action ? { ...p, scope } : p
        );
      } else {
        return [
          ...prev,
          {
            id: `perm-${selectedRole}-${module}-${action}`,
            roleId: selectedRole,
            module,
            action,
            scope,
            isAllowed: true,
          },
        ];
      }
    });
  };

  const handleSaveRolePermissions = async () => {
    setIsLoading(true);
    try {
      await api.updateRolePermissions(selectedRole, rolePermissions);
      showNotice('success', 'تم حفظ وتحديث مصفوفة الصلاحيات للدور بنجاح في قاعدة البيانات.');
    } catch (err: any) {
      showNotice('error', err.message || 'فشل حفظ الصلاحيات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.code || !newDeptForm.name) {
      showNotice('error', 'يرجى إدخال كود واسم القسم');
      return;
    }
    try {
      await api.createDepartment(newDeptForm);
      setShowNewDeptModal(false);
      setNewDeptForm({ code: '', name: '', description: '', managerName: '' });
      showNotice('success', 'تم إنشاء القسم الجديد بنجاح');
      loadAllData();
    } catch (err: any) {
      showNotice('error', err.message || 'فشل إنشاء القسم');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.code || !newRoleForm.name) {
      showNotice('error', 'يرجى إدخال كود واسم الدور');
      return;
    }
    try {
      await api.createRole(newRoleForm);
      setShowNewRoleModal(false);
      setNewRoleForm({ code: '', name: '', departmentId: '', description: '', hierarchyLevel: 5 });
      showNotice('success', 'تم إنشاء الدور الوظيفي الجديد بنجاح');
      loadAllData();
    } catch (err: any) {
      showNotice('error', err.message || 'فشل إنشاء الدور');
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForOverride) {
      showNotice('error', 'اختر موظفاً أولاً');
      return;
    }
    try {
      await api.setUserOverride(selectedUserForOverride, newOverrideForm);
      showNotice('success', 'تم تسجيل وتفعيل استثناء الصلاحية للموظف بنجاح');
      const updated = await api.getUserOverrides(selectedUserForOverride);
      setUserOverrides(updated);
    } catch (err: any) {
      showNotice('error', err.message || 'فشل تسجيل الاستثناء');
    }
  };

  const handleRevokeOverride = async (overrideId: string) => {
    if (!confirm('هل أنت متأكد من سحب وإلغاء هذا الاستثناء فوراً؟')) return;
    try {
      await api.revokeUserOverride(overrideId);
      showNotice('success', 'تم سحب الاستثناء واستعادة الصلاحية الافتراضية للدور');
      const updated = await api.getUserOverrides(selectedUserForOverride);
      setUserOverrides(updated);
    } catch (err: any) {
      showNotice('error', 'فشل سحب الاستثناء');
    }
  };

  const handleClonePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneForm.fromId || !cloneForm.toId) {
      showNotice('error', 'يرجى تحديد المصدر والهدف للنسخ');
      return;
    }
    try {
      const res = await api.clonePermissions(cloneForm.fromType, cloneForm.fromId, cloneForm.toType, cloneForm.toId);
      if (res.success) {
        showNotice('success', `تم نسخ الصلاحيات بنجاح (${res.count || 0} صلاحية)`);
        if (cloneForm.toType === 'role' && cloneForm.toId === selectedRole) {
          const perms = await api.getRolePermissions(selectedRole);
          setRolePermissions(perms);
        }
      } else {
        showNotice('error', res.error || 'فشل النسخ');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'فشل نسخ الصلاحيات');
    }
  };

  const handleToggleReadOnly = async (user: SystemUser) => {
    try {
      await api.updateRbacUser(user.id, { isReadOnly: !user.isReadOnly });
      showNotice('success', `تم ${!user.isReadOnly ? 'تفعيل وضع القراءة فقط' : 'إلغاء وضع القراءة فقط'} للحساب: ${user.name}`);
      loadAllData();
    } catch (err: any) {
      showNotice('error', err.message || 'فشل تحديث وضع القراءة');
    }
  };

  const isActionAllowed = (module: string, action: string) => {
    const p = rolePermissions.find((x) => x.module === module && x.action === action);
    return Boolean(p && p.isAllowed);
  };

  const getActionScope = (module: string, action: string): 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL' => {
    const p = rolePermissions.find((x) => x.module === module && x.action === action);
    return p ? p.scope : 'DEPARTMENT';
  };

  const activeRoleObj = roles.find((r) => r.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800'
          : 'bg-gradient-to-r from-amber-50/80 via-white to-slate-50 border-amber-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>نظام إدارة الصلاحيات المركزي (Centralized Enterprise RBAC)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Deny by Default مفعل
                </span>
              </h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                التحكم المركزي التام في أدوار الموظفين، نطاقات الوصول للبيانات، استثناءات الصلاحيات الفردية، وتوثيق سجلات الرقابة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-b border-slate-800/40 pb-3">
          {[
            { id: 'matrix', label: 'مصفوفة الصلاحيات (Permissions Matrix)', icon: Sliders },
            { id: 'departments_roles', label: 'الأقسام والأدوار الوظيفية', icon: Building2 },
            { id: 'user_overrides', label: 'استثناءات الموظفين والصلاحيات المؤقتة', icon: Lock },
            { id: 'users_list', label: 'حسابات الموظفين ونطاق الرقابة', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PERMISSIONS MATRIX TAB */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-5">
          {/* Role Picker Toolbar */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">اختر الدور الوظيفي للتحكم بمصفوفته:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.departmentName || 'عام'}) - مستوى {r.hierarchyLevel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {activeRoleObj?.description}
              </span>
              <button
                onClick={handleSaveRolePermissions}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات في قاعدة البيانات</span>
              </button>
            </div>
          </div>

          {/* Granular Property Edit Permissions Box */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-500">🏢 تفصيل صلاحيات تعديل العقارات (Granular Property Modification RBAC)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  - يسمح بالتحكم المستقل بمن يحق له تعديل السعر، بيانات المالك، اتفاق التسويق، أو الصور
                </span>
              </div>
              <span className="text-xs text-slate-400">
                الدور الحالي: <strong className="text-amber-400">{activeRoleObj?.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {propertyGranularActions.map((act) => {
                const allowed = isActionAllowed('properties', act.key);
                const scope = getActionScope('properties', act.key);
                return (
                  <div
                    key={act.key}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      allowed
                        ? isDarkMode
                          ? 'bg-amber-950/20 border-amber-800/40 text-slate-200'
                          : 'bg-amber-50/50 border-amber-200 text-slate-800'
                        : isDarkMode
                        ? 'bg-slate-900/50 border-slate-800/80 text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowed}
                        onChange={() => handleTogglePermission('properties', act.key)}
                        className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold">{act.label}</span>
                    </label>

                    {allowed && (
                      <select
                        value={scope}
                        onChange={(e) => handleChangeScope('properties', act.key, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                          isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-amber-700'
                        }`}
                      >
                        <option value="OWN">عقاراته فقط (OWN)</option>
                        <option value="TEAM">فريقه (TEAM)</option>
                        <option value="DEPARTMENT">قسمه (DEPT)</option>
                        <option value="ALL">كل الشركة (ALL)</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standard Modules Permissions Table */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="p-4 border-b border-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>جدول صلاحيات الأقسام العامة ونطاق البيانات (Module Access & Scope)</span>
              </h3>
              <span className="text-xs text-slate-400 font-normal">
                مبدأ (Deny by Default) نشط: أي صلاحية غير محددة تعتبر محظورة فورياً في الـ Backend
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <th className="p-3 font-bold w-36">القسم / الوحدة</th>
                    {standardActionsList.map((a) => (
                      <th key={a.key} className="p-3 text-center font-bold">
                        {a.label}
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold">نطاق البيانات (Scope)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                  {modulesList.map((mod) => {
                    const viewAllowed = isActionAllowed(mod.key, 'view');
                    const viewScope = getActionScope(mod.key, 'view');

                    return (
                      <tr
                        key={mod.key}
                        className={`transition-colors ${
                          isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-bold text-amber-500 flex items-center gap-1.5">
                          <span>{mod.label}</span>
                        </td>

                        {standardActionsList.map((act) => {
                          const allowed = isActionAllowed(mod.key, act.key);
                          return (
                            <td key={act.key} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={allowed}
                                onChange={() => handleTogglePermission(mod.key, act.key)}
                                className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}

                        <td className="p-3 text-center">
                          <select
                            value={viewScope}
                            onChange={(e) => handleChangeScope(mod.key, 'view', e.target.value as any)}
                            disabled={!viewAllowed}
                            className={`text-[11px] font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                              viewAllowed
                                ? isDarkMode
                                  ? 'bg-slate-800 border-slate-700 text-amber-300'
                                  : 'bg-white border-slate-300 text-amber-700'
                                : 'opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <option value="OWN">بياناته فقط (OWN)</option>
                            <option value="TEAM">فريق العمل (TEAM)</option>
                            <option value="DEPARTMENT">القسم بالكامل (DEPT)</option>
                            <option value="ALL">جميع بيانات الشركة (ALL)</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800/40 flex justify-end">
              <button
                onClick={handleSaveRolePermissions}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في مصفوفة الصلاحيات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEPARTMENTS & ROLES TAB */}
      {activeSubTab === 'departments_roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments List */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-800/40">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold">أقسام الشركة (Enterprise Departments)</h3>
              </div>
              <button
                onClick={() => setShowNewDeptModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة قسم +</span>
              </button>
            </div>

            <div className="space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-400">{dept.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{dept.description}</p>
                    {dept.managerName && (
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        مدير القسم: {dept.managerName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-bold">
                    {roles.filter((r) => r.departmentId === dept.id).length} أدوار
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Roles List */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-800/40">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold">الأدوار الوظيفية وهيكل الصلاحيات</h3>
              </div>
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دور +</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    selectedRole === role.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : isDarkMode
                      ? 'bg-slate-800/50 border-slate-700/60 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{role.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {role.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                        مستوى {role.hierarchyLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{role.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRole(role.id);
                      setActiveSubTab('matrix');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold border border-slate-700 text-slate-200 cursor-pointer"
                  >
                    تعديل المصفوفة ⚙️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. USER-LEVEL CUSTOM OVERRIDES TAB */}
      {activeSubTab === 'user_overrides' && (
        <div className="space-y-6">
          {/* User Selector & Creator */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-500">
              <Sliders className="w-4 h-4" />
              <span>تخصيص صلاحيات موظف فردي (منح أعلى أو حجب أقل من الدور)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الموظف المراد تخصيصه:</label>
                <select
                  value={selectedUserForOverride}
                  onChange={(e) => setSelectedUserForOverride(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle}) - {u.departmentName || 'بدون قسم'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">القسم / الوحدة:</label>
                <select
                  value={newOverrideForm.module}
                  onChange={(e) => setNewOverrideForm({ ...newOverrideForm, module: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {modulesList.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الصلاحية / العملية:</label>
                <select
                  value={newOverrideForm.action}
                  onChange={(e) => setNewOverrideForm({ ...newOverrideForm, action: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <optgroup label="عمليات عامة">
                    {standardActionsList.map((a) => (
                      <option key={a.key} value={a.key}>{a.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="تعديلات العقار الحساسة">
                    {propertyGranularActions.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">نوع الاستثناء:</label>
                <div className="flex items-center gap-2">
                  <select
                    value={newOverrideForm.isAllowed ? 'allow' : 'deny'}
                    onChange={(e) => setNewOverrideForm({ ...newOverrideForm, isAllowed: e.target.value === 'allow' })}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      newOverrideForm.isAllowed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <option value="allow">منح صلاحية استثنائية (Grant)</option>
                    <option value="deny">حجب وحظر الصلاحية (Deny)</option>
                  </select>
                  <select
                    value={newOverrideForm.scope}
                    onChange={(e) => setNewOverrideForm({ ...newOverrideForm, scope: e.target.value as any })}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-300 text-amber-700'
                    }`}
                  >
                    <option value="OWN">نطاق OWN</option>
                    <option value="TEAM">نطاق TEAM</option>
                    <option value="DEPARTMENT">نطاق DEPT</option>
                    <option value="ALL">نطاق ALL</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Temporary Validity & Reason */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800/40">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">تاريخ البداية (اختياري - صلاحية مؤقتة):</label>
                <input
                  type="date"
                  value={newOverrideForm.validFrom}
                  onChange={(e) => setNewOverrideForm({ ...newOverrideForm, validFrom: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">تاريخ الانتهاء (سحب تلقائي بعد التاريخ):</label>
                <input
                  type="date"
                  value={newOverrideForm.validUntil}
                  onChange={(e) => setNewOverrideForm({ ...newOverrideForm, validUntil: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">سبب الاستثناء الإداري:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOverrideForm.reason}
                    onChange={(e) => setNewOverrideForm({ ...newOverrideForm, reason: e.target.value })}
                    placeholder="مثال: تفويض إدارة صفقات التجمع خلال إجازة المدير"
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  />
                  <button
                    onClick={handleAddOverride}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تطبيق الاستثناء</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Active Overrides for this User */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
              <span>الاستثناءات المفعلة حالياً للموظف ({users.find((u) => u.id === selectedUserForOverride)?.name})</span>
              <span className="text-xs text-slate-400 font-normal">
                {userOverrides.length} استثناء نشط
              </span>
            </h3>

            {userOverrides.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                لا توجد استثناءات فردية مخصصة لهذا الموظف (يعمل وفق الصلاحيات الافتراضية لدوره وقسمه).
              </div>
            ) : (
              <div className="space-y-3">
                {userOverrides.map((ovr) => (
                  <div
                    key={ovr.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ovr.isAllowed
                        ? isDarkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                        : isDarkMode ? 'bg-red-950/20 border-red-800/40' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ovr.isAllowed ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                        }`}>
                          {ovr.isAllowed ? 'صلاحية ممنوحة (Grant)' : 'حجب وحظر (Deny)'}
                        </span>
                        <span className="font-bold text-xs">
                          [{ovr.module}] ➔ {ovr.action}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                          نطاق: {ovr.scope}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">السبب: {ovr.reason}</p>
                      {(ovr.validFrom || ovr.validUntil) && (
                        <p className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>صلاحية مؤقتة: من {ovr.validFrom || 'الآن'} إلى {ovr.validUntil || 'غير محدد'}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRevokeOverride(ovr.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 self-start sm:self-center"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>سحب الصلاحية فوراً</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clone Permissions Panel */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-indigo-400">
              <Copy className="w-4 h-4" />
              <span>نسخ الصلاحيات بين الأدوار أو الموظفين (Clone Permissions)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              يتيح للإدارة العليا استنساخ كافة صلاحيات دور أو موظف ونقلها إلى دور أو موظف آخر بضغطة زر واحدة
            </p>

            <form onSubmit={handleClonePermissions} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نوع المصدر:</label>
                <select
                  value={cloneForm.fromType}
                  onChange={(e) => setCloneForm({ ...cloneForm, fromType: e.target.value as any, fromId: '' })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100'}`}
                >
                  <option value="role">دور وظيفي (Role)</option>
                  <option value="user">موظف محدد (User)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">المصدر (من):</label>
                <select
                  value={cloneForm.fromId}
                  onChange={(e) => setCloneForm({ ...cloneForm, fromId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100'}`}
                >
                  <option value="">-- اختر المصدر --</option>
                  {cloneForm.fromType === 'role'
                    ? roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
                    : users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نوع الهدف:</label>
                <select
                  value={cloneForm.toType}
                  onChange={(e) => setCloneForm({ ...cloneForm, toType: e.target.value as any, toId: '' })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100'}`}
                >
                  <option value="role">دور وظيفي (Role)</option>
                  <option value="user">موظف محدد (User)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">الهدف (إلى):</label>
                <select
                  value={cloneForm.toId}
                  onChange={(e) => setCloneForm({ ...cloneForm, toId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100'}`}
                >
                  <option value="">-- اختر الهدف --</option>
                  {cloneForm.toType === 'role'
                    ? roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
                    : users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>تطبيق النسخ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. USERS LIST & READ-ONLY MANAGEMENT TAB */}
      {activeSubTab === 'users_list' && (
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-800/40">
            <div>
              <h3 className="text-sm font-bold">إدارة حسابات الموظفين ووضع الاطلاع فقط (Read-Only Mode)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد الأدوار، وتفعيل وضع الاطلاع فقط لأي مستخدم لمنع أي عمليات إضافة أو تعديل
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold">{users.length} مستخدم مسجل</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <th className="p-3">الموظف / الاسم</th>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">القسم</th>
                  <th className="p-3">الدور الوظيفي (Role)</th>
                  <th className="p-3 text-center">وضع الاطلاع فقط</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {users.map((u) => (
                  <tr key={u.id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className="p-3 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                          {u.avatar || u.name[0]}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-slate-400">{u.username}</td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {u.departmentName || 'بدون قسم'}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-amber-400">
                      {u.roleTitle || u.role}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleReadOnly(u)}
                        disabled={u.id === 'usr-admin'}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          u.isReadOnly
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {u.isReadOnly ? '🔒 وضع الاطلاع فقط نشط' : '🔓 تعديل عادي'}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {u.active ? 'نشط' : 'معطل'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedUserForOverride(u.id);
                          setActiveSubTab('user_overrides');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] cursor-pointer"
                      >
                        تخصيص الصلاحيات ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Department */}
      {showNewDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>إنشاء قسم إداري جديد</span>
            </h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">كود القسم (مثال: LEGAL, ARCH):</label>
                <input
                  type="text"
                  required
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم القسم بالكامل:</label>
                <input
                  type="text"
                  required
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم مدير القسم:</label>
                <input
                  type="text"
                  value={newDeptForm.managerName}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, managerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">وصف واختصاصات القسم:</label>
                <textarea
                  value={newDeptForm.description}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDeptModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  إنشاء القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Role */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span>إنشاء دور وظيفي جديد</span>
            </h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">كود الدور (مثال: TEAM_LEADER, BROKER):</label>
                <input
                  type="text"
                  required
                  value={newRoleForm.code}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">مسمى الدور بالعربية:</label>
                <input
                  type="text"
                  required
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">القسم التابع له:</label>
                <select
                  value={newRoleForm.departmentId}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, departmentId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                >
                  <option value="">-- بدون قسم محدد (عام) --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">المستوى في الهيكل (1: أعلى مستوى - 6: خارجي):</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newRoleForm.hierarchyLevel}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, hierarchyLevel: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">وصف الصلاحيات المتوقعة:</label>
                <textarea
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  إنشاء الدور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
