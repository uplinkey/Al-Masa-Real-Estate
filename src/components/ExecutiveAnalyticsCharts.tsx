import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Target,
  Award,
  Layers,
  Info,
} from 'lucide-react';
import { CustomerLead, CommissionRecord, MarketingCampaign, ExecutiveStats } from '../types';

interface ExecutiveAnalyticsChartsProps {
  stats: ExecutiveStats;
  clients: CustomerLead[];
  commissions?: CommissionRecord[];
  campaigns?: MarketingCampaign[];
  isDarkMode?: boolean;
  onNavigateTab?: (tab: string) => void;
}

// Monthly sales dataset spanning late 2025 to early 2026
const HISTORICAL_MONTHLY_DATA = [
  {
    monthKey: '2025-09',
    monthName: 'سبتمبر 2025',
    shortMonth: 'سبت',
    salesVolume: 38500000,
    commissionAmount: 962500,
    dealsCount: 7,
    target: 35000000,
    avgDeal: 5500000,
  },
  {
    monthKey: '2025-10',
    monthName: 'أكتوبر 2025',
    shortMonth: 'أكت',
    salesVolume: 46200000,
    commissionAmount: 1155000,
    dealsCount: 9,
    target: 40000000,
    avgDeal: 5133000,
  },
  {
    monthKey: '2025-11',
    monthName: 'نوفمبر 2025',
    shortMonth: 'نوف',
    salesVolume: 53800000,
    commissionAmount: 1345000,
    dealsCount: 11,
    target: 45000000,
    avgDeal: 4890000,
  },
  {
    monthKey: '2025-12',
    monthName: 'ديسمبر 2025',
    shortMonth: 'ديس',
    salesVolume: 67400000,
    commissionAmount: 1685000,
    dealsCount: 14,
    target: 50000000,
    avgDeal: 4814000,
  },
  {
    monthKey: '2026-01',
    monthName: 'يناير 2026',
    shortMonth: 'يناير',
    salesVolume: 74200000,
    commissionAmount: 1855000,
    dealsCount: 15,
    target: 60000000,
    avgDeal: 4946000,
  },
  {
    monthKey: '2026-02',
    monthName: 'فبراير 2026 (الحالي)',
    shortMonth: 'فبراير',
    salesVolume: 87500000,
    commissionAmount: 2187500,
    dealsCount: 18,
    target: 70000000,
    avgDeal: 4861000,
  },
  {
    monthKey: '2026-03',
    monthName: 'مارس 2026 (مستهدف)',
    shortMonth: 'مارس',
    salesVolume: 98000000,
    commissionAmount: 2450000,
    dealsCount: 22,
    target: 80000000,
    avgDeal: 4454000,
  },
];

// Sources base intelligence data
const BASE_SOURCE_METRICS = [
  {
    id: 'referral',
    name: 'توصيات العملاء والمعارف',
    shortName: 'توصيات عملاء',
    color: '#F59E0B', // Gold / Amber
    dealsCount: 9,
    salesVolume: 34500000,
    commissionGross: 862500,
    adSpend: 15000, // Minimal token appreciation / gifts
    netProfit: 847500,
    roiPct: 5650,
    conversionRate: 28.5,
    badge: 'الأعلى ربحية (98.2% هامش)',
    insight: 'أعلى معدل تحويل وأقل تكلفة استحواذ، تمثل جوهر الثقة بمجموعة الماسة.',
  },
  {
    id: 'google',
    name: 'إعلانات جوجل ومحركات البحث (SEO)',
    shortName: 'إعلانات جوجل',
    color: '#10B981', // Emerald
    dealsCount: 6,
    salesVolume: 27800000,
    commissionGross: 695000,
    adSpend: 62000,
    netProfit: 633000,
    roiPct: 1020,
    conversionRate: 14.8,
    badge: 'أعلى نية شراء فورية',
    insight: 'عملاء يبحثون عن شقق وفيلات محددة كاش في التجمع والشيخ زايد.',
  },
  {
    id: 'facebook',
    name: 'حملات فيسبوك وليدز الماسة',
    shortName: 'فيسبوك',
    color: '#3B82F6', // Blue
    dealsCount: 7,
    salesVolume: 22600000,
    commissionGross: 565000,
    adSpend: 75000,
    netProfit: 490000,
    roiPct: 653,
    conversionRate: 8.9,
    badge: 'أعلى حجم تدفق للعملاء',
    insight: 'أكبر مصدر لتوليد العملاء المحتملين في مختلف المناطق السكنية والتجارية.',
  },
  {
    id: 'instagram',
    name: 'إنستجرام والمحتوى البصري الفاخر',
    shortName: 'إنستجرام',
    color: '#8B5CF6', // Purple
    dealsCount: 5,
    salesVolume: 19400000,
    commissionGross: 485000,
    adSpend: 54000,
    netProfit: 431000,
    roiPct: 798,
    conversionRate: 11.2,
    badge: 'العقارات الفاخرة والقصور',
    insight: 'استقطاب صفوة المشترين للوحدات المتميزة والساحل الشمالي.',
  },
  {
    id: 'direct_web',
    name: 'الموقع الإلكتروني والبوابة المباشرة',
    shortName: 'الموقع المباشر',
    color: '#06B6D4', // Cyan
    dealsCount: 4,
    salesVolume: 13500000,
    commissionGross: 337500,
    adSpend: 9000,
    netProfit: 328500,
    roiPct: 3650,
    conversionRate: 18.2,
    badge: 'استحواذ عضوي مستدام',
    insight: 'زوار الموقع الذين قاموا بحجز معاينة ذاتية عبر رمز QR والكتالوج.',
  },
  {
    id: 'expos',
    name: 'المعارض العقارية والمؤتمرات',
    shortName: 'المعارض العقارية',
    color: '#EC4899', // Pink
    dealsCount: 2,
    salesVolume: 10200000,
    commissionGross: 255000,
    adSpend: 48000,
    netProfit: 207000,
    roiPct: 431,
    conversionRate: 9.4,
    badge: 'صفقات استثمارية كبرى',
    insight: 'مبيعات الأراضي والمقار الإدارية الكبرى خلال سيتي سكيب والمعارض.',
  },
];

