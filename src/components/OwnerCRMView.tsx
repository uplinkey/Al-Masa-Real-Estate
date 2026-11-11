import React, { useState } from 'react';
import { UserCheck2, Plus, Phone, Mail, Building, FileText, BadgePercent, CreditCard, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { PropertyOwner, Property } from '../types';
import { OwnerFollowupModal } from './OwnerFollowupModal';

interface OwnerCRMViewProps {
  owners: PropertyOwner[];
  properties: Property[];
  onAddOwner: (owner: Partial<PropertyOwner>) => void;
  currentUser?: any;
}

export const OwnerCRMView: React.FC<OwnerCRMViewProps> = ({ owners, properties, onAddOwner, currentUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedPropForFollowup, setSelectedPropForFollowup] = useState<Property | null>(null);

  const [formData, setFormData] = useState<Partial<PropertyOwner>>({
    name: '',
    phones: [''],
    email: '',
    nationalId: '',
    address: '',
    bankAccount: '',
    commissionAgreementPct: 2.5,
    notes: '',
  });

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    onAddOwner(formData);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck2 className="w-6 h-6 text-amber-400" />
            <span>نظام CRM ملاك العقارات المباشرين</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة بيانات الملاك بالكامل، الاتفاقيات الحصرية، الموظف المسؤول عن المتابعة، والتحقق من التعامل مع وسطاء آخرين.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مالك جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map((owner) => {
          const ownerProps = properties.filter((p) => p.ownerId === owner.id || p.ownerName === owner.name);
          return (
            <div key={owner.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{owner.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{owner.phones.join(' • ')}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  عمولة {owner.commissionAgreementPct}%
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">{owner.nationalId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    العقارات المسجلة: <strong className="text-amber-400">{ownerProps.length} وحدات</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    مسؤول المتابعة: <strong className="text-purple-300">{owner.assignedEmployeeName || 'غير مسند'}</strong>
                  </span>
                </div>

                {owner.nextFollowupDate && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>المتابعة القادمة: {owner.nextFollowupDate}</span>
                  </div>
                )}

                {owner.dealsWithOthers && (
                  <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>يتعامل مع شركات ووسطاء آخرين ({owner.otherBrokersDetails || 'غير محدد'})</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>الوحدات التابعة:</span>
                  {ownerProps.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedPropForFollowup(ownerProps[0]);
                        setFollowupModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>تسجيل متابعة مالك</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {ownerProps.map((p) => (
                    <div key={p.id} className="text-xs p-2 rounded bg-slate-800/60 flex items-center justify-between">
                      <span className="truncate text-white">{p.title}</span>
                      <span className="text-amber-400 font-bold shrink-0">{p.code}</span>
                    </div>
                  ))}
                  {ownerProps.length === 0 && <span className="text-xs text-slate-500">لا يوجد عقارات حالياً</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <OwnerFollowupModal
        isOpen={followupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        property={selectedPropForFollowup}
        properties={properties}
        owners={owners}
        currentUser={currentUser}
        onFollowupSuccess={() => {}}
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAddOwner}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">تسجيل مالك عقار جديد</h3>

            <div>
              <label className="block text-slate-300 mb-1">اسم المالك بالكامل *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">رقم الهاتف *</label>
              <input
                type="text"
                required
                value={formData.phones?.[0]}
                onChange={(e) => setFormData({ ...formData, phones: [e.target.value] })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">رقم الهوية الوطنية / السجل التجاري *</label>
              <input
                type="text"
                required
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">الحساب البنكي لنسخ العمولات</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="اسم البنك ورقم الحساب"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
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
                حفظ المالك
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
