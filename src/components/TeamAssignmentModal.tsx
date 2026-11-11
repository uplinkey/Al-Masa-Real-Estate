import React, { useState } from 'react';
import { X, Users, CheckCircle2, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { Property, PropertyOwner } from '../types';
import { api } from '../services/api';

interface TeamAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  owner?: PropertyOwner | null;
  employees: any[];
  currentUser?: any;
  onSuccess: () => void;
}

export const TeamAssignmentModal: React.FC<TeamAssignmentModalProps> = ({
  isOpen,
  onClose,
  property,
  owner,
  employees,
  currentUser,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [selectedMarketerIds, setSelectedMarketerIds] = useState<string[]>(
    property.assignedMarketerIds || []
  );
  const [assignedOwnerAgentId, setAssignedOwnerAgentId] = useState<string>(
    owner?.assignedEmployeeId || property.assignedMarketerIds?.[0] || employees[0]?.id || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleMarketer = (empId: string) => {
    setSelectedMarketerIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const marketerNames = selectedMarketerIds.map((id) => {
        const emp = employees.find((e) => e.id === id);
        return emp ? emp.name : id;
      });

      // Update property assigned marketers
      await api.updateProperty(property.id, {
        assignedMarketerIds: selectedMarketerIds,
        assignedMarketerNames: marketerNames,
      }, 'تحديث فريق التسويق المسند إليهم الوحدة');

      // Update owner assigned follow-up agent
      if (owner?.id && assignedOwnerAgentId) {
        const agent = employees.find((e) => e.id === assignedOwnerAgentId);
        await api.updateOwner(owner.id, {
          assignedEmployeeId: assignedOwnerAgentId,
          assignedEmployeeName: agent ? agent.name : undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Assignment error:', err);
      setErrorMessage(err.message || 'حدث خطأ في تحديث الإسناد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl text-xs text-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">إسناد فريق العمل والمسوقين</h3>
              <p className="text-[11px] text-slate-400">الوحدة: [{property.code}] {property.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dedicated Owner Follow-up Agent */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
            <label className="block text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>الموظف المسؤول عن متابعة المالك ({property.ownerName}):</span>
            </label>
            <select
              value={assignedOwnerAgentId}
              onChange={(e) => setAssignedOwnerAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
            >
              <option value="">-- غير محدد --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department || emp.role || 'موظف'})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              هو الشخص المنوط به التواصل مع المالك وتأكيد التوافر وتلقي مهام المتابعة التلقائية.
            </p>
          </div>

          {/* Multiple Marketers Assigned to Unit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-200">
                المسوقون المكلفون بالترويج لهذه الوحدة (إسناد متعدد):
              </label>
              <span className="text-[10px] text-blue-400 font-bold">
                {selectedMarketerIds.length} مسوقين محددين
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {employees.map((emp) => {
                const isSelected = selectedMarketerIds.includes(emp.id);
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleMarketer(emp.id)}
                    className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white">{emp.name}</div>
                      <div className="text-[10px] opacity-75">{emp.department || emp.role || 'مسوق عقاري'}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

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
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl font-black shadow-lg shadow-blue-500/20 cursor-pointer transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ التعيينات وتحديث الصلاحيات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
