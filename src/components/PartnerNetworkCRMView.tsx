import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Handshake, DollarSign, Plus, Search, 
  FileCheck, Shield, ChevronLeft, CheckCircle2, Clock, 
  AlertCircle, Phone, Mail, MapPin, Eye, Receipt, 
  TrendingUp, Percent, ArrowUpRight, ArrowDownRight, Layers, FileText
} from 'lucide-react';
import { PartnerCompany, RealEstateDeal, EquityPartner, Property } from '../types';
import { api } from '../services/api';

interface PartnerNetworkCRMViewProps {
  currentUser: { id: string; name: string; role: string };
  properties: Property[];
  isDarkMode?: boolean;
}

export const PartnerNetworkCRMView: React.FC<PartnerNetworkCRMViewProps> = ({
  currentUser,
  properties,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'deals' | 'splits' | 'equity' | 'portal'>('partners');
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [deals, setDeals] = useState<RealEstateDeal[]>([]);
  const [equityPartners, setEquityPartners] = useState<EquityPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  // Modals state
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedSplitToDisburse, setSelectedSplitToDisburse] = useState<any>(null);
  const [selectedPartnerForPortal, setSelectedPartnerForPortal] = useState<PartnerCompany | null>(null);

  // New Partner Form
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    companyType: 'شركة تسويق عقاري',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    defaultCommissionSharePct: 50.0,
    agreementStartDate: new Date().toISOString().split('T')[0],
    termsNotes: '',
  });

  // New Deal Form
  const [dealForm, setDealForm] = useState({
    propertyId: '',
    dealType: 'بيع',
    dealPrice: 5000000,
    agreedCommission: 125000,
    finalNegotiatedCommission: 125000,
    collectedAmount: 125000,
    clientName: '',
    clientPhone: '',
    clientSource: 'إعلان فيسبوك',
    propertySource: 'مالك مباشر',
    partnerCompanyId: '',
    primaryAgentId: currentUser.id,
    primaryAgentName: currentUser.name,
    closerUserId: currentUser.id,
    closerUserName: currentUser.name,
    dealDate: new Date().toISOString().split('T')[0],
    partnerSharePct: 50,
    agentSharePct: 15,
    companyReservePct: 35,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [partnersData, dealsData, equityData] = await Promise.all([
        api.getPartnerCompanies().catch(() => []),
        api.getRealEstateDeals().catch(() => []),
        api.getEquityPartners().catch(() => []),
      ]);
      setPartners(partnersData);
      setDeals(dealsData);
      setEquityPartners(equityData);
      if (partnersData.length > 0 && !selectedPartnerForPortal) {
        setSelectedPartnerForPortal(partnersData[0]);
      }
    } catch (err) {
      console.error('Error loading partner data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPartnerCompany(partnerForm);
      setShowAddPartnerModal(false);
      setPartnerForm({
        name: '',
        companyType: 'شركة تسويق عقاري',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        defaultCommissionSharePct: 50.0,
        agreementStartDate: new Date().toISOString().split('T')[0],
        termsNotes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الشركة الشريكة');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedProp = properties.find((p) => p.id === dealForm.propertyId);
      const selectedPartner = partners.find((p) => p.id === dealForm.partnerCompanyId);

      // Build splits
      const splits: any[] = [];
      if (dealForm.propertySource === 'شركة تسويق متعاونة' && selectedPartner) {
        splits.push({
          beneficiaryType: 'شركة تسويق متعاونة',
          beneficiaryId: selectedPartner.id,
          beneficiaryName: selectedPartner.name,
          beneficiaryRole: 'مورد الوحدة / شركة متعاونة',
          percentage: Number(dealForm.partnerSharePct),
        });
      }
      splits.push({
        beneficiaryType: 'مسوق داخلي',
        beneficiaryId: currentUser.id,
        beneficiaryName: currentUser.name,
        beneficiaryRole: 'مسؤول المبيعات وإتمام الصفقة',
        percentage: Number(dealForm.agentSharePct),
      });
      splits.push({
        beneficiaryType: 'حصة الشركة والاحتياطي',
        beneficiaryId: 'corp-almasa',
        beneficiaryName: 'شركة الماسة للتسويق العقاري (احتياطي وأرباح)',
        beneficiaryRole: 'إيراد الشركة وصافي الأرباح',
        percentage: Number(dealForm.companyReservePct),
      });

      await api.createRealEstateDeal({
        ...dealForm,
        propertyCode: selectedProp?.code || 'PROP-AUTO',
        propertyTitle: selectedProp?.title || 'عقار مسجل',
        ownerName: selectedProp?.ownerName || 'مالك العقار',
        ownerPhone: selectedProp?.ownerPhone || '',
        partnerCompanyName: selectedPartner?.name,
        splits,
      });

      setShowNewDealModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الصفقة العقارية');
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSplitToDisburse) return;
    try {
      const amount = Number((document.getElementById('disburseAmount') as HTMLInputElement)?.value);
      const paymentMethod = (document.getElementById('disburseMethod') as HTMLSelectElement)?.value;
      const receiptNo = (document.getElementById('disburseReceipt') as HTMLInputElement)?.value;

      await api.disburseCommissionSplit(selectedSplitToDisburse.id, {
        amount,
        paymentMethod,
        receiptNumber: receiptNo,
      });

      setShowDisburseModal(false);
      setSelectedSplitToDisburse(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل صرف العمولة');
    }
  };

  const formatEGP = (num?: number) => {
    if (num === undefined || num === null) return '0 ج.م';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num) + ' ج.م';
  };

  // Aggregated KPI Stats
  const totalAgreedCommissions = deals.reduce((acc, d) => acc + (d.finalNegotiatedCommission || 0), 0);
  const totalCollectedCommissions = deals.reduce((acc, d) => acc + (d.collectedAmount || 0), 0);
  const totalDisbursedCommissions = deals.reduce((acc, d) => acc + (d.totalPaidOut || 0), 0);
  const totalRemainingToCollect = deals.reduce((acc, d) => acc + (d.remainingAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">نظام التعاون العقاري وإدارة الصفقات وتوزيع العمولات</h2>
              <p className="text-xs text-slate-300">
                منظومة متكاملة للشراكات التجارية، عزل حسابات الشركات، توزيع الحصص، رقابة التحصيل، وصرف مستحقات المسوقين والشركاء.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddPartnerModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل شركة متعاونة</span>
          </button>
          <button
            onClick={() => setShowNewDealModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>تسجيل صفقة جديدة وتوزيع عمولتها</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">إجمالي العمولات المتفق عليها</span>
          <div className="text-xl font-black text-white">{formatEGP(totalAgreedCommissions)}</div>
          <span className="text-[10px] text-indigo-400">{deals.length} صفقات مسجلة</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">المحصل فعلياً في الخزينة</span>
          <div className="text-xl font-black text-emerald-400">{formatEGP(totalCollectedCommissions)}</div>
          <span className="text-[10px] text-emerald-500">قابل للتوزيع وفق السياسة المعتمدة</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">المصروف للمستحقين والشركات</span>
          <div className="text-xl font-black text-blue-400">{formatEGP(totalDisbursedCommissions)}</div>
          <span className="text-[10px] text-slate-400">شيكات وتحويلات مثبتة بإيصالات</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">المتبقي للتحصيل من العملاء/الملاك</span>
          <div className="text-xl font-black text-amber-400">{formatEGP(totalRemainingToCollect)}</div>
          <span className="text-[10px] text-amber-500">لا تصرف حصصها حتى السداد التام</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'partners'
              ? 'border-amber-400 text-amber-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>الشركات المتعاونة ({partners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deals')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'deals'
              ? 'border-amber-400 text-amber-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سجل الصفقات وتوزيع العمولات ({deals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('portal')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'portal'
              ? 'border-amber-400 text-amber-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>بوابة الشركة المتعاونة (عزل الحسابات والشفافية)</span>
        </button>

        <button
          onClick={() => setActiveTab('equity')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'equity'
              ? 'border-amber-400 text-amber-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>الشركاء وحسابات رأس المال ({equityPartners.length})</span>
        </button>
      </div>

      {/* TAB 1: PARTNER COMPANIES */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم الشركة أو الشخص المسؤول أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners
              .filter((p) => p.name.includes(searchTerm) || p.contactPerson.includes(searchTerm) || p.phone.includes(searchTerm))
              .map((partner) => (
                <div key={partner.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{partner.name}</h4>
                      <span className="text-[11px] text-amber-400 font-medium">{partner.companyType}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {partner.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>المسؤول: {partner.contactPerson}</span>
                    </p>
                    <p className="flex items-center gap-2 font-mono" dir="ltr">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{partner.phone}</span>
                    </p>
                    {partner.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{partner.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">الوحدات</span>
                      <div className="font-bold text-white">{partner.totalUnitsSupplied}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">الصفقات</span>
                      <div className="font-bold text-emerald-400">{partner.totalDealsClosed}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">النسبة</span>
                      <div className="font-bold text-amber-400">{partner.defaultCommissionSharePct}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">المستحق المتبقي:</span>
                    <span className="font-bold text-emerald-400">{formatEGP(partner.remainingCommission)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedPartnerForPortal(partner);
                        setActiveTab('portal');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>فتح كشف الحساب</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEALS & COMMISSIONS */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">رقم الصفقة</th>
                  <th className="p-3">العقار</th>
                  <th className="p-3">العميل والمصدر</th>
                  <th className="p-3">نوع العملية</th>
                  <th className="p-3">قيمة الصفقة</th>
                  <th className="p-3">إجمالي العمولة</th>
                  <th className="p-3">المحصل والمتبقي</th>
                  <th className="p-3">توزيع الأطراف</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{deal.dealNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{deal.propertyTitle}</div>
                      <span className="font-mono text-[10px] text-slate-500">{deal.propertyCode}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-white">{deal.clientName}</div>
                      <span className="text-[10px] text-slate-400">{deal.clientSource}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {deal.dealType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{formatEGP(deal.dealPrice)}</td>
                    <td className="p-3 font-bold text-amber-400">{formatEGP(deal.finalNegotiatedCommission)}</td>
                    <td className="p-3">
                      <div className="text-emerald-400 font-bold">محصل: {formatEGP(deal.collectedAmount)}</div>
                      {deal.remainingAmount > 0 && (
                        <div className="text-rose-400 text-[10px]">متبقي: {formatEGP(deal.remainingAmount)}</div>
                      )}
                    </td>
                    <td className="p-3 space-y-1">
                      {deal.splits?.map((split) => (
                        <div key={split.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                          <span className="truncate max-w-[120px]" title={split.beneficiaryName}>
                            {split.beneficiaryName} ({split.percentage}%)
                          </span>
                          <span className="font-bold text-amber-300">{formatEGP(split.allocatedAmount)}</span>
                          {split.remainingAmount > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedSplitToDisburse(split);
                                setShowDisburseModal(true);
                              }}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              صرف
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400">✓ مصروَف</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {deal.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PARTNER PORTAL / STATEMENT (عزل حسابات الشركات) */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">الشركة المتعاونة المعروضة:</span>
              <select
                value={selectedPartnerForPortal?.id || ''}
                onChange={(e) => {
                  const p = partners.find((item) => item.id === e.target.value);
                  setSelectedPartnerForPortal(p || null);
                }}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.companyType})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              🔒 معزول أمنياً: الشركة لا تطلع إلا على وحداتها وصفقاتها ومستحقاتها المصرح بها
            </div>
          </div>

          {selectedPartnerForPortal && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{selectedPartnerForPortal.name}</h3>
                  <p className="text-xs text-slate-400">
                    الشخص المسؤول: {selectedPartnerForPortal.contactPerson} | هاتف: {selectedPartnerForPortal.phone}
                  </p>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400">المستحق الصافي:</span>
                  <div className="text-xl font-black text-emerald-400">
                    {formatEGP(selectedPartnerForPortal.remainingCommission)}
                  </div>
                </div>
              </div>

              {/* Partner Units & Deals */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">الصفقات والعمولات المستحقة للشركة</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">رقم الصفقة</th>
                        <th className="p-3">العقار</th>
                        <th className="p-3">قيمة العملية</th>
                        <th className="p-3">إجمالي العمولة</th>
                        <th className="p-3">حصة الشركة</th>
                        <th className="p-3">المصروف</th>
                        <th className="p-3">المتبقي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {deals
                        .filter((d) => d.partnerCompanyId === selectedPartnerForPortal.id)
                        .map((deal) => {
                          const partnerSplit = deal.splits?.find((s) => s.beneficiaryId === selectedPartnerForPortal.id);
                          return (
                            <tr key={deal.id}>
                              <td className="p-3 font-mono text-amber-400">{deal.dealNumber}</td>
                              <td className="p-3 font-bold text-white">{deal.propertyTitle}</td>
                              <td className="p-3">{formatEGP(deal.dealPrice)}</td>
                              <td className="p-3">{formatEGP(deal.finalNegotiatedCommission)}</td>
                              <td className="p-3 font-bold text-amber-300">
                                {formatEGP(partnerSplit?.allocatedAmount || 0)} ({partnerSplit?.percentage || 0}%)
                              </td>
                              <td className="p-3 text-emerald-400">{formatEGP(partnerSplit?.paidAmount || 0)}</td>
                              <td className="p-3 text-rose-400 font-bold">{formatEGP(partnerSplit?.remainingAmount || 0)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EQUITY PARTNERS */}
      {activeTab === 'equity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equityPartners.map((ep) => (
              <div key={ep.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{ep.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {ep.equityPercentage}% ملكية
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>رأس المال المساهم: <span className="font-bold text-white">{formatEGP(ep.totalCapitalContributed)}</span></p>
                  <p>الأرباح الموزعة سابقاً: <span className="font-bold text-emerald-400">{formatEGP(ep.totalDividendsPaid)}</span></p>
                  <p>الرصيد الجاري المستحق: <span className="font-bold text-amber-400">{formatEGP(ep.currentBalance)}</span></p>
                </div>
                {ep.notes && <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">{ep.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD PARTNER COMPANY */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreatePartner} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">تسجيل شركة تسويق عقاري متعاونة جديدة</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">اسم الشركة *</label>
                <input
                  type="text"
                  required
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">الشخص المسؤول *</label>
                <input
                  type="text"
                  required
                  value={partnerForm.contactPerson}
                  onChange={(e) => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">نسبة العمولة الافتراضية (%)</label>
                <input
                  type="number"
                  value={partnerForm.defaultCommissionSharePct}
                  onChange={(e) => setPartnerForm({ ...partnerForm, defaultCommissionSharePct: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">نوع الكيان</label>
                <select
                  value={partnerForm.companyType}
                  onChange={(e) => setPartnerForm({ ...partnerForm, companyType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="شركة تسويق عقاري">شركة تسويق عقاري</option>
                  <option value="وسيط مستقل">وسيط مستقل (بروكر)</option>
                  <option value="مطور عقاري">مطور عقاري</option>
                  <option value="شريك استراتيجي">شريك استراتيجي</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setShowAddPartnerModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                إلغاء
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                حفظ الشركة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NEW DEAL & COMMISSION SPLITS */}
      {showNewDealModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateDeal} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">تسجيل صفقة عقارية وتوزيع العمولات</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">الوحدة العقارية المباعة/المؤجرة *</label>
                <select
                  required
                  value={dealForm.propertyId}
                  onChange={(e) => {
                    const p = properties.find((item) => item.id === e.target.value);
                    setDealForm({
                      ...dealForm,
                      propertyId: e.target.value,
                      dealPrice: p?.price || 5000000,
                      agreedCommission: Math.round(((p?.price || 5000000) * (p?.commissionPct || 2.5)) / 100),
                      finalNegotiatedCommission: Math.round(((p?.price || 5000000) * (p?.commissionPct || 2.5)) / 100),
                      collectedAmount: Math.round(((p?.price || 5000000) * (p?.commissionPct || 2.5)) / 100),
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">اختر العقار من السجل...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.title} ({formatEGP(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">اسم العميل المشتري/المستأجر *</label>
                <input
                  type="text"
                  required
                  value={dealForm.clientName}
                  onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مصدر الوحدة *</label>
                <select
                  value={dealForm.propertySource}
                  onChange={(e) => setDealForm({ ...dealForm, propertySource: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="مالك مباشر">مالك مباشر لمكتبنا</option>
                  <option value="شركة تسويق متعاونة">شركة تسويق متعاونة</option>
                  <option value="وسيط خارجي">وسيط خارجي مستقل</option>
                </select>
              </div>

              {dealForm.propertySource === 'شركة تسويق متعاونة' && (
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1">الشركة الشريكة المقدمة للوحدة *</label>
                  <select
                    value={dealForm.partnerCompanyId}
                    onChange={(e) => setDealForm({ ...dealForm, partnerCompanyId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">اختر الشركة المتعاونة...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.defaultCommissionSharePct}% حصة افتراضية)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1">سعر إتمام الصفقة (جنيه) *</label>
                <input
                  type="number"
                  required
                  value={dealForm.dealPrice}
                  onChange={(e) => setDealForm({ ...dealForm, dealPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">العمولة النهائية المتفق عليها (جنيه) *</label>
                <input
                  type="number"
                  required
                  value={dealForm.finalNegotiatedCommission}
                  onChange={(e) => setDealForm({ ...dealForm, finalNegotiatedCommission: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المبلغ المحصل فعلياً الآن (جنيه) *</label>
                <input
                  type="number"
                  required
                  value={dealForm.collectedAmount}
                  onChange={(e) => setDealForm({ ...dealForm, collectedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            {/* Commission Splits Matrix */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400">قواعد توزيع العمولة (%)</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {dealForm.propertySource === 'شركة تسويق متعاونة' && (
                  <div>
                    <span className="text-[10px] text-slate-400">حصة الشركة الشريكة</span>
                    <input
                      type="number"
                      value={dealForm.partnerSharePct}
                      onChange={(e) => setDealForm({ ...dealForm, partnerSharePct: Number(e.target.value) })}
                      className="w-full p-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400">حصة المسوق المباشر</span>
                  <input
                    type="number"
                    value={dealForm.agentSharePct}
                    onChange={(e) => setDealForm({ ...dealForm, agentSharePct: Number(e.target.value) })}
                    className="w-full p-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">إيراد الماسة وصافي الأرباح</span>
                  <input
                    type="number"
                    value={dealForm.companyReservePct}
                    onChange={(e) => setDealForm({ ...dealForm, companyReservePct: Number(e.target.value) })}
                    className="w-full p-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setShowNewDealModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                إلغاء
              </button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">
                اعتماد وحفظ الصفقة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DISBURSE SPLIT */}
      {showDisburseModal && selectedSplitToDisburse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleDisburseSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">صرف مستحق عمولة</h3>
            <p className="text-slate-300">
              المستفيد: <span className="font-bold text-white">{selectedSplitToDisburse.beneficiaryName}</span>
            </p>
            <p className="text-slate-300">
              المتبقي المستحق: <span className="font-bold text-emerald-400">{formatEGP(selectedSplitToDisburse.remainingAmount)}</span>
            </p>

            <div>
              <label className="block text-slate-300 mb-1">المبلغ المراد صرفه (جنيه) *</label>
              <input
                id="disburseAmount"
                type="number"
                defaultValue={selectedSplitToDisburse.remainingAmount}
                max={selectedSplitToDisburse.remainingAmount}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">طريقة الدفع *</label>
              <select id="disburseMethod" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="شيك مصرفي">شيك مصرفي</option>
                <option value="خزينة نقدية (كاش)">خزينة نقدية (كاش)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">رقم الإيصال / الشيك *</label>
              <input id="disburseReceipt" type="text" required defaultValue={`REC-${Date.now().toString().slice(-6)}`} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setShowDisburseModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                إلغاء
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl">
                توثيق الصرف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