export const ExecutiveAnalyticsCharts: React.FC<ExecutiveAnalyticsChartsProps> = ({
  stats,
  clients,
  commissions = [],
  campaigns = [],
  isDarkMode = true,
  onNavigateTab,
}) => {
  // Chart 1 State: Sales Growth Evolution
  const [salesTimeframe, setSalesTimeframe] = useState<'6m' | 'q1' | 'full'>('6m');
  const [salesMetric, setSalesMetric] = useState<'salesVolume' | 'commissionAmount' | 'dealsCount'>('salesVolume');

  // Chart 2 State: Profitable Sources
  const [sourceChartType, setSourceChartType] = useState<'bar' | 'donut' | 'table'>('bar');
  const [sourceMetric, setSourceMetric] = useState<'netProfit' | 'salesVolume' | 'roiPct'>('netProfit');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('referral');

  // Format numbers nicely with Egyptian context
  const formatMln = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M ج.م`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K ج.م`;
    }
    return `${val} ج.م`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(val || 0) + ' ج.م';
  };

  // Filtered monthly data based on timeframe
  const filteredSalesData = useMemo(() => {
    if (salesTimeframe === '6m') {
      return HISTORICAL_MONTHLY_DATA.slice(1, 7); // Oct 2025 to Mar 2026
    }
    if (salesTimeframe === 'q1') {
      return HISTORICAL_MONTHLY_DATA.slice(4, 7); // Jan, Feb, Mar 2026
    }
    return HISTORICAL_MONTHLY_DATA; // Full historical view
  }, [salesTimeframe]);

  // Aggregate source metrics blended with live clients count if available
  const sourcesData = useMemo(() => {
    return BASE_SOURCE_METRICS.map((src) => {
      // Find matching leads count from live clients state
      const matchingClients = clients.filter((c) => {
        if (src.id === 'referral') return c.leadSource === 'توصية';
        if (src.id === 'google') return c.leadSource === 'جوجل';
        if (src.id === 'facebook') return c.leadSource === 'فيس بوك';
        if (src.id === 'instagram') return c.leadSource === 'إنستجرام';
        if (src.id === 'direct_web') return c.leadSource === 'الموقع الإلكتروني' || c.leadSource === 'مباشر';
        return false;
      });

      const clientBonusDeals = matchingClients.filter((c) => c.leadStatus === 'حجز' || c.leadStatus === 'مباع').length;

      return {
        ...src,
        liveLeadsCount: matchingClients.length || Math.floor(src.dealsCount * 4.2),
        dealsCount: src.dealsCount + clientBonusDeals,
      };
    });
  }, [clients]);

  // Selected source data for card highlight
  const activeSource = useMemo(() => {
    return sourcesData.find((s) => s.id === selectedSourceId) || sourcesData[0];
  }, [sourcesData, selectedSourceId]);

  // Total net profits across all sources
  const totalNetProfit = useMemo(() => {
    return sourcesData.reduce((acc, curr) => acc + curr.netProfit, 0);
  }, [sourcesData]);

  // Total sales across all sources
  const totalSourcesSales = useMemo(() => {
    return sourcesData.reduce((acc, curr) => acc + curr.salesVolume, 0);
  }, [sourcesData]);

  // Active sales metrics labels
  const metricConfig = {
    salesVolume: {
      label: 'إجمالي حجم المبيعات',
      unit: 'ج.م',
      color: '#EAB308', // Gold
      gradientId: 'goldSalesGradient',
      strokeColor: '#F59E0B',
    },
    commissionAmount: {
      label: 'عمولة الشركة المحصلة',
      unit: 'ج.م',
      color: '#10B981', // Emerald
      gradientId: 'emeraldCommissionGradient',
      strokeColor: '#059669',
    },
    dealsCount: {
      label: 'عدد الصفقات المبرمة',
      unit: 'صفقة',
      color: '#3B82F6', // Blue
      gradientId: 'blueDealsGradient',
      strokeColor: '#2563EB',
    },
  }[salesMetric];

  return (
    <div className="space-y-6">
      {/* Section Header with Executive Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-amber-500 shadow-xs border border-gold/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              التحليلات البيانية التفاعلية (Interactive Executive Analytics)
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              مؤشرات تطور المبيعات والعمولات الشهرية وتحليل مصادر العملاء الأكثر ربحية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            بيانات Recharts حية
          </span>
        </div>
      </div>

      {/* Main Dual Grid: Chart 1 (Sales Evolution) & Chart 2 (Profitable Sources) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* =========================================================================
            CHART 1: Monthly Sales & Commission Evolution (AreaChart) - 7 Columns
           ========================================================================= */}
        <div className="xl:col-span-7 glass p-5 rounded-2xl flex flex-col justify-between border border-slate-700/40 relative overflow-hidden">
          
          {/* Card Top: Title & Metric Controls */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    تطور المبيعات والعمولات الشهرية
                  </h3>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  منحنى الأداء المالي التراكمي ومقارنة المبيعات بالهدف البيعي (Target)
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 bg-slate-800/40 dark:bg-slate-900 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                <button
                  onClick={() => setSalesTimeframe('6m')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    salesTimeframe === '6m'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  آخر 6 شهور
                </button>
                <button
                  onClick={() => setSalesTimeframe('q1')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    salesTimeframe === 'q1'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الربع الأول 2026
                </button>
                <button
                  onClick={() => setSalesTimeframe('full')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    salesTimeframe === 'full'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  سنة كاملة
                </button>
              </div>
            </div>

            {/* Metric Mode Toggle Tabs & Mini-KPI Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
              {/* Button / Indicator 1: Sales Volume */}
              <button
                onClick={() => setSalesMetric('salesVolume')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  salesMetric === 'salesVolume'
                    ? 'bg-amber-500/10 border-gold shadow-sm ring-1 ring-gold/40'
                    : isDarkMode
                    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={salesMetric === 'salesVolume' ? 'text-amber-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    إجمالي المبيعات
                  </span>
                  <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1 rounded font-bold">+28.4%</span>
                </div>
                <div className={`text-base font-black mt-1 ${salesMetric === 'salesVolume' ? 'text-amber-500' : isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  87.5M ج.م
                </div>
                <span className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  المحقق في فبراير 2026
                </span>
              </button>

              {/* Button / Indicator 2: Commissions */}
              <button
                onClick={() => setSalesMetric('commissionAmount')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  salesMetric === 'commissionAmount'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                    : isDarkMode
                    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={salesMetric === 'commissionAmount' ? 'text-emerald-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    أرباح وعمولات الشركة
                  </span>
                  <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1 rounded font-bold">2.5% صافي</span>
                </div>
                <div className={`text-base font-black mt-1 ${salesMetric === 'commissionAmount' ? 'text-emerald-500' : isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  2.18M ج.م
                </div>
                <span className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  إيراد العمولات للشهر
                </span>
              </button>

              {/* Button / Indicator 3: Deals Count */}
              <button
                onClick={() => setSalesMetric('dealsCount')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  salesMetric === 'dealsCount'
                    ? 'bg-blue-500/10 border-blue-500 shadow-sm ring-1 ring-blue-500/40'
                    : isDarkMode
                    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={salesMetric === 'dealsCount' ? 'text-blue-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    عدد الصفقات المغلقة
                  </span>
                  <span className="text-blue-500 text-[10px] bg-blue-500/10 px-1 rounded font-bold">18 صفقة</span>
                </div>
                <div className={`text-base font-black mt-1 ${salesMetric === 'dealsCount' ? 'text-blue-500' : isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  4.86M ج.م
                </div>
                <span className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  متوسط حجم الصفقة
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="w-full h-72 sm:h-80 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredSalesData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  {/* Gold Gradient for Sales Volume */}
                  <linearGradient id="goldSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Emerald Gradient for Commissions */}
                  <linearGradient id="emeraldCommissionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Blue Gradient for Deals Count */}
                  <linearGradient id="blueDealsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                  opacity={0.6}
                  vertical={false}
                />

                <XAxis
                  dataKey="shortMonth"
                  stroke={isDarkMode ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDarkMode ? '#475569' : '#CBD5E1' }}
                />

                <YAxis
                  stroke={isDarkMode ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                  tickFormatter={(val) => {
                    if (salesMetric === 'dealsCount') return `${val}`;
                    return formatMln(val);
                  }}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          className={`p-3.5 rounded-xl border shadow-xl text-right backdrop-blur-md ${
                            isDarkMode
                              ? 'bg-slate-900/95 border-slate-700 text-white'
                              : 'bg-white/95 border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-slate-700/30 pb-2 mb-2">
                            <span className="font-black text-xs accent-gold">{data.monthName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                              {data.dealsCount} صفقات ناجحة
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                                إجمالي المبيعات:
                              </span>
                              <strong className="text-amber-500 font-mono">
                                {formatCurrency(data.salesVolume)}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                                عمولة شركة الماسة:
                              </span>
                              <strong className="text-emerald-500 font-mono">
                                {formatCurrency(data.commissionAmount)}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700/20 text-[11px]">
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                                متوسط قيمة الصفقة:
                              </span>
                              <span className="font-semibold text-blue-400 font-mono">
                                {formatCurrency(data.avgDeal)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4 text-[10px]">
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                                المستهدف الشهري (Target):
                              </span>
                              <span className="font-mono text-slate-400">
                                {formatCurrency(data.target)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Target Line for Executive Reference */}
                {salesMetric === 'salesVolume' && (
                  <ReferenceLine
                    y={70000000}
                    label={{
                      value: 'الهدف التقديري (70M)',
                      position: 'top',
                      fill: isDarkMode ? '#94A3B8' : '#64748B',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    opacity={0.8}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey={salesMetric}
                  stroke={metricConfig.strokeColor}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#${metricConfig.gradientId})`}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: metricConfig.strokeColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Highlights */}
          <div className="mt-3 pt-3 border-t border-slate-700/20 flex flex-wrap items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                تجاوز مستهدف الربع الأول بنسبة <strong>+25%</strong> نتيجة الإغلاقات السريعة بالتجمع والشيخ زايد.
              </span>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('accounting')}
              className="text-[10px] font-bold accent-gold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>تفاصيل الدفتر المالي</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            CHART 2: Most Profitable Lead & Client Sources (Bar / Donut) - 5 Columns
           ========================================================================= */}
        <div className="xl:col-span-5 glass p-5 rounded-2xl flex flex-col justify-between border border-slate-700/40 relative">
          
          {/* Card Top: Title & Controls */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    مصادر العملاء الأكثر ربحية
                  </h3>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  مقارنة صافي الأرباح، حجم المبيعات، ومعدل العائد (ROI)
                </p>
              </div>

              {/* View Type Toggle (Bar vs Donut vs Table) */}
              <div className="flex items-center gap-1 bg-slate-800/40 dark:bg-slate-900 p-1 rounded-xl border border-slate-700/60">
                <button
                  title="مخطط شريطي"
                  onClick={() => setSourceChartType('bar')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    sourceChartType === 'bar'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  title="مخطط دائري"
                  onClick={() => setSourceChartType('donut')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    sourceChartType === 'donut'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  title="قائمة تفصيلية"
                  onClick={() => setSourceChartType('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    sourceChartType === 'table'
                      ? 'bg-gold text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metric Mode Filter */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setSourceMetric('netProfit')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMetric === 'netProfit'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : isDarkMode
                    ? 'bg-slate-800/60 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                صافي الربح والعمولة (ج.م)
              </button>
              <button
                onClick={() => setSourceMetric('salesVolume')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMetric === 'salesVolume'
                    ? 'bg-gold text-slate-950 border-gold shadow-xs'
                    : isDarkMode
                    ? 'bg-slate-800/60 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                حجم المبيعات
              </button>
              <button
                onClick={() => setSourceMetric('roiPct')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMetric === 'roiPct'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isDarkMode
                    ? 'bg-slate-800/60 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                العائد على الإنفاق (ROI)
              </button>
            </div>
          </div>

          {/* Interactive Visual Canvas */}
          <div className="w-full h-56 sm:h-64 my-1">
            {sourceChartType === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourcesData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                    opacity={0.5}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke={isDarkMode ? '#94A3B8' : '#64748B'}
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (sourceMetric === 'roiPct') return `${val}%`;
                      return formatMln(val);
                    }}
                  />
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    stroke={isDarkMode ? '#CBD5E1' : '#334155'}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={85}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className={`p-3 rounded-xl border shadow-xl text-right backdrop-blur-md ${
                              isDarkMode
                                ? 'bg-slate-900/95 border-slate-700 text-white'
                                : 'bg-white/95 border-slate-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-700/30">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              <strong className="text-xs">{data.name}</strong>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-3">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>صافي الربح:</span>
                                <strong className="text-emerald-500 font-mono">{formatCurrency(data.netProfit)}</strong>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>حجم المبيعات:</span>
                                <span className="font-mono text-amber-500">{formatCurrency(data.salesVolume)}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[11px]">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>تكلفة الإعلانات:</span>
                                <span className="font-mono text-rose-400">{formatCurrency(data.adSpend)}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[11px]">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>معدل ROI:</span>
                                <span className="font-bold text-blue-400">%{data.roiPct}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[10px] pt-1 border-t border-slate-700/20">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>الصفقات المغلقة:</span>
                                <span>{data.dealsCount} صفقات</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={sourceMetric}
                    radius={[0, 6, 6, 0]}
                    onClick={(entry: any) => {
                      if (entry?.id) setSelectedSourceId(entry.id);
                    }}
                    cursor="pointer"
                  >
                    {sourcesData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.id === selectedSourceId ? '#F59E0B' : entry.color}
                        opacity={selectedSourceId && selectedSourceId !== entry.id ? 0.7 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {sourceChartType === 'donut' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcesData}
                      dataKey={sourceMetric}
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      onClick={(entry: any) => {
                        if (entry?.id) setSelectedSourceId(entry.id);
                      }}
                      cursor="pointer"
                    >
                      {sourcesData.map((entry) => (
                        <Cell
                          key={`pie-cell-${entry.id}`}
                          fill={entry.color}
                          stroke={isDarkMode ? '#0F172A' : '#FFFFFF'}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = ((data.netProfit / totalNetProfit) * 100).toFixed(1);
                          return (
                            <div
                              className={`p-2.5 rounded-xl border shadow-xl text-right backdrop-blur-md text-xs ${
                                isDarkMode
                                  ? 'bg-slate-900/95 border-slate-700 text-white'
                                  : 'bg-white/95 border-slate-200 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                <span>{data.name}</span>
                              </div>
                              <p className="text-emerald-500 font-mono font-bold">
                                {formatCurrency(data.netProfit)} ({pct}%)
                              </p>
                              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {data.dealsCount} صفقات مبرمة
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    إجمالي الأرباح
                  </span>
                  <span className="text-xs font-black text-emerald-500">
                    {formatMln(totalNetProfit)}
                  </span>
                </div>
              </div>
            )}

            {sourceChartType === 'table' && (
              <div className="h-full overflow-y-auto space-y-1.5 pr-1">
                {sourcesData.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSourceId(s.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      s.id === selectedSourceId
                        ? 'border-gold bg-gold/10'
                        : isDarkMode
                        ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <div className="truncate">
                        <p className={`font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {s.shortName}
                        </p>
                        <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {s.dealsCount} صفقات • تحويل {s.conversionRate}%
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-500 font-mono">
                        {formatCurrency(s.netProfit)}
                      </p>
                      <p className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        عائد ROI: %{s.roiPct}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Detail Highlight Card for Selected Source */}
          <div className={`mt-2 p-3 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-800/70 border-slate-700/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeSource.color }} />
                <strong className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeSource.name}
                </strong>
              </div>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {activeSource.badge}
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              💡 <strong>رؤية الإدارة:</strong> {activeSource.insight}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-700/20 text-center">
              <div>
                <span className={`block text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>صافي الأرباح</span>
                <span className="text-xs font-black text-emerald-500 font-mono">{formatMln(activeSource.netProfit)}</span>
              </div>
              <div>
                <span className={`block text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>تكلفة الإعلانات</span>
                <span className="text-xs font-black text-rose-400 font-mono">{formatCurrency(activeSource.adSpend)}</span>
              </div>
              <div>
                <span className={`block text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>معدل التحويل</span>
                <span className="text-xs font-black text-blue-400">%{activeSource.conversionRate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
