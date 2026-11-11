import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Send, Building, MessageSquare, Share2, DollarSign } from 'lucide-react';
import { Property, CustomerLead } from '../types';

interface AIAssistantViewProps {
  properties: Property[];
  clients: CustomerLead[];
  isDarkMode?: boolean;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ properties, clients, isDarkMode = true }) => {
  const [activeAction, setActiveAction] = useState<
    'GENERATE_DESCRIPTION' | 'GENERATE_SOCIAL_POST' | 'GENERATE_WHATSAPP' | 'ESTIMATE_PRICE'
  >('GENERATE_DESCRIPTION');

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedProp = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeAction,
          prompt: customPrompt,
          propertyDetails: selectedProp,
          clientDetails: selectedClient,
        }),
      });

      const data = await response.json();
      if (data.result) {
        setOutputResult(data.result);
      } else {
        setOutputResult('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
      }
    } catch (err) {
      console.error(err);
      setOutputResult('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">المساعد الذكي للتسويق والمبيعات</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              صياغة الأوصاف التسويقية للوحدات ورسائل التواصل الإعلاني وتقدير الأسعار.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Tools Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveAction('GENERATE_DESCRIPTION')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            activeAction === 'GENERATE_DESCRIPTION'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Building className="w-5 h-5 mb-2 text-amber-400" />
          <div className="text-xs font-bold text-white">وصف عقاري فخم</div>
          <div className="text-[10px] text-slate-400 mt-1">توليد نص تسويقي مخصص لموقع الماسة</div>
        </button>

        <button
          onClick={() => setActiveAction('GENERATE_SOCIAL_POST')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            activeAction === 'GENERATE_SOCIAL_POST'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Share2 className="w-5 h-5 mb-2 text-blue-400" />
          <div className="text-xs font-bold text-white">إعلان Social Media</div>
          <div className="text-[10px] text-slate-400 mt-1">فيس بوك وإنستجرام بالإيموجيز والهاشتاج</div>
        </button>

        <button
          onClick={() => setActiveAction('GENERATE_WHATSAPP')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            activeAction === 'GENERATE_WHATSAPP'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-2 text-emerald-400" />
          <div className="text-xs font-bold text-white">رسالة مبيعات واتساب</div>
          <div className="text-[10px] text-slate-400 mt-1">صيغة مبيعات مقنعة وجاهزة للإرسال</div>
        </button>

        <button
          onClick={() => setActiveAction('ESTIMATE_PRICE')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            activeAction === 'ESTIMATE_PRICE'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-2 text-purple-400" />
          <div className="text-xs font-bold text-white">تقدير السعر العادل</div>
          <div className="text-[10px] text-slate-400 mt-1">تحليل السعر للمتر المربع بالمنطقة</div>
        </button>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">مدخلات الذكاء الاصطناعي</h3>

          {activeAction !== 'GENERATE_WHATSAPP' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">اختر العقار للتحليل والتوليد:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} ({p.district})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeAction === 'GENERATE_WHATSAPP' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">اختر العميل المستهدف:</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - طلب {c.preferredType} في {c.preferredDistrict}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">تعليمات إضافية للمساعد الذكي (اختياري):</label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="مثال: ركز على التشطيب الهاي لوكس، والإطلالة الساحرة..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري توليد المحتوى بواسطة الذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>بدء التوليد الذكي الآن</span>
              </>
            )}
          </button>
        </div>

        {/* Output Screen */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>النتيجة المولدة</span>
            </h3>

            {outputResult && (
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans min-h-[220px] whitespace-pre-wrap overflow-y-auto">
            {outputResult || <span className="text-slate-500">اختر نوع الأداة واضغط على (بدء التوليد الذكي) لعرض النتائج...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
