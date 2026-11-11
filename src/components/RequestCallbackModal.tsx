import React, { useState } from 'react';
import { X, Phone, Clock, User, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface RequestCallbackModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; preferredTime: string; notes?: string }) => void;
  initialPropertyCode?: string;
}

export const RequestCallbackModal: React.FC<RequestCallbackModalProps> = ({
  onClose,
  onSubmit,
  initialPropertyCode,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('مساءً (05:00 - 09:00 م)');
  const [notes, setNotes] = useState(
    initialPropertyCode ? `بخصوص الاستفسار عن كود العقار: ${initialPropertyCode}` : ''
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onSubmit({
      name,
      phone,
      preferredTime,
      notes,
    });

    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">طلب اتصال هاتفي فوري</h3>
              <p className="text-[11px] text-slate-400">سيتواصل معك أحد مستشاري الماسة العقاريين</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">تم استلام طلب اتصالك بنجاح!</h4>
            <p className="text-xs text-slate-300">
              شكراً لك أ. {name}. سيقوم مستشارنا العقاري بالاتصال بك على الرقم ({phone}) في التوقيت المفضل ({preferredTime}).
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 cursor-pointer"
              >
                حسناً، إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">الاسم الكريم *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أحمد السيد"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم الهاتف الجوال *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">الوقت الأنسب لمحادثتكم *</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="صباحاً (10:00 ص - 01:00 م)">صباحاً (10:00 ص - 01:00 م)</option>
                <option value="ظهراً (01:00 م - 05:00 م)">ظهراً (01:00 م - 05:00 م)</option>
                <option value="مساءً (05:00 - 09:00 م)">مساءً (05:00 - 09:00 م)</option>
                <option value="في أي وقت متاح">في أي وقت متاح</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">استفسارك أو اهتماماتك (اختياري)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: أبحث عن شقة 3 غرف في التجمع الخامس بمقدم 15%..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>خصوصيتك مضمونة - لن يتم مشاركة بياناتك مع أي طرف ثالث.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>إرسال طلب الاتصال</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
