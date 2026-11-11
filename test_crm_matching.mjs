// Comprehensive Integration Test Suite for CRM 360 & Smart Matching Engine
import http from 'http';

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'ADMIN',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('   اختبارات التحقق الشاملة لنظام CRM ومحرك المطابقة الذكي (14 سيناريو)  ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ✓ ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const testPhone = `010${timestamp.toString().slice(-8)}`;

    // 1. New Client Creation & Search Request
    console.log('1. اختبار تسجيل عميل جديد وإنشاء أول طلب بحث:');
    const clientRes = await request('POST', '/api/clients', {
      name: `العميل التجريبي ${timestamp}`,
      phone: testPhone,
      whatsapp: testPhone,
      lead_source: 'إعلان فيسبوك',
      original_source: 'إعلان فيسبوك',
      assigned_agent_id: 'ag-2',
      assigned_agent_name: 'أحمد مراد (مدير المبيعات)',
      assigned_marketer_name: 'محمد رضوان (مسوق رقمي)',
      preferred_city: 'القاهرة الجديدة',
      preferred_district: 'التجمع الخامس',
      preferred_type: 'شقة',
      budget_min: 3000000,
      budget_max: 6000000,
    });
    assert(clientRes.status === 201 && clientRes.data.id, 'تم إنشاء العميل وحفظه في SQLite بنجاح');
    const testClientId = clientRes.data.id;

    // Create search request
    const reqRes = await request('POST', '/api/client-search-requests', {
      client_id: testClientId,
      request_title: 'شقة سكنية بالتجمع الخامس للأسرة',
      property_type: 'شقة',
      purpose: 'بيع',
      usage_type: 'سكني',
      min_budget: 3500000,
      max_budget: 6500000,
      budget_flexibility: '10%',
      payment_method: 'كاش',
      preferred_city: 'القاهرة الجديدة',
      preferred_district: 'التجمع الخامس',
      alternative_districts: ['المستقبل', 'الشروق'],
      geographic_scope: 'نفس الحي مع إمكانية الأحياء المجاورة',
      min_area_sqm: 130,
      max_area_sqm: 220,
      min_bedrooms: 3,
      min_bathrooms: 2,
      finishing_level: 'تشطيب كامل',
      urgency_level: 'عاجل (خلال أسبوعين)',
      priority: 'عالية',
      created_by_id: 'usr-1',
      created_by_name: 'أحمد مراد',
    });
    const score = reqRes.data.completenessScore !== undefined ? reqRes.data.completenessScore : reqRes.data.completeness_score;
    assert(reqRes.status === 201 && score >= 70, `تم إنشاء طلب البحث واحتساب درجة الاكتمال: ${score}%`);
    const testRequestId1 = reqRes.data.id;

    // 2. Multiple Search Requests for Same Client
    console.log('\n2. اختبار إنشاء أكثر من طلب بحث مختلف لنفس العميل (شراء شقة + إيجار محل تجاري):');
    const reqRes2 = await request('POST', '/api/client-search-requests', {
      client_id: testClientId,
      request_title: 'محل تجاري للإيجار للاستثمار',
      property_type: 'محل تجاري',
      purpose: 'إيجار',
      usage_type: 'تجاري',
      min_budget: 25000,
      max_budget: 70000,
      budget_flexibility: 'لا توجد مرونة (صارمة)',
      payment_method: 'كاش',
      preferred_city: 'القاهرة الجديدة',
      preferred_district: 'التجمع الخامس',
      min_area_sqm: 40,
      max_area_sqm: 100,
      urgency_level: 'خلال شهر',
      priority: 'متوسطة',
      created_by_id: 'usr-1',
      created_by_name: 'أحمد مراد',
    });
    assert(reqRes2.status === 201 && reqRes2.data.id, 'تم بنجاح حفظ طلب البحث الثاني لنفس العميل دون تضارب');

    // 3. Property Recommendations & Algorithmic Scoring
    console.log('\n3. اختبار تشغيل محرك المطابقة والحصول على درجات التطابق وأسباب التوافق:');
    const matchesRes = await request('GET', `/api/client-search-requests/${testRequestId1}/matches`);
    assert(matchesRes.status === 200 && Array.isArray(matchesRes.data), 'تم تشغيل محرك المطابقة بنجاح');
    if (matchesRes.data.length > 0) {
      const topMatch = matchesRes.data[0];
      assert(
        topMatch.match_score > 0 && Array.isArray(topMatch.match_reasons),
        `العقار المرشح الأول: "${topMatch.property.title}" بنسبة توافق ${topMatch.match_score}% مع أسباب: ${topMatch.match_reasons.join(' | ')}`
      );
    } else {
      console.log('  [INFO] لا توجد عقارات مطابقة في قاعدة البيانات الحالية');
    }

    // 4. Changing Budget & Dynamic Re-matching (Diff verification)
    console.log('\n4. اختبار تعديل ميزانية طلب البحث واكتشاف الوحدات الجديدة والمستبعدة وتوثيق السجل:');
    const updateBudgetRes = await request('PUT', `/api/client-search-requests/${testRequestId1}`, {
      min_budget: 2000000,
      max_budget: 8500000,
      change_reason: 'قام العميل بزيادة ميزانيته بعد بيع أصل قديم',
      modified_by_id: 'usr-1',
      modified_by_name: 'أحمد مراد',
    });
    assert(
      updateBudgetRes.status === 200 && (updateBudgetRes.data.newlyAppearedUnits !== undefined || updateBudgetRes.data.matches !== undefined),
      `تم تحديث الميزانية وتوليد تقرير الفوارق (وحدات جديدة: ${updateBudgetRes.data.newMatchesCount || 0}، مستبعدة: ${updateBudgetRes.data.removedMatchesCount || 0})`
    );

    // 5. Changing District & Re-matching
    console.log('\n5. اختبار تعديل منطقة البحث وتأكيد تحديث المطابقة:');
    const updateDistrictRes = await request('PUT', `/api/client-search-requests/${testRequestId1}`, {
      preferred_city: 'القاهرة الجديدة',
      preferred_district: 'بيت الوطن',
      change_reason: 'تفضيل منطقة بيت الوطن لقربها من طريق السويس',
      modified_by_id: 'usr-1',
      modified_by_name: 'أحمد مراد',
    });
    assert(updateDistrictRes.status === 200, 'تم تحديث منطقة البحث وحفظ سبب التعديل بنجاح');

    // 6. Adding a New Unit & Reverse Matching
    console.log('\n6. اختبار إضافة وحدة عقارية وفحص العملاء المطابقين لها (المطابقة العكسية):');
    const propCode = `TEST-${timestamp.toString().slice(-5)}`;
    const propRes = await request('POST', '/api/properties', {
      code: propCode,
      title: `شقة فاخرة للاختبار ${timestamp}`,
      type: 'شقة',
      purpose: 'بيع',
      status: 'متاح',
      availability_status: 'متاحة ومؤكدة',
      city: 'القاهرة الجديدة',
      district: 'بيت الوطن',
      address: 'الحي الثاني بيت الوطن',
      price: 5200000,
      area_sq_m: 175,
      bedrooms: 3,
      bathrooms: 2,
      finishing: 'تشطيب كامل',
      images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    });
    assert(propRes.status === 201 && propRes.data.id, 'تم إنشاء العقار التجريبي في قاعدة البيانات');
    const testPropertyId = propRes.data.id;

    const reverseMatchRes = await request('GET', `/api/properties/${testPropertyId}/matched-clients`);
    assert(
      reverseMatchRes.status === 200 && Array.isArray(reverseMatchRes.data),
      `تم استرجاع ${reverseMatchRes.data.length} عملاء مطابقين للوحدة الجديدة بنجاح`
    );

    // 7. Price Modification & New Clients Discovery
    console.log('\n7. اختبار تخفيض سعر العقار واكتشاف عملاء جدد:');
    const updatePropPriceRes = await request('PUT', `/api/properties/${testPropertyId}`, {
      price: 4500000,
      edit_reason: 'تخفيض السعر لسرعة البيع بطلب المالك',
    });
    assert(updatePropPriceRes.status === 200, 'تم تخفيض السعر بنجاح');
    const reverseMatch2 = await request('GET', `/api/properties/${testPropertyId}/matched-clients`);
    assert(reverseMatch2.status === 200, `تمت المطابقة العكسية بعد تعديل السعر واكتشاف ${reverseMatch2.data.length} عميل`);

    // 8. Exclusion of Sold/Rented/Suspended Units
    console.log('\n8. اختبار استبعاد الوحدات المباعة أو المؤجرة أو المعلقة تلقائياً من الترشيحات:');
    await request('PUT', `/api/properties/${testPropertyId}`, {
      status: 'تم البيع',
      availability_status: 'تم البيع',
    });
    const reverseMatchSold = await request('GET', `/api/properties/${testPropertyId}/matched-clients`);
    assert(
      reverseMatchSold.status === 200 && reverseMatchSold.data.length === 0,
      'تم التأكد من أن الوحدة المباعة لا تظهر لأي عميل (استبعاد كامل للوحدات غير المتاحة)'
    );

    // Re-activate property for remaining proposal/viewing tests
    await request('PUT', `/api/properties/${testPropertyId}`, {
      status: 'متاح',
      availability_status: 'متاحة ومؤكدة',
    });

    // 9. Batch Proposal Creation & Managerial Approval Flow
    console.log('\n9. اختبار اعتماد واقتراح الوحدات للعملاء دفعة واحدة:');
    const batchRes = await request('POST', '/api/client-proposals/batch-approve', {
      proposals: [
        {
          client_id: testClientId,
          property_id: testPropertyId,
          search_request_id: testRequestId1,
          proposed_by_id: 'usr-1',
          proposed_by_name: 'أحمد مراد',
          share_channel: 'واتساب',
          offered_price: 4500000,
          internal_notes: 'اقتراح معتمد من الإدارة',
        },
      ],
      approved_by_id: 'usr-1',
      approved_by_name: 'أحمد مراد (مدير)',
    });
    assert(batchRes.status === 200 && batchRes.data.created_count >= 1, `تم إنشاء واعتماد ${batchRes.data.created_count} مقترح بنجاح`);

    // 10. Recording Proposal Sharing & Updating Reaction
    console.log('\n10. اختبار توثيق إرسال العرض وتحديث رد العميل (مهتم / طلب معاينة):');
    const proposalsList = await request('GET', `/api/client-proposals?clientId=${testClientId}`);
    assert(proposalsList.status === 200 && proposalsList.data.length > 0, 'تم استرجاع سجل العروض للعميل');
    const firstProposalId = proposalsList.data[0].id;

    const reactionRes = await request('PUT', `/api/client-proposals/${firstProposalId}/reaction`, {
      reaction: 'طلب معاينة',
      feedback: 'العميل معجب بموقع الوحدة ويطلب معاينة يوم الجمعة',
    });
    assert(reactionRes.status === 200 && reactionRes.data.success, 'تم توثيق رد العميل في قاعدة البيانات بنجاح');

    // 11. Scheduling Viewing & Schedule Conflict Prevention
    console.log('\n11. اختبار جدولة معاينة ميدانية ومنع تعارض المواعيد لنفس المسوق:');
    const viewingDate = '2026-11-20';
    const viewingTime = '15:00';
    const agentId = 'ag-2';

    const v1Res = await request('POST', '/api/viewings', {
      property_id: testPropertyId,
      client_id: testClientId,
      viewing_date: viewingDate,
      viewing_time: viewingTime,
      agent_id: agentId,
      agent_name: 'أحمد مراد',
      status: 'مجدولة',
      duration_minutes: 60,
      meeting_point: 'أمام مقر الوحدة - الحي الثاني بيت الوطن',
    });
    assert(v1Res.status === 201 && v1Res.data.id, 'تم حجز المعاينة الأولى بنجاح');

    // Attempt second booking for SAME agent at SAME date & time (MUST FAIL with 409/400)
    const vConflictRes = await request('POST', '/api/viewings', {
      property_id: testPropertyId,
      client_id: testClientId,
      viewing_date: viewingDate,
      viewing_time: viewingTime,
      agent_id: agentId,
      agent_name: 'أحمد مراد',
      status: 'مجدولة',
      duration_minutes: 60,
    });
    assert(
      vConflictRes.status === 409 || vConflictRes.status === 400,
      `تم رصد التعارض الزمني بنجاح ورفض الحجز المتضارب برمز ${vConflictRes.status}: "${vConflictRes.data?.error || ''}"`
    );

    // 12. Linking Viewing to Client Source & Marketer Attribution
    console.log('\n12. اختبار ربط المعاينة تلقائياً بمصدر العميل والمسوق لحساب العمولات:');
    assert(
      v1Res.data.client_source === 'إعلان فيسبوك' && v1Res.data.assigned_marketer_name === 'محمد رضوان (مسوق رقمي)',
      `المعاينة موثقة بمصدر: "${v1Res.data.client_source}" والمسوق: "${v1Res.data.assigned_marketer_name}"`
    );

    // 13. Prevention of Duplicate Proposals
    console.log('\n13. اختبار منع تكرار اقتراح نفس العقار غير الضروري لنفس العميل والطلب:');
    const duplicateProposalRes = await request('POST', '/api/client-proposals', {
      client_id: testClientId,
      property_id: testPropertyId,
      search_request_id: testRequestId1,
      proposed_by_id: 'usr-1',
      proposed_by_name: 'أحمد مراد',
      share_channel: 'واتساب',
      offered_price: 4500000,
    });
    assert(
      duplicateProposalRes.status === 409 || duplicateProposalRes.status === 400,
      `تم رصد التكرار ومنع الاقتراح المكرر برمز ${duplicateProposalRes.status}: "${duplicateProposalRes.data?.error || ''}"`
    );

    // 14. Lead Source Protection & Dispute Arbitration Workflow
    console.log('\n14. اختبار حماية مصدر العميل وقفل التعديل غير المصرح وتدفق التحكيم الإداري:');
    // Lock source
    await request('PUT', `/api/clients/${testClientId}`, { source_locked: 1 });

    // Unauthorized attempt by standard employee
    const unauthorizedEdit = await request(
      'PUT',
      `/api/clients/${testClientId}`,
      { lead_source: 'توصية شخصية' },
      { 'X-User-Role': 'AGENT' }
    );
    assert(
      unauthorizedEdit.status === 403 || unauthorizedEdit.status === 400,
      `تم منع تعديل المصدر المقفل للموظف العادي برمز ${unauthorizedEdit.status}: "${unauthorizedEdit.data?.error || ''}"`
    );

    // Submit source dispute
    const disputeRes = await request('POST', '/api/source-disputes', {
      client_id: testClientId,
      disputed_by_id: 'usr-2',
      disputed_by_name: 'سامح خالد (مسوق)',
      current_source: 'إعلان فيسبوك',
      claimed_source: 'إعلان تيك توك',
      evidence_type: 'استمارة إعلان ليد',
      evidence_details: 'تم استلام بيانات العميل في حملة تيك توك الساعة 14:00 ومرفق رقم الحملة',
    });
    assert(disputeRes.status === 201 && disputeRes.data.id, 'تم تقديم طلب نزاع المصدر بنجاح');
    const disputeId = disputeRes.data.id;

    // Resolve dispute by manager
    const resolveRes = await request('PUT', `/api/source-disputes/${disputeId}/resolve`, {
      arbitrated_by_id: 'usr-1',
      arbitrated_by_name: 'أحمد مراد (مدير)',
      status: 'مقبول وتم التعديل',
      arbitration_notes: 'تمت مراجعة سجلات إعلانات تيك توك والتأكد من أسبقية التسجيل بدقيقة واحدة',
    });
    assert(
      resolveRes.status === 200 && resolveRes.data.success,
      'تم تحكيم النزاع واعتماد المصدر وتعديل سجل العميل وتوثيق السجل الرقابي بنجاح'
    );

    console.log('\n========================================================================');
    console.log(`   النتيجة النهائية للاختبارات: ${passed} نجح | ${failed} فشل`);
    console.log('========================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error during test run:', error);
    process.exit(1);
  }
}

runTests();
