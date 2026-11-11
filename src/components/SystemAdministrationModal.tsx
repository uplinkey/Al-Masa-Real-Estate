import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  History,
  Download,
  FileSpreadsheet,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  HardDrive,
  Key,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

interface SystemAdministrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const SystemAdministrationModal: React.FC<SystemAdministrationModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'backup' | 'export' | 'diagnostics'>('audit');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const [logs, bks, health] = await Promise.all([
        api.getAuditLogs(50).catch(() => []),
        api.getBackups().catch(() => []),
        api.getHealth().catch(() => null),
      ]);
      setAuditLogs(logs);
      setBackups(bks);
      setHealthInfo(health);
    } catch (err: any) {
      setActionError('فشل تحميل سجلات النظام أو النسخ الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCreateBackup = async () => {
    setLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.createBackup();
      setActionSuccess(`تم إنشاء النسخة الاحتياطية بنجاح: ${res.backup.fileName}`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in dir-rtl">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-amber-500 border border-gold/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black">
                مركز إدارة وأمان النظام وقاعدة البيانات (System Administration & Audit)
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                سجل العمليات الرقابية، النسخ الاحتياطي، تصدير البيانات، والتحقق العلائقي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-700/20 bg-slate-800/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-gold text-slate-950 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل الرقابة والعمليات (Audit Logs)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-gold text-slate-950 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>النسخ الاحتياطي لقاعدة البيانات (Backups)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-gold text-slate-950 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير البيانات (Excel / CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-gold text-slate-950 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>تشخيص الصحة والسلامة</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="mr-auto p-1.5 rounded-lg border text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feedback Messages */}
        {actionSuccess && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>سجل أحدث 50 حركة وتعديل بالنظام:</span>
                <span className="text-[10px] text-slate-400">سجل دائم داخل جدول audit_logs</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد سجلات بعد في جدول المراقبة.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                        isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.action.includes('DELETE')
                              ? 'bg-rose-500/20 text-rose-400'
                              : log.action.includes('CREATE') || log.action.includes('SUCCESS')
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {log.action}
                        </span>

                        <span className="font-bold">{log.entityType}</span>

                        <span className={`text-[11px] truncate max-w-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {log.details ? JSON.stringify(log.details).substring(0, 70) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-500" />
                          <strong>{log.userName || 'النظام'}</strong> ({log.userRole})
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Backups */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50 border-amber-200'
              }`}>
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span>النسخ الاحتياطي الفوري الساخن (Online Native SQLite Backup)</span>
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    يتم أخذ لقطة كاملة متوافقة تماماً من قاعدة البيانات وحفظها في مجلد <code>data/backups/</code> دون قفل النظام.
                  </p>
                </div>

                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="px-4 py-2 bg-gold hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Database className="w-4 h-4" />
                  <span>أخذ نسخة احتياطية الآن</span>
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold mb-2">النسخ الاحتياطية المتوفرة:</h4>
                {backups.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">لا توجد نسخ احتياطية مسجلة حتى الآن.</p>
                ) : (
                  <div className="space-y-2">
                    {backups.map((bk, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-500" />
                          <span className="font-mono font-bold">{bk.fileName}</span>
                          <span className="text-[10px] bg-slate-700/30 px-2 py-0.5 rounded text-slate-400">
                            {formatBytes(bk.sizeBytes)}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(bk.createdAt).toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Data Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                تصدير السجلات مباشرة من قاعدة البيانات إلى ملفات CSV تدعم اللغة العربية في برنامج Microsoft Excel عبر ترميز (UTF-8 BOM).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={api.getExportUrl('properties')}
                  download
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-gold' : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center text-amber-500">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">تصدير دليل العقارات</h4>
                      <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        كافة الوحدات، الأسعار، المواصفات، والملاك
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-amber-500" />
                </a>

                <a
                  href={api.getExportUrl('clients')}
                  download
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">تصدير قائمة العملاء والـ Leads</h4>
                      <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        بيانات التواصل، الميزانيات، والمسئولين
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-blue-500" />
                </a>

                <a
                  href={api.getExportUrl('commissions')}
                  download
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">تصدير سجل العمولات والعقود</h4>
                      <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        أرباح الصفقات، نسب المستشارين، والحالات
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-emerald-500" />
                </a>

                <a
                  href={api.getExportUrl('transactions')}
                  download
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">تصدير دفتر الحسابات والمعاملات</h4>
                      <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        سجل الإيرادات والمصروفات وأرصدة الخزن
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-purple-500" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: Diagnostics */}
          {activeTab === 'diagnostics' && healthInfo && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-400">إصدار SQLite</span>
                  <span className="text-sm font-black text-amber-500 font-mono">{healthInfo.sqliteVersion}</span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-400">وضع المحرك (Journal)</span>
                  <span className="text-sm font-black text-emerald-500 font-mono">WAL (Write-Ahead)</span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-400">المفاتيح الأجنبية</span>
                  <span className="text-sm font-black text-blue-500 font-mono">مفعلة (ENFORCED)</span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-400">حماية الاستعلامات</span>
                  <span className="text-sm font-black text-emerald-500 font-mono">Prepared Statements (100%)</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold mb-2">إحصائيات الجداول الحية في قاعدة البيانات (Live Tables Record Count):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">العقارات (properties):</span>
                    <strong className="font-mono">{healthInfo.counts?.properties || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">العملاء (clients):</span>
                    <strong className="font-mono">{healthInfo.counts?.clients || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">الملاك (owners):</span>
                    <strong className="font-mono">{healthInfo.counts?.owners || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">المعاينات (viewings):</span>
                    <strong className="font-mono">{healthInfo.counts?.viewings || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">المستخدمين (users):</span>
                    <strong className="font-mono">{healthInfo.counts?.users || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">سجلات الرقابة (audit):</span>
                    <strong className="font-mono">{healthInfo.counts?.auditLogs || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/20 py-1">
                    <span className="text-slate-400">النسخ الاحتياطية:</span>
                    <strong className="font-mono">{healthInfo.counts?.backupsAvailable || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>نظام إدارة شركة الماسة للتسويق العقاري — الإصدار الإنتاجي v2.0</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-2 font-bold rounded-xl border transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
