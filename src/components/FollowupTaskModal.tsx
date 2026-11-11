import React, { useState } from 'react';
import { X, CheckSquare, Clock, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react';
import { Property, FollowupTask } from '../types';
import { api } from '../services/api';

interface FollowupTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  employees?: any[];
  currentUser?: any;
  taskToReassign?: FollowupTask | null;
  onSuccess: () => void;
}

export const FollowupTaskModal: React.FC<FollowupTaskModalProps> = ({
  isOpen,
  onClose,
  properties,
  employees = [],
  currentUser,
  taskToReassign,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isReassign = !!taskToReassign;

  const [selectedPropertyId, setSelectedPropertyId] = useState(
    taskToReassign ? taskToReassign.propertyId : (properties[0]?.id || '')
  );
  const selectedProp = properties.find((p) => p.id === selectedPropertyId);

  const [assignedToId, setAssignedToId] = useState(
    employees[0]?.id || currentUser?.id || 'emp-marketer-1'
  );
  const [priority, setPriority] = useState<'عاجلة جداً' | 'مرتفعة' | 'متوسطة' | 'عادية'>('مرتفعة');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [taskDetails, setTaskDetails] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedEmployee = employees.find((e) => e.id === assignedToId) || {
    id: assignedToId,
    name: employees[0]?.name || 'مسوق الماسة',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (isReassign && taskToReassign) {
        if (!reassignReason) {
          setErrorMessage('يرجى كتابة سبب إعادة الإسناد للمسؤول');
          setIsSubmitting(false);
          return;
        }
        await api.reassignFollowupTask(
          taskToReassign.id,
          selectedEmployee.id,
          selectedEmployee.name,
          reassignReason
        );
      } else if (selectedProp) {
        await api.createFollowupTask({
          propertyId: selectedProp.id,
          propertyCode: selectedProp.code,
          propertyTitle: selectedProp.title,
          ownerId: selectedProp.ownerId,
          ownerName: selectedProp.ownerName,
          ownerPhone: selectedProp.ownerPhone,
          assignedToId: selectedEmployee.id,
          assignedToName: selectedEmployee.name,
          priority,
          dueDate,
          taskDetails: taskDetails || `متابعة دورية لتأكيد توافر الوحدة [${selectedProp.code}] وسعرها المطلوب`,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Task error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ المهمة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isReassign ? `إعادة إسناد مهمة المتابعة [${taskToReassign?.propertyCode}]` : 'إنشاء مهمة متابعة دورية جديدة'}
              </h3>
              <p className="text-[11px] text-slate-400">تحديد الموظف المسؤول، الأجل الزمني، وتنبيهات التأخير الإشرافية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isReassign && (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">الوحدة العقارية المعنية:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} - المالك: {p.ownerName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {isReassign ? 'الموظف البديل المسند إليه:' : 'الموظف المسند إليه المهمة:'}
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || emp.role || 'فريق التسويق'})
                  </option>
                ))
              ) : (
                <>
                  <option value="emp-1">محمود حسن (مسؤول التجمع الخامس)</option>
                  <option value="emp-2">سارة كمال (مسؤولة الشيخ زايد)</option>
                  <option value="emp-3">أحمد عادل (مسؤول الملاك والوحدات)</option>
                </>
              )}
            </select>
          </div>

          {!isReassign && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">مستوى الأولوية:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                >
                  <option value="عاجلة جداً">🔥 عاجلة جداً (تأكيد فوري)</option>
                  <option value="مرتفعة">⚡ مرتفعة</option>
                  <option value="متوسطة">🔹 متوسطة</option>
                  <option value="عادية">🟢 عادية</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">تاريخ الاستحقاق الأخير:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
                />
              </div>
            </div>
          )}

          {isReassign ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">سبب إعادة الإسناد (توثيق إشرافي):</label>
              <textarea
                rows={3}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="مثال: إجازة الموظف السابق / إعادة توزيع جغرافية للمناطق / طلب المشرف..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">تعليمات المهمة والملاحظات:</label>
              <textarea
                rows={3}
                value={taskDetails}
                onChange={(e) => setTaskDetails(e.target.value)}
                placeholder="تعليمات للموظف: الاستفسار عن مرونة السعر، تأكيد إمكانية المعاينة غداً، تفاوض على التقسيط..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
          >
            إلغاء
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20 cursor-pointer transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isReassign ? 'تأكيد إعادة الإسناد' : 'إنشاء وتكليف المهمة'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
