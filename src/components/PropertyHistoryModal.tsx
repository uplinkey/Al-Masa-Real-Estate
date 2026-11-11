import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Property, PropertyHistoryRecord } from '../types';
import { api } from '../services/api';
import { toast } from './Toast';

interface PropertyHistoryModalProps {
  property: Property | null;
  isOpen?: boolean;
  onClose: () => void;
  onPropertyChanged?: (updatedProp: Property) => void;
  isDarkMode?: boolean;
}

export const PropertyHistoryModal: React.FC<PropertyHistoryModalProps> = ({
  property,
  isOpen,
  onClose,
  onPropertyChanged,
  isDarkMode = true,
}) => {
  const isEffectiveOpen = isOpen !== undefined ? isOpen : Boolean(property);
  const [historyRecords, setHistoryRecords] = useState<PropertyHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!property) return;
    setIsLoading(true);
    try {
      const records = await api.getPropertyHistory(property.id);
      setHistoryRecords(records);
    } catch (err) {
      console.error('Failed to load property history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEffectiveOpen && property) {
      loadHistory();
    }
  }, [isEffectiveOpen, property]);

  if (!isEffectiveOpen || !property) return null;

  const handleApprove = async (recordId: string) => {
    try {
      const res = await api.approvePropertyHistory(property.id, recordId);
      setActionNotice(res.message);
      loadHistory();
      // Reload updated property from SQLite DB
      const updated = await api.getPropertyById(property.id);
      if (updated && onPropertyChanged) onPropertyChanged(updated);
      toast.success('تم اعتماد التعديل بنجاح وتوثيقه في قاعدة البيانات');
    } catch (err: any) {
      toast.error(err.message || 'فشل اعتماد التعديل');
    }
  };

  const handleReject = async (recordId: string) => {
    const reason = prompt('يرجى ذكر سبب رفض هذا التعديل:');
    if (!reason) return;
    try {
      const res = await api.rejectPropertyHistory(property.id, recordId, reason);
      setActionNotice(res.message);
      loadHistory();
      toast.info('تم رفض التعديل وتوثيق السبب في السجل');
    } catch (err: any) {
      toast.error(err.message || 'فشل رفض التعديل');
    }
  };

  const handleRestore = async (recordId: string, label: string, oldValue: string) => {
    try {
      const res = await api.restorePropertyHistory(property.id, recordId);
      setActionNotice(res.message);
      loadHistory();
      // Reload updated property from SQLite DB
      const updated = await api.getPropertyById(property.id);
      if (updated && onPropertyChanged) onPropertyChanged(updated);
      toast.restore(`تمت استعادة القيمة السابقة بنجاح: "${oldValue}" لحقل (${label}) وتحديث قاعدة البيانات`);
    } catch (err: any) {
      toast.error(err.message || 'فشل استعادة القيمة السابقة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
        isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">سجل تاريخ وتعديلات الوحدة (Property History Audit)</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
                  {property.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {property.title} | {property.district}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Bar */}
        {actionNotice && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-amber-50/50 border-amber-200 text-slate-700'
          }`}>
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>
                توثيق صارم لجميع التعديلات: يسجل النظام هوية القائم بالتعديل، التاريخ والوقت بالثانية، القيمة القديمة والجديدة، وسبب التعديل، مع دعم نظام الاعتماد المزدوج (Maker-Checker).
              </span>
            </span>
            <span className="font-bold text-amber-500 shrink-0">
              {historyRecords.length} حركة مسجلة
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>جاري تحميل سجل تاريخ الوحدة من قاعدة البيانات...</span>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              لم يتم تسجيل أي تعديلات على هذه الوحدة حتى الآن.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:right-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {historyRecords.map((record) => {
                const isPending = record.approvalStatus === 'PENDING';
                const isRejected = record.approvalStatus === 'REJECTED';

                return (
                  <div
                    key={record.id}
                    className={`relative p-4 rounded-xl border transition-all mr-6 ${
                      isPending
                        ? isDarkMode
                          ? 'bg-amber-950/20 border-amber-800/60'
                          : 'bg-amber-50 border-amber-300'
                        : isRejected
                        ? isDarkMode
                          ? 'bg-red-950/15 border-red-800/40 opacity-75'
                          : 'bg-red-50 border-red-200 opacity-75'
                        : isDarkMode
                        ? 'bg-slate-900/70 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute -right-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-[#0F172A] ${
                      isPending ? 'bg-amber-500 animate-pulse' : isRejected ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-amber-400">
                          {record.fieldLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isRejected
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isPending ? '⏳ قيد اعتماد الإدارة (Maker-Checker)' : isRejected ? '❌ تم رفض التعديل' : '✓ معتمد'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{record.changedByName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span dir="ltr">{new Date(record.createdAt).toLocaleString('en-US')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Diff Viewer: Old Value -> New Value */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2 text-xs">
                      <div className={`p-2.5 rounded-lg border ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800 text-red-300' : 'bg-red-50/60 border-red-200 text-red-800'
                      }`}>
                        <span className="text-[10px] block font-bold text-slate-500 mb-0.5">القيمة السابقة (Old Value):</span>
                        <p className="font-mono text-xs break-all">{record.oldValue || '—'}</p>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800 text-emerald-300' : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      }`}>
                        <span className="text-[10px] block font-bold text-slate-500 mb-0.5">القيمة الجديدة المعدلة (New Value):</span>
                        <p className="font-mono text-xs break-all font-bold">{record.newValue || '—'}</p>
                      </div>
                    </div>

                    {record.reason && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        سبب التعديل: <span className="text-slate-300">{record.reason}</span>
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800/40">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleReject(record.id)}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/40 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض التعديل</span>
                          </button>
                          <button
                            onClick={() => handleApprove(record.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>اعتماد وتطبيق التعديل</span>
                          </button>
                        </>
                      )}

                      {!isPending && record.oldValue && (
                        <button
                          onClick={() => handleRestore(record.id, record.fieldLabel, record.oldValue)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                          title="استعادة هذه القيمة السابقة وتطبيقها فوراً على العقار"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                          <span>استعادة القيمة السابقة</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700"
          >
            إغلاق السجل
          </button>
        </div>
      </div>
    </div>
  );
};
