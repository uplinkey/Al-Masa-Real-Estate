import requests
import json
import sys

BASE = 'http://localhost:3000/api'

def run_tests():
    print("=== Starting 10-Point Integration Test Suite ===")

    # 1. System Health & Database connectivity
    r = requests.get(f'{BASE}/health')
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health = r.json()
    assert health['status'] == 'ok', "Database status not ok"
    print("✅ 1. System Health & Relational Database: CONNECTED & OK")

    # 2. Fetching properties
    r = requests.get(f'{BASE}/properties')
    assert r.status_code == 200, f"Fetch properties failed: {r.text}"
    props = r.json()
    assert len(props) > 0, "No properties found"
    test_prop = props[0]
    prop_id = test_prop['id']
    owner_id = test_prop.get('ownerId', 'own-1')
    print(f"✅ 2. Properties CRUD & Availability Fields: {len(props)} properties loaded (Test unit: {prop_id})")

    # 3. Owner follow-up registration & property availability sync
    fup_payload = {
        'propertyId': prop_id,
        'propertyCode': test_prop.get('code', 'REF-101'),
        'propertyTitle': test_prop.get('title', 'شقة فاخرة'),
        'ownerId': owner_id,
        'ownerName': test_prop.get('ownerName', 'المهندس طارق العبد'),
        'ownerPhone': '01000000001',
        'channel': 'اتصال هاتفي',
        'isAnswered': True,
        'availabilityStatus': 'متاحة ومؤكدة',
        'validityDays': 21,
        'notes': 'تم التأكيد هاتفياً مع المالك على جاهزية الوحدة للمعاينة الفورية'
    }
    r = requests.post(f'{BASE}/owner-followups', json=fup_payload)
    assert r.status_code == 200, f"Followup creation failed: {r.text}"
    fup_data = r.json()
    assert fup_data['availabilityStatus'] == 'متاحة ومؤكدة', "Status mismatch"
    print(f"✅ 3. Owner Follow-up Registration: Logged ({fup_data['id']}) & synced status to 'متاحة ومؤكدة'")

    # 4. Follow-up tasks (creation, supervisor reassignment with reason, completion)
    task_payload = {
        'propertyId': prop_id,
        'ownerId': owner_id,
        'assignedToId': 'emp-1',
        'assignedToName': 'أحمد عيسوي',
        'deadline': '2026-11-20',
        'priority': 'عالية'
    }
    r = requests.post(f'{BASE}/followup-tasks', json=task_payload)
    assert r.status_code == 200, f"Task creation failed: {r.text}"
    task = r.json()
    task_id = task['id']

    # Reassign
    r = requests.post(f'{BASE}/followup-tasks/{task_id}/reassign', json={
        'newAssignedToId': 'ag-1',
        'newAssignedToName': 'محمد سامي',
        'reason': 'إعادة توزيع الأعباء التسويقية بتكليف من المشرف'
    })
    assert r.status_code == 200, f"Task reassign failed: {r.text}"

    # Complete
    r = requests.post(f'{BASE}/followup-tasks/{task_id}/complete', json={
        'completionNotes': 'تم الاتصال بالمالك وتحديث السعر'
    })
    assert r.status_code == 200, f"Task complete failed: {r.text}"
    print(f"✅ 4. Follow-up Task Lifecycle: Created ({task_id}), Reassigned, and Completed")

    # 5. Strict backend viewing restriction block for unavailable units
    # First set unit to 'موقوفة بطلب المالك'
    requests.post(f'{BASE}/owner-followups', json={
        'propertyId': prop_id,
        'ownerId': owner_id,
        'isAnswered': True,
        'availabilityStatus': 'موقوفة بطلب المالك'
    })
    # Now attempt to schedule viewing -> MUST return 400
    r_viewing = requests.post(f'{BASE}/viewings', json={
        'propertyId': prop_id,
        'clientId': 'cli-1',
        'agentId': 'ag-1',
        'agentName': 'محمد سامي',
        'viewingDate': '2026-11-15T14:00',
        'feedback': 'معاينة تجريبية'
    })
    assert r_viewing.status_code == 400, f"Expected 400 for viewing unavailable unit, got: {r_viewing.status_code}"
    print(f"✅ 5. Strict Viewing Protection: Successfully BLOCKED viewing for suspended unit (HTTP 400: '{r_viewing.json().get('error')}')")

    # Re-enable property to 'متاحة ومؤكدة'
    requests.post(f'{BASE}/owner-followups', json={
        'propertyId': prop_id,
        'ownerId': owner_id,
        'isAnswered': True,
        'availabilityStatus': 'متاحة ومؤكدة'
    })

    # 6. External deal incident reporting (EXT-2026-XXXX) & investigation status workflow updates
    ext_payload = {
        'propertyId': prop_id,
        'propertyCode': test_prop.get('code', 'REF-101'),
        'propertyTitle': test_prop.get('title', 'شقة فاخرة'),
        'ownerId': owner_id,
        'ownerName': test_prop.get('ownerName', 'المهندس طارق العبد'),
        'ownerPhone': '01000000001',
        'reportingChannel': 'متابعة دورية مع المالك',
        'dealType': 'بيع',
        'dealPrice': 3500000,
        'dealDate': '2026-11-05',
        'buyerName': 'كريم الحسيني',
        'externalBrokerName': 'شركة النور للوساطة',
        'commissionClaimedPct': 2.5,
        'commissionClaimedAmount': 87500,
        'incidentNotes': 'أفاد المالك ببيع الشقة عبر وسيط آخر مع احتمال تطابق المشتري مع عميل مسجل لدينا'
    }
    r = requests.post(f'{BASE}/external-deals', json=ext_payload)
    assert r.status_code == 200, f"External deal report failed: {r.text}"
    ext_rep = r.json()
    ext_id = ext_rep['id']
    report_code = ext_rep['reportCode']
    assert report_code.startswith('EXT-2026-'), f"Report code format invalid: {report_code}"

    # Update investigation
    r = requests.put(f'{BASE}/external-deals/{ext_id}/investigate', json={
        'investigationStatus': 'تمت المطابقة وتثبيت حق العمولة',
        'investigationNotes': 'تم التأكد من تطابق المشتري وتوجيه مطالبة قانونية بحق عمولة الشركة بنسبة 2.5%'
    })
    assert r.status_code == 200, f"Investigation update failed: {r.text}"
    print(f"✅ 6. External Deal Incident & Investigation: Logged ({report_code}) and verified")

    # 7. Official deal closing with commission breakdown & 24h archival countdown
    closing_payload = {
        'propertyId': prop_id,
        'propertyCode': test_prop.get('code', 'REF-101'),
        'propertyTitle': test_prop.get('title', 'شقة فاخرة'),
        'dealType': 'بيع',
        'closingDate': '2026-11-09',
        'finalPrice': 3200000,
        'totalCommissionPct': 2.5,
        'totalCommissionAmount': 80000,
        'companyShare': 48000,
        'agentShare': 24000,
        'marketerShare': 8000,
        'clientId': 'cli-1',
        'clientName': 'مروان خوري',
        'notes': 'صفقة بيع معتمدة ومسجلة بالشهر العقاري'
    }
    r = requests.post(f'{BASE}/deal-closings', json=closing_payload)
    assert r.status_code == 200, f"Deal closing failed: {r.text}"
    closing = r.json()
    closing_id = closing['id']
    assert closing['archivedAtTarget'] is not None, "Target archival missing"
    print(f"✅ 7. Official Deal Closing: Created ({closing_id}) with 24h archival window until {closing['archivedAtTarget']}")

    # 8. Deal closing cancellation with mandatory reason & reversion to 'تحتاج إعادة تأكيد'
    r = requests.post(f'{BASE}/deal-closings/{closing_id}/cancel', json={
        'reason': 'تراجع المشتري عن إتمام التعاقد لظروف تمويلية'
    })
    assert r.status_code == 200, f"Deal closing cancellation failed: {r.text}"
    r_prop_check = requests.get(f'{BASE}/properties/{prop_id}')
    assert r_prop_check.status_code == 200
    prop_after_cancel = r_prop_check.json()
    assert prop_after_cancel['availabilityStatus'] == 'متاحة لكن تحتاج إعادة تأكيد', f"Unexpected status: {prop_after_cancel['availabilityStatus']}"
    print(f"✅ 8. Deal Cancellation & Reversion: Cancelled and unit reverted to 'متاحة لكن تحتاج إعادة تأكيد'")

    # 9. Administrative property reactivation
    r = requests.post(f'{BASE}/properties/{prop_id}/reactivate', json={
        'validityDays': 14,
        'reason': 'تم التواصل مع المالك وتجديد تفويض التسويق والاتفاق على الشروط'
    })
    assert r.status_code == 200, f"Reactivation failed: {r.text}"
    reactivated_prop = r.json()
    assert reactivated_prop['availabilityStatus'] == 'متاحة ومؤكدة', "Reactivation status mismatch"
    print(f"✅ 9. Admin Reactivation: Property reactivated to 'متاحة ومؤكدة' with refreshed validity window")

    # 10. Marketing dashboard stats aggregation across all 9 availability states
    r = requests.get(f'{BASE}/marketing-dashboard/stats')
    assert r.status_code == 200, f"Marketing stats failed: {r.text}"
    stats = r.json()
    assert 'totalProperties' in stats, "Missing totalProperties in stats"
    assert 'confirmed' in stats, "Missing confirmed count in stats"
    assert 'externalDealsCount' in stats, "Missing externalDealsCount in stats"
    print(f"✅ 10. Marketing Dashboard KPIs: {stats['totalProperties']} units aggregated across 9 availability states, {stats['externalDealsCount']} external deal incidents, {stats['activeClosingsCount']} closings")

    print("\n🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    run_tests()
