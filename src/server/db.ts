import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  INITIAL_PROPERTIES,
  INITIAL_OWNERS,
  INITIAL_CLIENTS,
  INITIAL_VIEWINGS,
  INITIAL_CAMPAIGNS,
  INITIAL_TASKS,
  INITIAL_COMMISSIONS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData.js';

// Ensure data, backups, and upload directories exist
const DATA_DIR = path.join(process.cwd(), 'data');
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

[DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DB_PATH = path.join(DATA_DIR, 'almasa.db');
export const db = new Database(DB_PATH);

// Enable Foreign Keys and Write-Ahead Logging for high performance & safety
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Password security helpers using Node crypto scrypt
export function hashPassword(password: string, existingSalt?: string) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const calculated = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculated, 'hex'));
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Online Database Backup using SQLite Native Backup API
 */
export async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `almasa-backup-${timestamp}.db`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  await db.backup(backupFilePath);
  const stats = fs.statSync(backupFilePath);

  return {
    fileName: backupFileName,
    filePath: backupFilePath,
    sizeBytes: stats.size,
    createdAt: new Date().toISOString(),
  };
}

export function listDatabaseBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR);
  return files
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      const p = path.join(BACKUPS_DIR, f);
      const stat = fs.statSync(p);
      return {
        fileName: f,
        sizeBytes: stat.size,
        createdAt: stat.birthtime.toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Initialize all database tables, constraints, foreign keys and indexes.
 */
export function initDatabase() {
  const schemaSql = `
    -- 0. System Users & Authentication Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_title TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      token TEXT,
      active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 0.1 Audit & Activity Log Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 0.2 Uploaded Files & Attachments Table
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      entity_id TEXT,
      uploaded_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 1. Employees / Agents Table
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_title TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      avatar TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Property Owners Table
    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phones_json TEXT NOT NULL DEFAULT '[]',
      email TEXT,
      national_id TEXT,
      address TEXT,
      bank_account TEXT,
      commission_agreement_pct REAL DEFAULT 2.5,
      notes TEXT,
      documents_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Properties Table
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      internal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'متاح',
      governorate TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT,
      map_lat REAL DEFAULT 30.0275,
      map_lng REAL DEFAULT 31.4721,
      price REAL NOT NULL,
      negotiable INTEGER DEFAULT 1,
      min_price REAL,
      commission_pct REAL DEFAULT 2.5,
      company_commission REAL DEFAULT 0,
      owner_commission REAL DEFAULT 0,
      area_sq_m REAL NOT NULL,
      bedrooms INTEGER DEFAULT 3,
      bathrooms INTEGER DEFAULT 2,
      floor INTEGER DEFAULT 1,
      finishing TEXT NOT NULL DEFAULT 'تشطيب كامل',
      parking INTEGER DEFAULT 1,
      garden INTEGER DEFAULT 0,
      pool INTEGER DEFAULT 0,
      balcony INTEGER DEFAULT 1,
      furniture INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      images_json TEXT NOT NULL DEFAULT '[]',
      video_url TEXT,
      tour360_url TEXT,
      owner_id TEXT REFERENCES owners(id) ON UPDATE CASCADE ON DELETE SET NULL,
      owner_name TEXT,
      owner_phone TEXT,
      documents_json TEXT NOT NULL DEFAULT '[]',
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Clients / Leads CRM Table
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      secondary_phone TEXT,
      email TEXT,
      lead_status TEXT NOT NULL DEFAULT 'عميل جديد',
      lead_source TEXT NOT NULL DEFAULT 'فيس بوك',
      budget_min REAL DEFAULT 0,
      budget_max REAL DEFAULT 0,
      preferred_district TEXT,
      preferred_type TEXT,
      preferred_payment_method TEXT DEFAULT 'كاش',
      assigned_agent_id TEXT REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
      assigned_agent_name TEXT,
      reminder_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Communication Logs Table (Cascade on Client/Owner delete)
    CREATE TABLE IF NOT EXISTS communication_logs (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      owner_id TEXT REFERENCES owners(id) ON UPDATE CASCADE ON DELETE CASCADE,
      type TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Field Viewings Table
    CREATE TABLE IF NOT EXISTS viewings (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      property_title TEXT,
      property_code TEXT,
      client_id TEXT REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      client_name TEXT,
      client_phone TEXT,
      agent_id TEXT REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
      agent_name TEXT,
      driver_name TEXT,
      vehicle TEXT,
      viewing_date TEXT NOT NULL,
      viewing_time TEXT NOT NULL,
      location_address TEXT,
      status TEXT NOT NULL DEFAULT 'مجدولة',
      customer_feedback TEXT,
      result TEXT,
      follow_up_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Contracts & Commissions Table
    CREATE TABLE IF NOT EXISTS commissions (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      property_title TEXT NOT NULL,
      property_code TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id) ON UPDATE CASCADE ON DELETE SET NULL,
      deal_amount REAL NOT NULL,
      commission_pct REAL DEFAULT 2.5,
      company_amount REAL NOT NULL,
      employee_id TEXT REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
      employee_name TEXT NOT NULL,
      employee_share_pct REAL DEFAULT 20,
      employee_amount REAL NOT NULL,
      manager_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'قيد التحصيل',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Marketing Campaigns Table
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      budget REAL NOT NULL,
      spend REAL NOT NULL,
      leads_count INTEGER DEFAULT 0,
      deals_won INTEGER DEFAULT 0,
      cost_per_lead REAL DEFAULT 0,
      roi_pct REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'نشطة',
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Tasks Table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to_id TEXT REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
      assigned_to_name TEXT,
      priority TEXT NOT NULL DEFAULT 'متوسطة',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'قيد الانتظار',
      category TEXT NOT NULL DEFAULT 'اتصال',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Accounting Transactions Table
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      reference_no TEXT UNIQUE,
      cashbox_account TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Centralized Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      manager_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Centralized Roles
    CREATE TABLE IF NOT EXISTS system_roles (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id TEXT REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL,
      description TEXT,
      hierarchy_level INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Role Permissions Matrix
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL REFERENCES system_roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'DEPARTMENT',
      is_allowed INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role_id, module, action)
    );

    -- 14. User-Level Custom Permission Overrides & Temporary Permissions
    CREATE TABLE IF NOT EXISTS user_permission_overrides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'OWN',
      is_allowed INTEGER NOT NULL,
      valid_from TEXT,
      valid_until TEXT,
      reason TEXT,
      granted_by_user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, module, action)
    );

    -- 15. Dynamic Property Types
    CREATE TABLE IF NOT EXISTS property_types (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_purpose TEXT NOT NULL DEFAULT 'بيع',
      required_fields_json TEXT DEFAULT '[]',
      applicable_fields_json TEXT DEFAULT '[]',
      is_system INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Property Modification History & Audit (Maker-Checker & Value Recovery)
    CREATE TABLE IF NOT EXISTS property_history (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      changed_by_user_id TEXT NOT NULL,
      changed_by_name TEXT NOT NULL,
      change_category TEXT NOT NULL DEFAULT 'basic',
      field_name TEXT NOT NULL,
      field_label TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 17. System Lookups (Expandable Legal Statuses, Finishing, etc.)
    CREATE TABLE IF NOT EXISTS system_lookups (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      code TEXT NOT NULL,
      label TEXT NOT NULL,
      is_system INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, code)
    );

    -- 18. Owner Follow-ups & Availability Confirmation Records
    CREATE TABLE IF NOT EXISTS owner_followups (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_code TEXT,
      property_title TEXT,
      owner_id TEXT NOT NULL REFERENCES owners(id) ON UPDATE CASCADE ON DELETE CASCADE,
      owner_name TEXT,
      owner_phone TEXT,
      employee_id TEXT,
      employee_name TEXT,
      channel TEXT NOT NULL DEFAULT 'اتصال هاتفي',
      is_answered INTEGER NOT NULL DEFAULT 1,
      availability_status TEXT NOT NULL,
      price_changed INTEGER DEFAULT 0,
      old_price REAL,
      new_price REAL,
      specs_changed INTEGER DEFAULT 0,
      new_specs_notes TEXT,
      is_sold_or_rented INTEGER DEFAULT 0,
      deal_type TEXT,
      closed_by_other_company INTEGER DEFAULT 0,
      other_broker_name TEXT,
      commission_agreed_pct REAL DEFAULT 2.5,
      notes TEXT,
      next_followup_date TEXT,
      validity_days INTEGER DEFAULT 14,
      contact_date TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Owner Follow-up Tasks (Deadlines, Supervisor Alerts, Escalations)
    CREATE TABLE IF NOT EXISTS followup_tasks (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_code TEXT,
      property_title TEXT,
      owner_id TEXT NOT NULL REFERENCES owners(id) ON UPDATE CASCADE ON DELETE CASCADE,
      owner_name TEXT,
      owner_phone TEXT,
      assigned_to_id TEXT,
      assigned_to_name TEXT,
      priority TEXT NOT NULL DEFAULT 'متوسطة',
      due_date TEXT NOT NULL,
      task_details TEXT,
      status TEXT NOT NULL DEFAULT 'قيد الانتظار',
      outcome TEXT,
      completed_at TEXT,
      completed_by_user_id TEXT,
      completed_by_name TEXT,
      reassigned_from_id TEXT,
      reassigned_from_name TEXT,
      reassign_reason TEXT,
      reassign_count INTEGER DEFAULT 0,
      followup_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 20. External Deal Incident Reports & Investigation Audit Trail
    CREATE TABLE IF NOT EXISTS external_deal_reports (
      id TEXT PRIMARY KEY,
      report_number TEXT UNIQUE NOT NULL,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_code TEXT,
      property_title TEXT,
      owner_id TEXT NOT NULL REFERENCES owners(id) ON UPDATE CASCADE ON DELETE CASCADE,
      owner_name TEXT,
      owner_phone TEXT,
      deal_type TEXT NOT NULL DEFAULT 'بيع خارجي',
      deal_date TEXT NOT NULL,
      estimated_price REAL DEFAULT 0,
      buyer_name TEXT,
      buyer_phone TEXT,
      buyer_source_matched TEXT DEFAULT 'غير معلوم',
      external_broker_name TEXT,
      external_broker_phone TEXT,
      commission_claim_eligible INTEGER DEFAULT 0,
      commission_claim_amount REAL DEFAULT 0,
      investigation_status TEXT NOT NULL DEFAULT 'جديد',
      investigation_notes TEXT,
      reported_by TEXT,
      reported_by_user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 21. Deal Closings & 24-Hour Archival Log
    CREATE TABLE IF NOT EXISTS deal_closings (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_code TEXT,
      property_title TEXT,
      deal_type TEXT NOT NULL DEFAULT 'بيع',
      deal_date TEXT NOT NULL,
      final_price REAL NOT NULL,
      client_id TEXT REFERENCES clients(id) ON UPDATE CASCADE ON DELETE SET NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_national_id TEXT,
      seller_owner_id TEXT,
      seller_owner_name TEXT,
      closer_employee_id TEXT,
      closer_employee_name TEXT,
      commission_total REAL DEFAULT 0,
      company_share REAL DEFAULT 0,
      marketer_share REAL DEFAULT 0,
      notes TEXT,
      archive_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'معتمدة',
      cancellation_reason TEXT,
      cancelled_at TEXT,
      cancelled_by_user_id TEXT,
      cancelled_by_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 22. Client Search Requests (Multi-Request per client with preferences & completeness)
    CREATE TABLE IF NOT EXISTS client_search_requests (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      client_name TEXT,
      client_phone TEXT,
      request_title TEXT NOT NULL,
      property_type TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'سكن',
      budget_min REAL DEFAULT 0,
      budget_max REAL NOT NULL,
      city TEXT NOT NULL DEFAULT 'القاهرة',
      district TEXT NOT NULL,
      sub_district TEXT,
      alternative_districts_json TEXT DEFAULT '[]',
      min_area REAL,
      max_area REAL,
      min_bedrooms INTEGER,
      min_bathrooms INTEGER,
      preferred_floor TEXT,
      accept_ground_floor INTEGER DEFAULT 1,
      accept_last_floor INTEGER DEFAULT 1,
      elevator_required INTEGER DEFAULT 0,
      finishing_status TEXT,
      legal_status_required TEXT,
      land_share_required INTEGER DEFAULT 1,
      payment_method TEXT NOT NULL DEFAULT 'كاش',
      down_payment_max REAL,
      installment_years_max INTEGER,
      urgency_level TEXT NOT NULL DEFAULT 'متوسط الاستعجال',
      additional_notes TEXT,
      status TEXT NOT NULL DEFAULT 'نشط',
      completeness_score INTEGER DEFAULT 0,
      missing_fields_json TEXT DEFAULT '[]',
      last_matched_at TEXT,
      last_matched_count INTEGER DEFAULT 0,
      created_by_user_id TEXT,
      created_by_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 23. Search Request Modification & Match Audit Trail
    CREATE TABLE IF NOT EXISTS search_request_history (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES client_search_requests(id) ON UPDATE CASCADE ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      changed_by_user_id TEXT,
      changed_by_name TEXT,
      change_reason TEXT,
      old_values_json TEXT,
      new_values_json TEXT,
      new_matches_count INTEGER DEFAULT 0,
      removed_matches_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Client Property Proposals & Sharing Records
    CREATE TABLE IF NOT EXISTS client_proposals (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      client_name TEXT,
      client_phone TEXT,
      request_id TEXT REFERENCES client_search_requests(id) ON UPDATE CASCADE ON DELETE SET NULL,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_title TEXT,
      property_code TEXT,
      property_price REAL,
      channel TEXT NOT NULL DEFAULT 'واتساب',
      sent_by_user_id TEXT,
      sent_by_name TEXT,
      proposal_text TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'معتمد',
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      approved_at TEXT,
      client_reaction TEXT DEFAULT 'بانتظار الرد',
      client_feedback_notes TEXT,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 25. Client Lead Source Disputes & Managerial Arbitration
    CREATE TABLE IF NOT EXISTS source_disputes (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      client_name TEXT,
      claimed_by_id TEXT NOT NULL,
      claimed_by_name TEXT NOT NULL,
      current_source TEXT NOT NULL,
      disputed_source TEXT NOT NULL,
      reason TEXT NOT NULL,
      proof_details TEXT,
      status TEXT NOT NULL DEFAULT 'قيد المراجعة الإدارية',
      resolution_notes TEXT,
      resolved_by_user_id TEXT,
      resolved_by_name TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 26. Partner Marketing Companies (شركات التسويق العقاري المتعاونة)
    CREATE TABLE IF NOT EXISTS partner_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company_type TEXT NOT NULL DEFAULT 'شركة تسويق عقاري',
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      commercial_register TEXT,
      tax_number TEXT,
      default_commission_share_pct REAL DEFAULT 50.0,
      status TEXT NOT NULL DEFAULT 'نشط',
      agreement_start_date TEXT NOT NULL,
      agreement_end_date TEXT,
      terms_notes TEXT,
      documents_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 27. Partner Unit Shares (ربط الوحدات بشركات التسويق وحصصها)
    CREATE TABLE IF NOT EXISTS partner_unit_shares (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      property_code TEXT,
      property_title TEXT,
      partner_company_id TEXT NOT NULL REFERENCES partner_companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
      partner_company_name TEXT NOT NULL,
      share_percentage REAL NOT NULL DEFAULT 50.0,
      fixed_amount REAL,
      share_condition TEXT NOT NULL DEFAULT 'مناصفة 50% من إجمالي عمولة العملية عند الإتمام',
      agreement_date TEXT NOT NULL,
      expiration_date TEXT,
      registered_by_user_id TEXT NOT NULL,
      registered_by_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'معتمد',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 28. Real Estate Deals (سجل الصفقات العقارية الشامل)
    CREATE TABLE IF NOT EXISTS real_estate_deals (
      id TEXT PRIMARY KEY,
      deal_number TEXT NOT NULL UNIQUE,
      property_id TEXT NOT NULL REFERENCES properties(id) ON UPDATE CASCADE,
      property_code TEXT NOT NULL,
      property_title TEXT NOT NULL,
      owner_id TEXT REFERENCES owners(id) ON UPDATE CASCADE,
      owner_name TEXT NOT NULL,
      owner_phone TEXT,
      client_id TEXT REFERENCES clients(id) ON UPDATE CASCADE,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_source TEXT NOT NULL,
      property_source TEXT NOT NULL DEFAULT 'مالك مباشر',
      partner_company_id TEXT REFERENCES partner_companies(id) ON UPDATE CASCADE,
      partner_company_name TEXT,
      deal_type TEXT NOT NULL DEFAULT 'بيع',
      deal_price REAL NOT NULL,
      agreed_commission REAL NOT NULL,
      final_negotiated_commission REAL NOT NULL,
      collected_amount REAL NOT NULL DEFAULT 0,
      remaining_amount REAL NOT NULL DEFAULT 0,
      distributable_amount REAL NOT NULL DEFAULT 0,
      total_paid_out REAL NOT NULL DEFAULT 0,
      deal_date TEXT NOT NULL,
      closing_date TEXT,
      primary_agent_id TEXT NOT NULL,
      primary_agent_name TEXT NOT NULL,
      secondary_agent_id TEXT,
      secondary_agent_name TEXT,
      viewing_agent_id TEXT,
      viewing_agent_name TEXT,
      closer_user_id TEXT NOT NULL,
      closer_user_name TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'مسودة',
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      approved_at TEXT,
      contract_document_url TEXT,
      notes TEXT,
      snapshot_rules_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 29. Commission Beneficiary Splits (توزيع العمولات على المستحقين)
    CREATE TABLE IF NOT EXISTS commission_beneficiary_splits (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES real_estate_deals(id) ON UPDATE CASCADE ON DELETE CASCADE,
      beneficiary_type TEXT NOT NULL,
      beneficiary_id TEXT NOT NULL,
      beneficiary_name TEXT NOT NULL,
      beneficiary_role TEXT,
      percentage REAL NOT NULL,
      allocated_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'غير مستحق بعد',
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      deductions_amount REAL DEFAULT 0,
      deduction_reason TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 30. Commission Disbursements (سجل صرف العمولات والدفعات)
    CREATE TABLE IF NOT EXISTS commission_disbursements (
      id TEXT PRIMARY KEY,
      split_id TEXT NOT NULL REFERENCES commission_beneficiary_splits(id) ON UPDATE CASCADE ON DELETE CASCADE,
      deal_id TEXT NOT NULL REFERENCES real_estate_deals(id) ON UPDATE CASCADE ON DELETE CASCADE,
      beneficiary_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'تحويل بنكي',
      receipt_number TEXT NOT NULL,
      executed_by_user_id TEXT NOT NULL,
      executed_by_name TEXT NOT NULL,
      authorized_by_user_id TEXT NOT NULL,
      authorized_by_name TEXT NOT NULL,
      document_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 31. Equity Partners (نظام الشركاء في الشركة)
    CREATE TABLE IF NOT EXISTS equity_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      national_id TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      equity_percentage REAL NOT NULL,
      partnership_start_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'نشط',
      total_capital_contributed REAL DEFAULT 0,
      total_dividends_paid REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      bank_account_details TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 32. Smart Property Location Intelligence (التحليل الجغرافي والخدمات المحيطة)
    CREATE TABLE IF NOT EXISTS property_location_intelligence (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL UNIQUE REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      search_radius_meters INTEGER NOT NULL DEFAULT 2000,
      status TEXT NOT NULL DEFAULT 'لم يتم البحث',
      auto_generated_description_ar TEXT NOT NULL,
      reviewed_description_ar TEXT,
      final_approved_description_ar TEXT,
      places_found_count INTEGER DEFAULT 0,
      selected_places_count INTEGER DEFAULT 0,
      places_json TEXT NOT NULL DEFAULT '[]',
      reviewed_by_user_id TEXT,
      reviewed_by_name TEXT,
      approved_by_user_id TEXT,
      approved_by_name TEXT,
      approved_at TEXT,
      last_searched_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Strategic Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(lead_status);
    CREATE INDEX IF NOT EXISTS idx_viewings_date ON viewings(viewing_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_commissions_date ON commissions(date);
    CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_prop_hist_prop ON property_history(property_id);
    CREATE INDEX IF NOT EXISTS idx_role_perm ON role_permissions(role_id, module);
    CREATE INDEX IF NOT EXISTS idx_user_override ON user_permission_overrides(user_id, module);
    CREATE INDEX IF NOT EXISTS idx_fup_prop ON owner_followups(property_id);
    CREATE INDEX IF NOT EXISTS idx_fup_owner ON owner_followups(owner_id);
    CREATE INDEX IF NOT EXISTS idx_fup_emp ON owner_followups(employee_id);
    CREATE INDEX IF NOT EXISTS idx_fup_tasks_emp ON followup_tasks(assigned_to_id);
    CREATE INDEX IF NOT EXISTS idx_fup_tasks_status ON followup_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_ext_deals_prop ON external_deal_reports(property_id);
    CREATE INDEX IF NOT EXISTS idx_ext_deals_status ON external_deal_reports(investigation_status);
    CREATE INDEX IF NOT EXISTS idx_deal_closings_prop ON deal_closings(property_id);
    CREATE INDEX IF NOT EXISTS idx_deal_closings_status ON deal_closings(status);
    CREATE INDEX IF NOT EXISTS idx_csr_client ON client_search_requests(client_id);
    CREATE INDEX IF NOT EXISTS idx_csr_status ON client_search_requests(status);
    CREATE INDEX IF NOT EXISTS idx_csr_district ON client_search_requests(district);
    CREATE INDEX IF NOT EXISTS idx_csr_budget ON client_search_requests(budget_max);
    CREATE INDEX IF NOT EXISTS idx_proposals_client ON client_proposals(client_id);
    CREATE INDEX IF NOT EXISTS idx_proposals_prop ON client_proposals(property_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_client ON source_disputes(client_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_status ON source_disputes(status);
  `;

  db.exec(schemaSql);
  runSafeMigrations();
  seedDepartmentsAndRolesIfEmpty();
  seedPropertyTypesIfEmpty();
  seedSystemLookupsIfEmpty();
  seedUsersIfEmpty();
  seedInitialDataIfEmpty();
}

/**
 * Safe Database Migrations: Adds columns if they don't exist without touching data
 */
export function runSafeMigrations() {
  const addColumnIfNotExists = (table: string, column: string, type: string) => {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        console.log(`[Safe Migration] Added column ${column} to table ${table}`);
      }
    } catch (e) {
      console.warn(`[Safe Migration] Migration check warning for ${table}.${column}:`, e);
    }
  };

  // 1. Users Table Columns
  addColumnIfNotExists('users', 'department_id', 'TEXT REFERENCES departments(id)');
  addColumnIfNotExists('users', 'role_id', 'TEXT REFERENCES system_roles(id)');
  addColumnIfNotExists('users', 'team_id', 'TEXT');
  addColumnIfNotExists('users', 'is_read_only', 'INTEGER DEFAULT 0');

  // 2. Properties Table Columns
  addColumnIfNotExists('properties', 'property_type_code', 'TEXT');
  addColumnIfNotExists('properties', 'legal_status', "TEXT DEFAULT 'مرخص ومسجل'");
  addColumnIfNotExists('properties', 'reconciliation_status', "TEXT DEFAULT 'لا يخضع للتصالح'");
  addColumnIfNotExists('properties', 'total_floors', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('properties', 'unit_floor', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('properties', 'has_roof', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('properties', 'has_elevator', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('properties', 'land_share', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('properties', 'finishing_level', "TEXT DEFAULT 'تشطيب كامل'");
  addColumnIfNotExists('properties', 'furnishings_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('properties', 'currency', "TEXT DEFAULT 'EGP'");
  addColumnIfNotExists('properties', 'operation_type', "TEXT DEFAULT 'بيع'");
  addColumnIfNotExists('properties', 'marketing_agreement', "TEXT DEFAULT 'عقد تسويق حصري للماسة'");
  addColumnIfNotExists('properties', 'partner_company_name', 'TEXT');
  addColumnIfNotExists('properties', 'partner_company_share_pct', 'REAL DEFAULT 0');
  addColumnIfNotExists('properties', 'registered_by_user_id', 'TEXT');
  addColumnIfNotExists('properties', 'registered_by_name', 'TEXT');
  addColumnIfNotExists('properties', 'pending_changes_json', 'TEXT');
  addColumnIfNotExists('properties', 'approval_status', "TEXT DEFAULT 'APPROVED'");

  // 3. Properties Table Availability & Archival Columns
  addColumnIfNotExists('properties', 'availability_status', "TEXT DEFAULT 'متاحة ومؤكدة'");
  addColumnIfNotExists('properties', 'confirmation_validity_days', 'INTEGER DEFAULT 14');
  addColumnIfNotExists('properties', 'last_confirmed_at', 'TEXT');
  addColumnIfNotExists('properties', 'confirmation_valid_until', 'TEXT');
  addColumnIfNotExists('properties', 'assigned_marketer_ids_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('properties', 'assigned_marketer_names_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('properties', 'deal_closing_id', 'TEXT');
  addColumnIfNotExists('properties', 'is_archived', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('properties', 'archived_at', 'TEXT');

  // 4. Owners Table Marketing & Follow-up Columns
  addColumnIfNotExists('owners', 'assigned_employee_id', 'TEXT');
  addColumnIfNotExists('owners', 'assigned_employee_name', 'TEXT');
  addColumnIfNotExists('owners', 'last_contact_date', 'TEXT');
  addColumnIfNotExists('owners', 'last_followup_outcome', 'TEXT');
  addColumnIfNotExists('owners', 'next_followup_date', 'TEXT');
  addColumnIfNotExists('owners', 'deals_with_others', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('owners', 'other_brokers_details', 'TEXT');
  addColumnIfNotExists('owners', 'marketing_terms', 'TEXT');

  // 5. Clients CRM 360 Columns
  addColumnIfNotExists('clients', 'whatsapp', 'TEXT');
  addColumnIfNotExists('clients', 'original_source', 'TEXT');
  addColumnIfNotExists('clients', 'assigned_marketer_id', 'TEXT');
  addColumnIfNotExists('clients', 'assigned_marketer_name', 'TEXT');
  addColumnIfNotExists('clients', 'co_marketer_id', 'TEXT');
  addColumnIfNotExists('clients', 'co_marketer_name', 'TEXT');
  addColumnIfNotExists('clients', 'source_locked', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('clients', 'source_audit_notes', 'TEXT');
  addColumnIfNotExists('clients', 'last_contact_date', 'TEXT');
  addColumnIfNotExists('clients', 'last_contact_channel', 'TEXT');

  // 6. Viewings Extension Columns
  addColumnIfNotExists('viewings', 'meeting_point', 'TEXT');
  addColumnIfNotExists('viewings', 'duration_minutes', 'INTEGER DEFAULT 60');
  addColumnIfNotExists('viewings', 'multi_unit_ids_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('viewings', 'multi_unit_titles_json', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('viewings', 'client_source', 'TEXT');
  addColumnIfNotExists('viewings', 'assigned_marketer_id', 'TEXT');
  addColumnIfNotExists('viewings', 'assigned_marketer_name', 'TEXT');
  addColumnIfNotExists('viewings', 'rating', 'INTEGER');
  addColumnIfNotExists('viewings', 'rejection_reason', 'TEXT');
  addColumnIfNotExists('viewings', 'no_show_reason', 'TEXT');
  addColumnIfNotExists('viewings', 'rescheduled_from_id', 'TEXT');
  addColumnIfNotExists('viewings', 'cancellation_reason', 'TEXT');

  // 7. Seed Sample Partner Companies if empty
  try {
    const pcCount = db.prepare('SELECT COUNT(*) as count FROM partner_companies').get() as { count: number };
    if (pcCount.count === 0) {
      const insPC = db.prepare(`
        INSERT INTO partner_companies (
          id, name, company_type, contact_person, phone, email, address, default_commission_share_pct, status, agreement_start_date, terms_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insPC.run(
        'pc-1',
        'شركة الأهرام للتسويق والاستثمار العقاري',
        'شركة تسويق عقاري',
        'م. شريف عبد الهادي',
        '+20 100 234 5678',
        'info@alahram-re.com',
        'التجمع الخامس - شارع التسعين الشمالي',
        50.0,
        'نشط',
        '2026-01-01',
        'اتفاقية تعاون شامل ومناصفة 50% للعمولة مع أولوية عرض الوحدات الحصرية'
      );
      insPC.run(
        'pc-2',
        'المتحدة للوساطة العقارية (بروكر مستقل)',
        'وسيط مستقل',
        'أ. عصام النجار',
        '+20 102 345 6789',
        'issam@united-brokerage.eg',
        'الشيخ زايد - وصلة دهشور',
        40.0,
        'نشط',
        '2026-02-15',
        'عمولة وساطة خارجية 40% عند جلب مشترين مباشرين لوحدات الماسة'
      );
      insPC.run(
        'pc-3',
        'مجموعة الرواد للتطوير وإدارة المشروعات',
        'مطور عقاري',
        'د. ياسر فخري',
        '+20 109 876 5432',
        'sales@alrowad-developments.com',
        'مدينة نصر - المنطقة الأولى',
        60.0,
        'نشط',
        '2026-01-10',
        'تسويق حصري لمشاريع عمارات سكنية مع عمولة تفضيلية 60% للماسة'
      );
    }
  } catch (err) {
    console.warn('[Safe Migration] partner_companies seed note:', err);
  }

  // 8. Seed Sample Equity Partners if empty
  try {
    const epCount = db.prepare('SELECT COUNT(*) as count FROM equity_partners').get() as { count: number };
    if (epCount.count === 0) {
      const insEP = db.prepare(`
        INSERT INTO equity_partners (
          id, name, phone, equity_percentage, partnership_start_date, status, total_capital_contributed, current_balance, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insEP.run('ep-1', 'الحاج رجب الشامي', '+20 100 000 1122', 50.0, '2024-01-01', 'نشط', 5000000, 1450000, 'شريك مؤسس بنسبة 50% ورأس مال تشغيلي');
      insEP.run('ep-2', 'م. فؤاد عبد الخالق', '+20 100 000 3344', 30.0, '2024-01-01', 'نشط', 3000000, 870000, 'شريك تنفيذي ومسؤول تطوير الفروع بنسبة 30%');
      insEP.run('ep-3', 'أ. كريم المنشاوي', '+20 100 000 5566', 20.0, '2025-01-01', 'نشط', 2000000, 580000, 'شريك مالي بنسبة 20%');
    }
  } catch (err) {
    console.warn('[Safe Migration] equity_partners seed note:', err);
  }
}

/**
 * Seed Centralized Departments, System Roles, and Default Permission Matrix
 */
export function seedDepartmentsAndRolesIfEmpty() {
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (deptCount.count === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (id, code, name, description, manager_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const depts = [
      ['dept-mgmt', 'MGMT', 'الإدارة العليا والتوجيه العام', 'الإشراف الاستراتيجي الكامل على القرارات والحسابات والسياسات', 'السيد محسن'],
      ['dept-sales', 'SALES', 'المبيعات وإدارة العملاء', 'متابعة مسار الصفقات وإتمام التعاقدات والتسويق الميداني', 'أحمد مراد'],
      ['dept-re', 'REAL_ESTATE', 'إدارة وتطوير الثروة العقارية', 'فحص العقارات والتوثيق القانوني ومراجعة عقود الملاك', 'أحمد عيسوي'],
      ['dept-fin', 'FINANCE', 'الحسابات والشؤون المالية', 'إدارة العمولات والإيرادات والمصروفات والتقارير المحاسبية', 'خالد عبد الرازق'],
      ['dept-ops', 'OPERATIONS', 'خدمة العملاء والعمليات الميدانية', 'جدولة المعاينات وحركة السيارات ومتابعة اتصالات العملاء', 'سارة يوسف'],
      ['dept-ext', 'EXTERNAL', 'المسوقون الخارجيون والشركات الشريكة', 'التعاون مع الوسطاء المستقلين والشركات العقارية الزميلة', 'محمد سامي'],
    ];

    for (const d of depts) {
      insertDept.run(...d);
    }
    console.log('[RBAC Seed] Departments seeded.');
  }

  const roleCount = db.prepare('SELECT COUNT(*) as count FROM system_roles').get() as { count: number };
  if (roleCount.count === 0) {
    const insertRole = db.prepare(`
      INSERT INTO system_roles (id, code, name, department_id, description, hierarchy_level, is_system)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const roles = [
      ['role-super-admin', 'SUPER_ADMIN', 'الإدارة العليا (المدير العام)', 'dept-mgmt', 'صلاحيات مطلقة غير مقيدة على كافة أقسام النظام والبيانات والرقابة', 1, 1],
      ['role-exec-dir', 'EXECUTIVE_DIRECTOR', 'المدير التنفيذي', 'dept-mgmt', 'صلاحيات تنفيذية شاملة، اعتماد التعديلات الحساسة، إدارة الفروع والتقارير العامة', 2, 1],
      ['role-dept-mgr', 'DEPARTMENT_MANAGER', 'مدير قسم', 'dept-sales', 'إدارة كاملة لبيانات وموظفي ومهام وتقارير قسمه، واعتماد عمليات القسم', 3, 1],
      ['role-supervisor', 'SUPERVISOR', 'مشرف قسم', 'dept-sales', 'الإشراف على فريق عمل محدد، إسناد المهام، ومتابعة المعاينات والعملاء', 4, 1],
      ['role-employee', 'STAFF_EMPLOYEE', 'موظف / مسئول مبيعات', 'dept-sales', 'إدخال وتعديل بيانات عملائه ومعايناته وعقاراته المسندة إليه فقط', 5, 1],
      ['role-inhouse-mkt', 'INHOUSE_MARKETER', 'مسوق داخلي', 'dept-sales', 'إدارة الحملات الإعلانية وتوليد العملاء ومتابعة مؤشرات الأداء', 5, 1],
      ['role-external-mkt', 'EXTERNAL_MARKETER', 'مسوق خارجي', 'dept-ext', 'إدخال عقارات وعملاء مع إمكانية عرض العقارات المتاحة فقط بنطاق محدود', 6, 1],
      ['role-partner-company', 'PARTNER_COMPANY', 'شركة متعاونة', 'dept-ext', 'تسجيل وحدات مشتركة ومتابعة نسب العمولات المتفق عليها بين الشركتين', 6, 1],
      ['role-accountant', 'ACCOUNTANT', 'المحاسب المالي', 'dept-fin', 'تسجيل القيود المحاسبية وتوزيع العمولات ومطابقة الخزينة والتقارير المالية', 3, 1],
    ];

    for (const r of roles) {
      insertRole.run(...r);
    }
    console.log('[RBAC Seed] System roles seeded.');

    // Seed Default Permissions Matrix
    const insertPerm = db.prepare(`
      INSERT OR REPLACE INTO role_permissions (id, role_id, module, action, scope, is_allowed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const allModules = ['properties', 'clients', 'viewings', 'commissions', 'tasks', 'marketing', 'employees', 'roles', 'reports', 'financials', 'audit_logs'];
    const standardActions = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'export', 'print_reports', 'view_financials', 'manage_employees', 'manage_permissions', 'access_dept_reports', 'access_general_reports'];
    const propEditActions = ['edit_basic', 'edit_location', 'edit_specs', 'edit_price', 'edit_media', 'edit_owner', 'edit_status', 'edit_marketing_deal', 'edit_partner_company', 'edit_commission'];

    // 1. Super Admin: full access to everything, scope ALL
    for (const mod of allModules) {
      for (const act of standardActions) {
        insertPerm.run(`perm-sa-${mod}-${act}`, 'role-super-admin', mod, act, 'ALL', 1);
      }
    }
    for (const act of propEditActions) {
      insertPerm.run(`perm-sa-prop-${act}`, 'role-super-admin', 'properties', act, 'ALL', 1);
    }

    // 2. Executive Director: full access to everything, scope ALL, approve/reject everywhere
    for (const mod of allModules) {
      for (const act of standardActions) {
        const allowed = act === 'delete' && mod === 'roles' ? 0 : 1;
        insertPerm.run(`perm-exec-${mod}-${act}`, 'role-exec-dir', mod, act, 'ALL', allowed);
      }
    }
    for (const act of propEditActions) {
      insertPerm.run(`perm-exec-prop-${act}`, 'role-exec-dir', 'properties', act, 'ALL', 1);
    }

    // 3. Department Manager (Sales): scope DEPARTMENT
    const deptAllowedActions = ['view', 'create', 'edit', 'approve', 'reject', 'assign', 'export', 'print_reports', 'access_dept_reports'];
    for (const mod of ['properties', 'clients', 'viewings', 'tasks', 'marketing', 'reports']) {
      for (const act of deptAllowedActions) {
        insertPerm.run(`perm-mgr-${mod}-${act}`, 'role-dept-mgr', mod, act, 'DEPARTMENT', 1);
      }
    }
    for (const act of ['edit_basic', 'edit_location', 'edit_specs', 'edit_media', 'edit_owner', 'edit_status', 'edit_price', 'edit_marketing_deal']) {
      insertPerm.run(`perm-mgr-prop-${act}`, 'role-dept-mgr', 'properties', act, 'DEPARTMENT', 1);
    }

    // 4. Staff Employee (Sales Agent): scope OWN
    for (const mod of ['properties', 'clients', 'viewings', 'tasks']) {
      insertPerm.run(`perm-emp-${mod}-view`, 'role-employee', mod, 'view', mod === 'properties' ? 'ALL' : 'OWN', 1);
      insertPerm.run(`perm-emp-${mod}-create`, 'role-employee', mod, 'create', 'OWN', 1);
      insertPerm.run(`perm-emp-${mod}-edit`, 'role-employee', mod, 'edit', 'OWN', 1);
    }
    // Employee can edit basic, location, specs, media, but NOT price, owner, commission directly
    for (const act of ['edit_basic', 'edit_location', 'edit_specs', 'edit_media']) {
      insertPerm.run(`perm-emp-prop-${act}`, 'role-employee', 'properties', act, 'OWN', 1);
    }

    // 5. Accountant: financials & commissions & reports
    for (const mod of ['commissions', 'financials', 'reports']) {
      for (const act of ['view', 'create', 'edit', 'approve', 'export', 'print_reports', 'view_financials', 'access_dept_reports']) {
        insertPerm.run(`perm-acct-${mod}-${act}`, 'role-accountant', mod, act, 'ALL', 1);
      }
    }
    insertPerm.run('perm-acct-prop-view', 'role-accountant', 'properties', 'view', 'ALL', 1);
    insertPerm.run('perm-acct-prop-commission', 'role-accountant', 'properties', 'edit_commission', 'ALL', 1);

    // 6. External Marketer: view properties (ALL), manage own clients (OWN)
    insertPerm.run('perm-ext-prop-view', 'role-external-mkt', 'properties', 'view', 'ALL', 1);
    insertPerm.run('perm-ext-prop-create', 'role-external-mkt', 'properties', 'create', 'OWN', 1);
    insertPerm.run('perm-ext-cli-view', 'role-external-mkt', 'clients', 'view', 'OWN', 1);
    insertPerm.run('perm-ext-cli-create', 'role-external-mkt', 'clients', 'create', 'OWN', 1);

    // 7. Partner Company: view properties, register partner listings
    insertPerm.run('perm-part-prop-view', 'role-partner-company', 'properties', 'view', 'ALL', 1);
    insertPerm.run('perm-part-prop-create', 'role-partner-company', 'properties', 'create', 'OWN', 1);
    insertPerm.run('perm-part-prop-partner', 'role-partner-company', 'properties', 'edit_partner_company', 'OWN', 1);

    console.log('[RBAC Seed] Role permissions matrix successfully populated.');
  }

  // Update existing users with department & role links if missing
  try {
    db.prepare("UPDATE users SET department_id = 'dept-mgmt', role_id = 'role-super-admin' WHERE id = 'usr-admin' AND (department_id IS NULL OR role_id IS NULL)").run();
    db.prepare("UPDATE users SET department_id = 'dept-mgmt', role_id = 'role-exec-dir' WHERE id = 'usr-exec' AND (department_id IS NULL OR role_id IS NULL)").run();
    db.prepare("UPDATE users SET department_id = 'dept-sales', role_id = 'role-dept-mgr' WHERE id = 'usr-sales-mgr' AND (department_id IS NULL OR role_id IS NULL)").run();
    db.prepare("UPDATE users SET department_id = 'dept-sales', role_id = 'role-employee' WHERE id = 'usr-sales-agent' AND (department_id IS NULL OR role_id IS NULL)").run();
    db.prepare("UPDATE users SET department_id = 'dept-fin', role_id = 'role-accountant' WHERE id = 'usr-acct' AND (department_id IS NULL OR role_id IS NULL)").run();
  } catch (e) {
    console.warn('[RBAC Seed] User link update warning:', e);
  }
}

/**
 * Seed Dynamic Real Estate Property Types
 */
export function seedPropertyTypesIfEmpty() {
  const typeCount = db.prepare('SELECT COUNT(*) as count FROM property_types').get() as { count: number };
  if (typeCount.count > 0) return;

  const insertType = db.prepare(`
    INSERT INTO property_types (
      id, code, name, category, default_purpose, required_fields_json, applicable_fields_json, is_system, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);

  const types = [
    {
      id: 'pt-apt-sale',
      code: 'APARTMENT_SALE',
      name: 'شقق للبيع',
      category: 'residential',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'bedrooms', 'bathrooms', 'floor', 'finishing'],
      applicable: ['floor', 'totalFloors', 'bedrooms', 'bathrooms', 'finishing', 'hasElevator', 'hasRoof', 'landShare', 'furnishings', 'parking', 'balcony', 'legalStatus', 'reconciliationStatus'],
    },
    {
      id: 'pt-apt-rent',
      code: 'APARTMENT_RENT',
      name: 'شقق للإيجار',
      category: 'residential',
      purpose: 'إيجار',
      required: ['price', 'areaSqM', 'bedrooms', 'bathrooms', 'floor'],
      applicable: ['floor', 'totalFloors', 'bedrooms', 'bathrooms', 'finishing', 'hasElevator', 'hasRoof', 'parking', 'balcony', 'furnishings'],
    },
    {
      id: 'pt-apt-furnished',
      code: 'FURNISHED_APARTMENT_RENT',
      name: 'شقق مفروشة للإيجار',
      category: 'residential',
      purpose: 'إيجار',
      required: ['price', 'areaSqM', 'bedrooms', 'bathrooms', 'furnishings'],
      applicable: ['floor', 'totalFloors', 'bedrooms', 'bathrooms', 'finishing', 'hasElevator', 'furnishings', 'parking', 'balcony', 'pool'],
    },
    {
      id: 'pt-house-sale',
      code: 'FULL_HOUSE_SALE',
      name: 'بيوت كاملة للبيع',
      category: 'residential',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'totalFloors', 'legalStatus'],
      applicable: ['totalFloors', 'bedrooms', 'bathrooms', 'finishing', 'garden', 'parking', 'hasRoof', 'landShare', 'legalStatus', 'reconciliationStatus'],
    },
    {
      id: 'pt-shop-comm',
      code: 'COMMERCIAL_SHOP',
      name: 'محلات للبيع أو الإيجار',
      category: 'commercial',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'legalStatus'],
      applicable: ['areaSqM', 'floor', 'finishing', 'legalStatus', 'reconciliationStatus', 'parking'],
    },
    {
      id: 'pt-land-sale',
      code: 'LAND_SALE',
      name: 'أراضٍ للبيع',
      category: 'land',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'legalStatus'],
      applicable: ['areaSqM', 'legalStatus', 'reconciliationStatus', 'landShare'],
    },
    {
      id: 'pt-land-part',
      code: 'LAND_PARTNERSHIP_INVESTMENT',
      name: 'أراضٍ للمشاركة أو الاستثمار',
      category: 'investment',
      purpose: 'مشاركة',
      required: ['areaSqM', 'legalStatus'],
      applicable: ['areaSqM', 'legalStatus', 'reconciliationStatus', 'partnerCompanyName', 'partnerCompanySharePct'],
    },
    {
      id: 'pt-office',
      code: 'OFFICE_SPACE',
      name: 'مكاتب إدارية للبيع أو الإيجار',
      category: 'commercial',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'finishing'],
      applicable: ['floor', 'totalFloors', 'bathrooms', 'finishing', 'hasElevator', 'parking', 'legalStatus'],
    },
    {
      id: 'pt-villa-sale',
      code: 'VILLA_SALE',
      name: 'فلل وقصور للبيع',
      category: 'residential',
      purpose: 'بيع',
      required: ['price', 'areaSqM', 'bedrooms', 'bathrooms', 'garden'],
      applicable: ['totalFloors', 'bedrooms', 'bathrooms', 'finishing', 'garden', 'pool', 'hasRoof', 'parking', 'legalStatus', 'landShare'],
    },
  ];

  for (const t of types) {
    insertType.run(
      t.id,
      t.code,
      t.name,
      t.category,
      t.purpose,
      JSON.stringify(t.required),
      JSON.stringify(t.applicable)
    );
  }
  console.log('[Property Types Seed] Dynamic property types seeded.');
}

/**
 * Seed System Lookups (Legal Status, Reconciliation, Finishing, Equipment, etc.)
 */
export function seedSystemLookupsIfEmpty() {
  const lookupCount = db.prepare('SELECT COUNT(*) as count FROM system_lookups').get() as { count: number };
  if (lookupCount.count > 0) return;

  const insertLookup = db.prepare(`
    INSERT OR REPLACE INTO system_lookups (id, category, code, label, is_system, active, sort_order)
    VALUES (?, ?, ?, ?, 1, 1, ?)
  `);

  const lookups = [
    // Legal Statuses
    ['sl-leg-1', 'legal_status', 'REG_NOTARY', 'مرخص ومسجل شهر عقاري', 1],
    ['sl-leg-2', 'legal_status', 'LEGAL_SIGNATURE', 'صحة توقيع ونفاذ عقد', 2],
    ['sl-leg-3', 'legal_status', 'ELIGIBLE_REG', 'قابل للتسجيل والشهر العقاري', 3],
    ['sl-leg-4', 'legal_status', 'UNDER_LICENSE', 'تحت إجراءات الترخيص والتصالح', 4],
    ['sl-leg-5', 'legal_status', 'DEED_AUTHORIZED', 'توكيل رسمي وسند ملكية معتمد', 5],

    // Reconciliation Statuses
    ['sl-rec-1', 'reconciliation_status', 'MODEL_10', 'نموذج 10 نهائي (مصالح ومعتمد رسمياً)', 1],
    ['sl-rec-2', 'reconciliation_status', 'MODEL_3', 'نموذج 3 ساري (قيد المعاينة الهندسية)', 2],
    ['sl-rec-3', 'reconciliation_status', 'EXEMPT_PRE_LAW', 'لا يخضع للتصالح (مباني قديمة مرخصة قبل القانون)', 3],
    ['sl-rec-4', 'reconciliation_status', 'IN_PROGRESS', 'جاري استيفاء المستندات والرسومات', 4],

    // Finishing Levels
    ['sl-fin-1', 'finishing_level', 'UNFINISHED', 'بدون تشطيب (على الطوب الأحمر)', 1],
    ['sl-fin-2', 'finishing_level', 'SEMI_FINISHED', 'نصف تشطيب (محارة وحلوق ووصلات تأسيس)', 2],
    ['sl-fin-3', 'finishing_level', 'FULL_FINISHED', 'تشطيب كامل جاهز للسكن', 3],
    ['sl-fin-4', 'finishing_level', 'SUPER_LUX', 'سوبر لوكس', 4],
    ['sl-fin-5', 'finishing_level', 'ULTRA_LUX', 'ألترا سوبر لوكس فندقي فاخر', 5],

    // Furnishings / Amenities
    ['sl-furn-1', 'furnishings', 'AC_CENTRAL', 'تكييفات مركزية أو سبليت', 1],
    ['sl-furn-2', 'furnishings', 'KITCHEN_CABINETS', 'مطبخ خشب أرو كامل بالأجهزة', 2],
    ['sl-furn-3', 'furnishings', 'ELEVATOR', 'مصعد كهربائي فندقي مستورد', 3],
    ['sl-furn-4', 'furnishings', 'PRIVATE_POOL', 'حمام سباحة خاص للأطفال والكبار', 4],
    ['sl-furn-5', 'furnishings', 'SURVEILLANCE', 'منظومة كاميرات مراقبة وإنذار أمني', 5],
    ['sl-furn-6', 'furnishings', 'SOLAR_HEATER', 'سخان طاقة شمسية مركزي', 6],
    ['sl-furn-7', 'furnishings', 'ROOF_GARDEN', 'روف خاص مجهز ببرجولة خشبية وشواية', 7],
    ['sl-furn-8', 'furnishings', 'COVERED_GARAGE', 'باكية جراج مغطاة خاصة بريموت كنترول', 8],

    // Operation Types
    ['sl-op-1', 'operation_type', 'CASH_SALE', 'بيع كاش مع إمكانية تفاوض بسيط', 1],
    ['sl-op-2', 'operation_type', 'INSTALLMENT_SALE', 'بيع بتسهيلات وسداد بالتقسيط المباشر', 2],
    ['sl-op-3', 'operation_type', 'ANNUAL_RENT', 'إيجار سنوي جديد (عقد سنتين أو أكثر)', 3],
    ['sl-op-4', 'operation_type', 'FURNISHED_RENT', 'إيجار مفروش شهري أو دائم', 4],
    ['sl-op-5', 'operation_type', 'PARTNERSHIP', 'مشاركة وتطوير عمراني على الأرض', 5],

    // Marketing Agreements
    ['sl-mkt-1', 'marketing_agreement', 'EXCLUSIVE_ALMASA', 'عقد تسويق حصري لشركة الماسة', 1],
    ['sl-mkt-2', 'marketing_agreement', 'DIRECT_MANDATE', 'تفويض تسويق مباشر من المالك الأصلي', 2],
    ['sl-mkt-3', 'marketing_agreement', 'OPEN_BROKERAGE', 'وساطة عقارية عامة غير حصرية', 3],
    ['sl-mkt-4', 'marketing_agreement', 'CO_BROKERAGE', 'تسويق مشترك مع شركة عقارية شقيقة', 4],
  ];

  for (const l of lookups) {
    insertLookup.run(l[0], l[1], l[2], l[3], l[4]);
  }
  console.log('[System Lookups Seed] Lookups seeded.');
}

/**
 * Seed initial administrative & employee users with secure hashed credentials
 */
export function seedUsersIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const defaultPassword = 'almasa2026';
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, username, email, password_hash, salt, name, role, role_title, avatar, phone, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const initialUsers = [
    {
      id: 'usr-admin',
      username: 'admin',
      email: 'admin@almasa.eg',
      name: 'السيد محسن',
      role: 'ADMIN',
      roleTitle: 'المدير العام',
      avatar: 'س',
      phone: '+20 100 000 0002',
    },
    {
      id: 'usr-exec',
      username: 'ahmed',
      email: 'ahmed.eissawi@almasa.eg',
      name: 'أحمد عيسوي',
      role: 'GENERAL_MANAGER',
      roleTitle: 'المدير التنفيذي',
      avatar: 'أ',
      phone: '+20 100 000 0001',
    },
    {
      id: 'usr-sales-mgr',
      username: 'mourad',
      email: 'mourad@almasa.eg',
      name: 'أحمد مراد',
      role: 'SALES_MANAGER',
      roleTitle: 'مدير المبيعات',
      avatar: 'أ',
      phone: '+20 100 444 5566',
    },
    {
      id: 'usr-sales-agent',
      username: 'samy',
      email: 'samy@almasa.eg',
      name: 'محمد سامي',
      role: 'SALES_AGENT',
      roleTitle: 'مسئول مبيعات التجمع',
      avatar: 'م',
      phone: '+20 100 111 2233',
    },
    {
      id: 'usr-acct',
      username: 'accountant',
      email: 'accountant@almasa.eg',
      name: 'خالد عبد الرازق',
      role: 'ACCOUNTANT',
      roleTitle: 'المحاسب المالي',
      avatar: 'خ',
      phone: '+20 100 555 6677',
    },
  ];

  for (const u of initialUsers) {
    const { hash, salt } = hashPassword(defaultPassword);
    insertUser.run(
      u.id,
      u.username,
      u.email,
      hash,
      salt,
      u.name,
      u.role,
      u.roleTitle,
      u.avatar,
      u.phone
    );
  }

  console.log('Almasa system users seeded with scrypt password encryption.');
}

/**
 * Seed initial real-world Egyptian real estate records if database is empty.
 */
function seedInitialDataIfEmpty() {
  const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (propertyCount.count > 0) {
    return; // Already initialized and persistent
  }

  console.log('Seeding SQLite database with initial Almasa Enterprise records...');

  const insertEmployee = db.prepare(`
    INSERT OR REPLACE INTO employees (id, name, role, role_title, phone, email, avatar, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialEmployees = [
    ['emp-1', 'أحمد عيسوي', 'EXECUTIVE_DIRECTOR', 'المدير التنفيذي', '+20 100 000 0001', 'ahmed.eissawi@almasa-realestate.eg', 'أ', 1],
    ['emp-2', 'السيد محسن', 'GENERAL_MANAGER', 'المدير العام', '+20 100 000 0002', 'elsayed.mohsen@almasa-realestate.eg', 'س', 1],
    ['ag-1', 'محمد سامي', 'SALES_AGENT', 'مسئول مبيعات التجمع', '+20 100 111 2233', 'm.samy@almasa-realestate.eg', 'م', 1],
    ['ag-2', 'أحمد مراد', 'SALES_MANAGER', 'مدير المبيعات', '+20 100 444 5566', 'a.mourad@almasa-realestate.eg', 'أ', 1],
    ['ag-3', 'سارة يوسف', 'SALES_AGENT', 'مستشار مبيعات الشيخ زايد', '+20 100 777 8899', 'sara.y@almasa-realestate.eg', 'س', 1],
    ['ag-4', 'محمود علي', 'SALES_DIRECTOR', 'مدير مبيعات التجمع الخامس', '+20 100 888 9900', 'm.ali@almasa-realestate.eg', 'م', 1],
  ];

  const seedTx = db.transaction(() => {
    // 1. Employees
    for (const emp of initialEmployees) {
      insertEmployee.run(...emp);
    }

    // 2. Owners
    const insertOwner = db.prepare(`
      INSERT INTO owners (
        id, name, phones_json, email, national_id, address, bank_account,
        commission_agreement_pct, notes, documents_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const o of INITIAL_OWNERS) {
      insertOwner.run(
        o.id,
        o.name,
        JSON.stringify(o.phones || []),
        o.email || '',
        o.nationalId || '',
        o.address || '',
        o.bankAccount || '',
        o.commissionAgreementPct || 2.5,
        o.notes || '',
        JSON.stringify(o.documents || []),
        o.createdAt || new Date().toISOString().split('T')[0]
      );
    }

    // 3. Properties
    const insertProp = db.prepare(`
      INSERT INTO properties (
        id, code, internal_id, title, type, purpose, status, governorate, city, district, address,
        map_lat, map_lng, price, negotiable, min_price, commission_pct, company_commission,
        owner_commission, area_sq_m, bedrooms, bathrooms, floor, finishing, parking, garden,
        pool, balcony, furniture, featured, images_json, video_url, tour360_url, owner_id,
        owner_name, owner_phone, documents_json, seo_title, seo_description, seo_keywords, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    for (const p of INITIAL_PROPERTIES) {
      insertProp.run(
        p.id,
        p.code,
        p.internalId,
        p.title,
        p.type,
        p.purpose,
        p.status,
        p.governorate,
        p.city,
        p.district,
        p.address,
        p.mapLat || 30.0275,
        p.mapLng || 31.4721,
        p.price,
        p.negotiable ? 1 : 0,
        p.minPrice || p.price,
        p.commissionPct || 2.5,
        p.companyCommission || Math.round(p.price * 0.025),
        p.ownerCommission || 0,
        p.areaSqM,
        p.bedrooms || 3,
        p.bathrooms || 2,
        p.floor || 1,
        p.finishing,
        p.parking ? 1 : 0,
        p.garden ? 1 : 0,
        p.pool ? 1 : 0,
        p.balcony ? 1 : 0,
        p.furniture ? 1 : 0,
        p.featured ? 1 : 0,
        JSON.stringify(p.images || []),
        p.videoUrl || null,
        p.tour360Url || null,
        p.ownerId || null,
        p.ownerName || '',
        p.ownerPhone || '',
        JSON.stringify(p.documents || []),
        p.seoTitle || '',
        p.seoDescription || '',
        p.seoKeywords || '',
        p.createdAt || new Date().toISOString().split('T')[0]
      );
    }

    // 4. Clients
    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, name, phone, secondary_phone, email, lead_status, lead_source,
        budget_min, budget_max, preferred_district, preferred_type,
        preferred_payment_method, assigned_agent_id, assigned_agent_name,
        reminder_date, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLog = db.prepare(`
      INSERT INTO communication_logs (id, client_id, owner_id, type, agent_name, date, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of INITIAL_CLIENTS) {
      insertClient.run(
        c.id,
        c.name,
        c.phone,
        c.secondaryPhone || '',
        c.email || '',
        c.leadStatus,
        c.leadSource,
        c.budgetMin || 0,
        c.budgetMax || 0,
        c.preferredDistrict || '',
        c.preferredType || 'شقة',
        c.preferredPaymentMethod || 'كاش',
        c.assignedAgentId || 'ag-1',
        c.assignedAgentName || 'محمد سامي',
        c.reminderDate || null,
        c.notes || '',
        c.createdAt || new Date().toISOString().split('T')[0]
      );

      if (c.communicationHistory && c.communicationHistory.length) {
        for (const log of c.communicationHistory) {
          insertLog.run(
            log.id || `log-${Date.now()}-${Math.random()}`,
            c.id,
            null,
            log.type,
            log.agentName,
            log.date,
            log.summary
          );
        }
      }
    }

    // 5. Viewings
    const insertViewing = db.prepare(`
      INSERT INTO viewings (
        id, property_id, property_title, property_code, client_id, client_name, client_phone,
        agent_id, agent_name, driver_name, vehicle, viewing_date, viewing_time,
        location_address, status, customer_feedback, result, follow_up_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const v of INITIAL_VIEWINGS) {
      insertViewing.run(
        v.id,
        v.propertyId,
        v.propertyTitle,
        v.propertyCode,
        v.clientId,
        v.clientName,
        v.clientPhone,
        v.agentId || 'ag-1',
        v.agentName,
        v.driverName || 'عم إبراهيم',
        v.vehicle || 'تويوتا فورتشنر',
        v.viewingDate,
        v.viewingTime,
        v.locationAddress,
        v.status,
        v.customerFeedback || '',
        v.result || '',
        v.followUpDate || '',
        new Date().toISOString().split('T')[0]
      );
    }

    // 6. Commissions
    const insertCommission = db.prepare(`
      INSERT INTO commissions (
        id, property_id, property_title, property_code, client_id, deal_amount,
        commission_pct, company_amount, employee_id, employee_name, employee_share_pct,
        employee_amount, manager_amount, status, date, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const com of INITIAL_COMMISSIONS) {
      insertCommission.run(
        com.id,
        com.propertyId,
        com.propertyTitle,
        com.propertyCode,
        null,
        com.dealAmount,
        com.commissionPct,
        com.companyAmount,
        'ag-2',
        com.employeeName,
        com.employeeSharePct,
        com.employeeAmount,
        com.managerAmount,
        com.status,
        com.date,
        'تسجيل عمولة نظام الماسة',
        new Date().toISOString().split('T')[0]
      );
    }

    // 7. Marketing Campaigns
    const insertCampaign = db.prepare(`
      INSERT INTO marketing_campaigns (
        id, name, platform, budget, spend, leads_count, deals_won,
        cost_per_lead, roi_pct, status, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cmp of INITIAL_CAMPAIGNS) {
      insertCampaign.run(
        cmp.id,
        cmp.name,
        cmp.platform,
        cmp.budget,
        cmp.spend,
        cmp.leadsCount,
        cmp.dealsWon,
        cmp.costPerLead,
        cmp.roiPct,
        cmp.status,
        cmp.startDate,
        cmp.endDate
      );
    }

    // 8. Tasks
    const insertTask = db.prepare(`
      INSERT INTO tasks (
        id, title, description, assigned_to_id, assigned_to_name,
        priority, deadline, status, category, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of INITIAL_TASKS) {
      insertTask.run(
        t.id,
        t.title,
        t.description,
        t.assignedToId,
        t.assignedToName,
        t.priority,
        t.deadline,
        t.status,
        t.category,
        t.createdAt || new Date().toISOString().split('T')[0]
      );
    }

    // 9. Accounting Transactions
    const insertTrx = db.prepare(`
      INSERT INTO transactions (
        id, date, type, category, amount, description, reference_no, cashbox_account
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const trx of INITIAL_TRANSACTIONS) {
      insertTrx.run(
        trx.id,
        trx.date,
        trx.type,
        trx.category,
        trx.amount,
        trx.description,
        trx.referenceNo,
        trx.cashboxAccount
      );
    }
  });

  seedTx();
  console.log('Almasa SQLite database successfully initialized and seeded.');
}
