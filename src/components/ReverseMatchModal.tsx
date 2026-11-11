import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Search, CheckCircle2, Send, 
  ShieldCheck, AlertCircle, ChevronLeft, Phone, Calendar, 
  MapPin, DollarSign, X, Check, Clock
} from 'lucide-react';
import { ReverseClientMatchResult, Property } from '../types';
import { api } from '../services/api';
import { ClientProposalShareModal } from './ClientProposalShareModal';

interface ReverseMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  currentUser: { id: string; name: string; role: string };
  onProposalCreated?: () => void;
}

export const ReverseMatchModal: React.FC<ReverseMatchModalProps> = ({
  isOpen,
  onClose,
  property,
  currentUser,
  onProposalCreated
}) => {
  const [matches, setMatches] = useState<ReverseClientMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // For opening the single proposal share modal
  const [sharingClient, setSharingClient] = useState<ReverseClientMatchResult | null>(null);

  useEffect(() => {
    if (isOpen && property?.id) {
      loadMatchedClients();
    }
  }, [isOpen, property?.id]);

  const loadMatchedClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMatchedClientsForProperty(property.id);
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل العملاء المطابقين للعقار');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedMatches.length === matches.length) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(matches.map(m => m.search_request.id));
    }
  };

  const toggleSelect = (requestId: string) => {
    setSelectedMatches(prev => 
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    );
  };

  const handleBatchApproval = async () => {
    if (selectedMatches.length === 0) return;

    try {
      setIsBatchApproving(true);
      setBatchSuccessMsg(null);
      
      const payload = selectedMatches.map(requestId => {
        const match = matches.find(m => m.search_request.id === requestId);
        return {
          client_id: match!.client.id,
          property_id: property.id,
          search_request_id: requestId,
          proposed_by_id: currentUser.id,
          proposed_by_name: currentUser.name,
          share_channel: 'واتساب',
          offered_price: property.price,
          internal_notes: `مطابقة عكسية جماعية (نسبة التطابق ${match?.match_score}%)`
        };
      });

      const res: any = await (api as any).batchApproveProposals(payload, currentUser.id, currentUser.name);
      const count = res?.count || res?.created_count || payload.length;
      setBatchSuccessMsg(`تم بنجاح اعتماد وإنشاء ${count} اقتراح وإرسال إشعار للمسؤولين`);
      setSelectedMatches([]);
      await loadMatchedClients();
      if (onProposalCreated) onProposalCreated();
    } catch (err: any) {
      setError(err.message || 'فشل في الاعتماد الجماعي');
    } finally {
      setIsBatchApproving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">مطابقة العملاء المهتمين بالوحدة</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {matches.length} طلب مطابق
                </span>
              </div>
              <p className="text-xs text-slate-300">
                العقار: {property.title} | {property.property_type} في {property.location} ({property.price.toLocaleString('en-US')} ج.م)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={matches.length > 0 && selectedMatches.length === matches.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>تحديد الكل ({matches.length})</span>
            </label>
            {selectedMatches.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg">
                تم تحديد {selectedMatches.length} عميل
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApproval}
              disabled={selectedMatches.length === 0 || isBatchApproving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              {isBatchApproving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>اعتماد واقتراح للمحددين دفعة واحدة</span>
            </button>
          </div>
        </div>

        {batchSuccessMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{batchSuccessMsg}</span>
            </div>
            <button onClick={() => setBatchSuccessMsg(null)} className="text-emerald-600 hover:underline">
              إغلاق
            </button>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">جاري تشغيل محرك المطابقة العكسية عبر طلبات العملاء...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">لا توجد طلبات عملاء مطابقة لهذه الوحدة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">تأكد من توافر طلبات شراء/إيجار نشطة تتقاطع مع مواصفات وميزانية هذا العقار.</p>
            </div>
          ) : (
            matches.map((item) => {
              const isSelected = selectedMatches.includes(item.search_request.id);
              return (
                <div
                  key={item.search_request.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.search_request.id)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{item.client.name}</h4>
                          <span className="font-mono text-xs text-slate-500" dir="ltr">{item.client.phone}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.client.lead_status || 'عميل محتمل'}
                          </span>
                          <span className="text-xs text-slate-400">
                            المسؤول: {item.client.assigned_agent_name || 'غير معين'}
                          </span>
                        </div>

                        {/* Request Details */}
                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="font-medium text-slate-800">
                            الطلب: {item.search_request.request_title || item.search_request.property_type}
                          </span>
                          <span>الميزانية: {item.search_request.min_budget?.toLocaleString('en-US') || 0} - {item.search_request.max_budget?.toLocaleString('en-US') || 'غير محدد'} ج.م</span>
                          <span>الموقع المطلوب: {item.search_request.preferred_city} ({item.search_request.preferred_district || 'أي منطقة'})</span>
                        </div>

                        {/* Match Breakdown & Prior Offers */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <span>نسبة التوافق: {item.match_score}%</span>
                          </div>
                          {item.already_proposed ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                              ⚠️ تم عرض هذه الوحدة عليه سابقاً ({item.proposal_history_count} مرة)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-medium border border-sky-200">
                              ✨ لم يُعرض عليه هذا العقار من قبل
                            </span>
                          )}
                          <span className="text-slate-400">
                            تاريخ تسجيل الطلب: {item.search_request.created_at ? new Date(item.search_request.created_at).toLocaleDateString('ar-EG') : 'حديثاً'}
                          </span>
                        </div>

                        {/* Reasons */}
                        {item.match_reasons && item.match_reasons.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.match_reasons.map((reason, idx) => (
                              <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0">
                      <button
                        onClick={() => setSharingClient(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال وتوثيق العرض</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            يتم فحص العقارات المتاحة والمعتمدة فقط واستبعاد الوحدات المباعة أو المؤجرة أو المعلقة.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Single Proposal Sharing Modal */}
      {sharingClient && (
        <ClientProposalShareModal
          isOpen={true}
          onClose={() => setSharingClient(null)}
          client={sharingClient.client}
          property={property}
          searchRequestId={sharingClient.search_request.id}
          currentUser={currentUser}
          onSuccess={() => {
            setSharingClient(null);
            loadMatchedClients();
            if (onProposalCreated) onProposalCreated();
          }}
        />
      )}
    </div>
  );
};
