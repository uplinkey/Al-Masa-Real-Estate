import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppTask } from '../types';

interface TaskManagementViewProps {
  tasks: AppTask[];
  onAddTask: (task: Partial<AppTask>) => void;
  onUpdateTaskStatus: (id: string, status: any) => void;
  isDarkMode?: boolean;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({ tasks, onAddTask, onUpdateTaskStatus, isDarkMode = true }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<AppTask>>({
    title: '',
    description: '',
    assignedToName: 'أحمد مراد',
    priority: 'عالية',
    deadline: '2026-02-22',
    status: 'قيد الانتظار',
    category: 'اتصال',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask(formData);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <span>المهام والمتابعة</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إسناد ومتابعة مهام فريق العمل وتحديد الأولويات والمواعيد النهائية.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة</span>
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    task.priority === 'عالية جداً' || task.priority === 'عالية'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  أولوية: {task.priority}
                </span>
                <h4 className="text-sm font-bold text-white">{task.title}</h4>
              </div>
              <p className="text-xs text-slate-400">{task.description}</p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span>المسئول: {task.assignedToName}</span>
                <span>تاريخ الاستحقاق: {task.deadline}</span>
              </div>
            </div>

            <button
              onClick={() => onUpdateTaskStatus(task.id, task.status === 'مكتملة' ? 'قيد التنفيذ' : 'مكتملة')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
                task.status === 'مكتملة'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{task.status}</span>
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">إسناد مهمة جديدة</h3>

            <div>
              <label className="block text-slate-300 mb-1">عنوان المهمة *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">وصف التفاصيل *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">الأولوية *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="عالية جداً">عالية جداً</option>
                  <option value="عالية">عالية</option>
                  <option value="متوسطة">متوسطة</option>
                  <option value="منخفضة">منخفضة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">تاريخ الاستحقاق *</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                إلغاء
              </button>
              <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">
                حفظ المهمة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
