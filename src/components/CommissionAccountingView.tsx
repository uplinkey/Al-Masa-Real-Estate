import React, { useState } from 'react';
import { BadgePercent, DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { CommissionRecord, AccountingTransaction } from '../types';

interface CommissionAccountingViewProps {
  commissions: CommissionRecord[];
  transactions: AccountingTransaction[];
  isDarkMode?: boolean;
}

export const CommissionAccountingView: React.FC<CommissionAccountingViewProps> = ({ commissions, transactions, isDarkMode = true }) => {
  const [selectedTab, setSelectedTab] = useState<'commissions' | 'transactions'>('commissions');
  const [calcPrice, setCalcPrice] = useState<number>(8000000);
  const [calcPct, setCalcPct] = useState<number>(2.5);
  const [showInvoiceModal, setShowInvoiceModal] = useState<CommissionRecord | null>(null);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0) + ' ج.م';
  };

  // Commission math
  const companyComm = Math.round(calcPrice * (calcPct / 100));
  const agentShare = Math.round(companyComm * 0.25);
  const managerShare = Math.round(companyComm * 0.1);

  // Accounting totals
  const totalIncome = transactions.filter((t) => t.type === 'إيراد').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'مصروف').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-amber-400" />
            <span>العمولات والحسابات المالية</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            حساب عمولات الصفقات وتوزيع حصص المبيعات ومتابعة حركة الخزينة.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
          <button
            onClick={() => setSelectedTab('commissions')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedTab === 'commissions' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300'
            }`}
          >
            جدول العمولات
          </button>
          <button
            onClick={() => setSelectedTab('transactions')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedTab === 'transactions' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300'
            }`}
          >
            حركة الخزينة والبنك
          </button>
        </div>
      </div>

      {/* Dynamic Commission Calculator Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span>حاسبة العمولات التفاعلية للشركة والموظفين</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">سعر العقار الإجمالي (ج.م):</label>
            <input
              type="number"
              value={calcPrice}
              onChange={(e) => setCalcPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">نسبة العمولة المطلوبة %:</label>
            <input
              type="number"
              step="0.1"
              value={calcPct}
              onChange={(e) => setCalcPct(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-slate-400 text-[10px]">عمولة الشركة الإجمالية:</span>
            <div className="text-sm font-black text-amber-400">{formatEGP(companyComm)}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-slate-400 text-[10px]">حصة مسئول المبيعات (25%):</span>
            <div className="text-sm font-black text-blue-400">{formatEGP(agentShare)}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-slate-400 text-[10px]">حصة مدير القطاع (10%):</span>
            <div className="text-sm font-black text-purple-400">{formatEGP(managerShare)}</div>
          </div>
        </div>
      </div>

      {selectedTab === 'commissions' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="p-3">كود العقار</th>
                <th className="p-3">عنوان الصفقة</th>
                <th className="p-3">قيمة الصفقة</th>
                <th className="p-3">عمولة الشركة (2.5%)</th>
                <th className="p-3">مسئول المبيعات</th>
                <th className="p-3">حصة الموظف</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">طباعة إيصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-amber-400">{c.propertyCode}</td>
                  <td className="p-3 font-semibold text-white">{c.propertyTitle}</td>
                  <td className="p-3 font-bold">{formatEGP(c.dealAmount)}</td>
                  <td className="p-3 font-bold text-amber-400">{formatEGP(c.companyAmount)}</td>
                  <td className="p-3">{c.employeeName}</td>
                  <td className="p-3 font-bold text-blue-400">{formatEGP(c.employeeAmount)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'تم التحصيل' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setShowInvoiceModal(c)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
              <span className="text-xs text-slate-400">إجمالي الإيرادات المحصلة:</span>
              <div className="text-xl font-black mt-1">{formatEGP(totalIncome)}</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400">
              <span className="text-xs text-slate-400">إجمالي المصروفات:</span>
              <div className="text-xl font-black mt-1">{formatEGP(totalExpense)}</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
              <span className="text-xs text-slate-400">صافي الأرباح:</span>
              <div className="text-xl font-black mt-1">{formatEGP(netProfit)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">البند</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">البيان والشرح</th>
                  <th className="p-3">الحساب البنكي / الخزينة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-slate-400">{t.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'إيراد' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{t.category}</td>
                    <td className={`p-3 font-bold ${t.type === 'إيراد' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatEGP(t.amount)}
                    </td>
                    <td className="p-3 text-slate-300">{t.description}</td>
                    <td className="p-3 text-slate-400">{t.cashboxAccount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal Simulation */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-2xl dir-rtl">
            <div className="flex items-center justify-between border-b-2 border-slate-950 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">الماسة للتسويق العقاري</h2>
                <p className="text-xs text-slate-600">Almasa Real Estate Marketing • Cairo</p>
              </div>
              <div className="text-left text-xs text-slate-600 font-mono">
                <div>إيصال تحصيل عمولة</div>
                <div className="font-bold text-slate-900">#REC-2026-99</div>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between">
                <span>اسم الصفقة والعقار:</span>
                <strong className="text-slate-950">{showInvoiceModal.propertyTitle}</strong>
              </div>
              <div className="flex justify-between">
                <span>كود العقار:</span>
                <strong className="text-slate-950">{showInvoiceModal.propertyCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>إجمالي قيمة الصفقة:</span>
                <strong className="text-slate-950">{formatEGP(showInvoiceModal.dealAmount)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-sm">
                <span>عمولة الشركة المحصلة (2.5%):</span>
                <span className="text-amber-600">{formatEGP(showInvoiceModal.companyAmount)}</span>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between text-[11px] text-slate-500">
              <div>توقيع المحاسب المالي</div>
              <div>خاتم شركة الماسة للتسويق العقاري</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInvoiceModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الإيصال</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
