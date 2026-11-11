import React from 'react';
import { Kanban, ArrowRightLeft, DollarSign, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomerLead, LeadStatus } from '../types';

interface SalesPipelineViewProps {
  clients: CustomerLead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
  isDarkMode?: boolean;
}

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({ clients, onUpdateStatus, isDarkMode = true }) => {
  const pipelineStages: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'عميل جديد', label: 'عميل جديد', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
    { id: 'تم التواصل', label: 'تم التواصل', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' },
    { id: 'مهتم', label: 'مهتم بالعروض', color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10' },
    { id: 'معاينة محددة', label: 'معاينة محددة', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { id: 'تفاوض', label: 'تفاوض مالي', color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
    { id: 'حجز', label: 'تم الحجز (جدية)', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
    { id: 'عقد موقع', label: 'توقيع العقد', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
    { id: 'مباع', label: 'صفقة مكتملة', color: 'border-emerald-600 text-emerald-300 bg-emerald-600/20' },
  ];

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Kanban className="w-5 h-5 text-amber-400" />
            <span>مراحل ومسار المبيعات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة حركة الفرص البيعية وتحديث مراحل الصفقات ومعدل الإغلاق المالي.
          </p>
        </div>
      </div>

      {/* Kanban Board Columns Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {pipelineStages.map((stage) => {
          const stageClients = clients.filter((c) => c.leadStatus === stage.id);
          const totalStageBudget = stageClients.reduce((acc, c) => acc + (c.budgetMax || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg"
            >
              {/* Column Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{stageClients.length} عميل</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>إجمالي القيمة التقديرية:</span>
                  <span className="font-bold text-amber-400">{formatEGP(totalStageBudget)}</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 min-h-[350px]">
                {stageClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 transition-all shadow-md space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        {client.name}
                      </h4>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                        {client.leadSource}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      طلب: <strong className="text-amber-400">{client.preferredType}</strong> في {client.preferredDistrict}
                    </div>

                    <div className="text-xs font-black text-emerald-400">{formatEGP(client.budgetMax)}</div>

                    {/* Stage Switcher Controls */}
                    <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 truncate">{client.assignedAgentName.split(' ')[0]}</span>
                      <select
                        value={client.leadStatus}
                        onChange={(e) => onUpdateStatus(client.id, e.target.value as LeadStatus)}
                        className="bg-slate-900 text-amber-400 font-bold border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      >
                        {pipelineStages.map((ps) => (
                          <option key={ps.id} value={ps.id}>
                            نقل إلى: {ps.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {stageClients.length === 0 && (
                  <div className="h-40 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    لا يوجد صفقات حالية
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
