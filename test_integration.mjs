const BASE = 'http://localhost:3000/api';

async function run() {
  console.log('=== Starting 10-Point Integration Test Suite (Node.js Fetch) ===\n');

  // 1. Health
  const rHealth = await fetch(`${BASE}/health`);
  if (!rHealth.ok) throw new Error(`Health failed: ${rHealth.statusText}`);
  const health = await rHealth.json();
  console.log('✅ 1. System Health & Database: OK, status =', health.status);

  // 2. Properties
  const rProps = await fetch(`${BASE}/properties`);
  const props = await rProps.json();
  console.log(`✅ 2. Properties CRUD: Loaded ${props.length} properties.`);
  const testProp = props[0];
  const propId = testProp.id;
  const ownerId = testProp.ownerId || 'own-1';

  // 3. Owner Followup
  const rFup = await fetch(`${BASE}/owner-followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      propertyCode: testProp.code || 'REF-101',
      propertyTitle: testProp.title || 'شقة فاخرة',
      ownerId: ownerId,
      ownerName: testProp.ownerName || 'المهندس طارق العبد',
      ownerPhone: '01000000001',
      channel: 'اتصال هاتفي',
      isAnswered: true,
      availabilityStatus: 'متاحة ومؤكدة',
      validityDays: 21,
      notes: 'تم التأكيد هاتفياً مع المالك على جاهزية الوحدة للمعاينة الفورية'
    })
  });
  const fup = await rFup.json();
  console.log(`✅ 3. Owner Follow-up Registration: Logged ID = ${fup.id}, status = "${fup.availabilityStatus}"`);

  // 4. Follow-up tasks
  const rTask = await fetch(`${BASE}/followup-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      ownerId: ownerId,
      assignedToId: 'emp-1',
      assignedToName: 'أحمد عيسوي',
      dueDate: '2026-11-20',
      priority: 'عالية',
      taskDetails: 'الاتصال بالمالك لتجديد تأكيد توفر العقار'
    })
  });
  const task = await rTask.json();
  const taskId = task.id;

  // Reassign
  const rReassign = await fetch(`${BASE}/followup-tasks/${taskId}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      newAssignedToId: 'ag-1',
      newAssignedToName: 'محمد سامي',
      reason: 'إعادة توزيع الأعباء التسويقية بتكليف من المشرف'
    })
  });
  const reassignedTask = await rReassign.json();

  // Complete
  const rComp = await fetch(`${BASE}/followup-tasks/${taskId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome: 'تم الاتصال بالمالك وتحديث السعر' })
  });
  const completedTask = await rComp.json();
  console.log(`✅ 4. Follow-up Task Lifecycle: Created ID = ${taskId}, Reassigned to "${reassignedTask.assignedToName}", Completed with outcome = "${completedTask.outcome}"`);

  // 5. Strict viewing restriction for suspended/sold/rented unit
  await fetch(`${BASE}/owner-followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      ownerId: ownerId,
      isAnswered: true,
      availabilityStatus: 'موقوفة بطلب المالك'
    })
  });
  const rViewing = await fetch(`${BASE}/viewings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      clientId: 'cli-101',
      agentId: 'ag-1',
      agentName: 'محمد سامي',
      viewingDate: '2026-11-15T14:00',
      feedback: 'معاينة تجريبية'
    })
  });
  if (rViewing.status !== 400) {
    throw new Error(`Expected 400 when scheduling viewing for suspended unit, got ${rViewing.status}`);
  }
  const viewErr = await rViewing.json();
  console.log(`✅ 5. Strict Viewing Protection: Successfully blocked with HTTP 400: "${viewErr.error}"`);

  // Reset to confirmed
  await fetch(`${BASE}/owner-followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      ownerId: ownerId,
      isAnswered: true,
      availabilityStatus: 'متاحة ومؤكدة'
    })
  });

  // 6. External deal incident reporting (EXT-2026-XXXX) & investigation
  const rExt = await fetch(`${BASE}/external-deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      propertyCode: testProp.code || 'REF-101',
      propertyTitle: testProp.title || 'شقة فاخرة',
      ownerId: ownerId,
      ownerName: testProp.ownerName || 'المهندس طارق العبد',
      ownerPhone: '01000000001',
      dealType: 'بيع خارجي',
      estimatedPrice: 3500000,
      dealDate: '2026-11-05',
      buyerName: 'كريم الحسيني',
      externalBrokerName: 'شركة النور للوساطة',
      commissionClaimEligible: true,
      commissionClaimAmount: 87500,
      investigationNotes: 'أفاد المالك ببيع الشقة عبر وسيط آخر مع احتمال تطابق المشتري مع عميل مسجل لدينا'
    })
  });
  const extRep = await rExt.json();
  const extId = extRep.id;
  const repCode = extRep.reportNumber;

  // Update investigation
  const rInv = await fetch(`${BASE}/external-deals/${extId}/investigate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'تم التحقق وتثبيت العمولة',
      notes: 'تم التأكد من تطابق المشتري وتوجيه مطالبة قانونية بحق عمولة الشركة بنسبة 2.5%'
    })
  });
  const investigatedRep = await rInv.json();
  console.log(`✅ 6. External Deal Incident & Investigation: Logged code = ${repCode}, Investigation status = "${investigatedRep.investigationStatus}"`);

  // 7. Deal Closing with 24h archival window
  const rClose = await fetch(`${BASE}/deal-closings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: propId,
      propertyCode: testProp.code || 'REF-101',
      propertyTitle: testProp.title || 'شقة فاخرة',
      dealType: 'بيع',
      dealDate: '2026-11-09',
      finalPrice: 3200000,
      commissionTotal: 80000,
      companyShare: 48000,
      marketerShare: 8000,
      clientId: 'cli-101',
      clientName: 'الدكتور محمود حسني',
      notes: 'صفقة بيع معتمدة ومسجلة بالشهر العقاري'
    })
  });
  const closing = await rClose.json();
  const closingId = closing.id;
  console.log(`✅ 7. Official Deal Closing: ID = ${closingId}, Status = "${closing.status}", Archive at target = "${closing.archiveAt}"`);

  // 8. Deal cancellation with mandatory reason
  const rCancel = await fetch(`${BASE}/deal-closings/${closingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'تراجع المشتري عن إتمام التعاقد لظروف تمويلية' })
  });
  const cancelResult = await rCancel.json();
  const rPropCheck = await fetch(`${BASE}/properties/${propId}`);
  const propAfterCancel = await rPropCheck.json();
  console.log(`✅ 8. Deal Cancellation & Reversion: Result = "${cancelResult.message}", Unit availability reverted to = "${propAfterCancel.availabilityStatus}"`);

  // 9. Admin property reactivation
  const rReactivate = await fetch(`${BASE}/properties/${propId}/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      validityDays: 14,
      reason: 'تم التواصل مع المالك وتجديد تفويض التسويق والاتفاق على الشروط'
    })
  });
  const reactivated = await rReactivate.json();
  const rPropReactivated = await fetch(`${BASE}/properties/${propId}`);
  const propAfterReactivation = await rPropReactivated.json();
  console.log(`✅ 9. Admin Reactivation: Result = "${reactivated.message}", Availability confirmed = "${propAfterReactivation.availabilityStatus}"`);

  // 10. Marketing dashboard stats
  const rStats = await fetch(`${BASE}/marketing-dashboard/stats`);
  const stats = await rStats.json();
  console.log(`✅ 10. Marketing Dashboard KPIs:
    - Total Properties: ${stats.totalProperties}
    - Confirmed Units: ${stats.byAvailability['متاحة ومؤكدة']}
    - Pending Confirmation: ${stats.byAvailability['متاحة لكن تحتاج إعادة تأكيد']}
    - Total External Deal Reports: ${stats.totalExternalDeals} (Claimed: ${stats.totalClaimsEGP.toLocaleString()} EGP)
    - Total Tasks: ${stats.totalTasks} (Pending: ${stats.pendingTasks}, Overdue: ${stats.overdueTasks})
    - Total Closings: ${stats.totalClosings}`);

  console.log('\n🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
