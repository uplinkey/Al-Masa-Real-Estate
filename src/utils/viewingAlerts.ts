import { PropertyViewing } from '../types';

export interface ViewingAlert {
  id: string;
  viewingId: string;
  urgency: 'critical' | 'urgent' | 'warning' | 'normal';
  badgeLabel: string;
  badgeColor: string;
  title: string;
  timeFormatted: string;
  dateFormatted: string;
  clientName: string;
  clientPhone: string;
  propertyTitle: string;
  propertyCode: string;
  locationAddress: string;
  agentName: string;
  driverName?: string;
  vehicle?: string;
  status: string;
}

/**
 * Normalizes viewing date string to YYYY-MM-DD
 */
function normalizeDateStr(dStr: string): string {
  if (!dStr) return '';
  if (dStr.includes('T')) return dStr.split('T')[0];
  return dStr.trim();
}

/**
 * Calculates approaching scheduled viewings for administration notifications
 */
export function calculateViewingAlerts(viewings: PropertyViewing[]): ViewingAlert[] {
  if (!viewings || viewings.length === 0) return [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // e.g. '2026-02-18'

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const alerts: ViewingAlert[] = [];

  for (const v of viewings) {
    // Only alert for active scheduled/confirmed/in-progress viewings
    if (v.status === 'مكتملة' || v.status === 'ملغاة') continue;

    const vDate = normalizeDateStr(v.viewingDate);
    if (!vDate) continue;

    let urgency: ViewingAlert['urgency'] = 'normal';
    let badgeLabel = 'مجدولة';
    let badgeColor = 'bg-slate-700 text-slate-200';

    if (vDate === todayStr) {
      urgency = 'critical';
      badgeLabel = '🚨 اليوم (عاجلة جداً)';
      badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse';
    } else if (vDate < todayStr && v.status === 'مجدولة') {
      urgency = 'critical';
      badgeLabel = '⚠️ متأخرة - لم تسجل النتيجة';
      badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    } else if (vDate === tomorrowStr) {
      urgency = 'urgent';
      badgeLabel = '⏳ غداً (خلال 24 ساعة)';
      badgeColor = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    } else {
      urgency = 'warning';
      badgeLabel = `موعد: ${vDate}`;
      badgeColor = 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
    }

    alerts.push({
      id: `alert-${v.id}`,
      viewingId: v.id,
      urgency,
      badgeLabel,
      badgeColor,
      title: `معاينة: ${v.propertyTitle || v.propertyCode || 'عقار'}`,
      timeFormatted: v.viewingTime || 'غير محدد',
      dateFormatted: v.viewingDate || todayStr,
      clientName: v.clientName || 'عميل غير مسجل',
      clientPhone: v.clientPhone || '',
      propertyTitle: v.propertyTitle || '',
      propertyCode: v.propertyCode || '',
      locationAddress: v.locationAddress || 'موقع العقار',
      agentName: v.agentName || 'مسئول المبيعات',
      driverName: v.driverName,
      vehicle: v.vehicle,
      status: v.status,
    });
  }

  // Sort: critical first, then urgent, then warning
  const rank: Record<string, number> = { critical: 0, urgent: 1, warning: 2, normal: 3 };
  return alerts.sort((a, b) => rank[a.urgency] - rank[b.urgency]);
}
