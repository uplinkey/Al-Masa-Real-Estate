export type PropertyType =
  | 'شقة'
  | 'فيلا'
  | 'دوبلكس'
  | 'توين هاوس'
  | 'تاون هاوس'
  | 'بنتهاوس'
  | 'محل تجاري'
  | 'مكتب إداري'
  | 'عيادة طبية'
  | 'مخزن'
  | 'مصنع'
  | 'عمارة سكنية'
  | 'أرض سكنية'
  | 'أرض زراعية'
  | 'أرض صناعية';

export type PropertyPurpose = 'بيع' | 'إيجار';

export type PropertyStatus = 'متاح' | 'محجوز' | 'تم البيع' | 'تم التأجير' | 'مباع' | 'مخفي' | 'مؤرشف';

export type FinishingType = 'بدون تشطيب' | 'نصف تشطيب' | 'تشطيب كامل' | 'سوبر لوكس' | 'ألترا لوكس';

export interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Property {
  id: string;
  code: string;
  internalId: string;
  title: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  governorate: string;
  city: string;
  district: string;
  address: string;
  mapLat: number;
  mapLng: number;
  price: number;
  negotiable: boolean;
  minPrice?: number;
  commissionPct: number;
  companyCommission: number;
  ownerCommission: number;
  areaSqM: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  finishing: FinishingType;
  parking: boolean;
  garden: boolean;
  pool: boolean;
  balcony: boolean;
  furniture: boolean;
  featured: boolean;
  images: string[];
  videoUrl?: string;
  tour360Url?: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  documents: PropertyDocument[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  // Enhanced & Dynamic Fields
  propertyTypeCode?: string;
  legalStatus?: string;
  reconciliationStatus?: string;
  totalFloors?: number;
  unitFloor?: number;
  hasRoof?: boolean;
  hasElevator?: boolean;
  landShare?: boolean;
  finishingLevel?: string;
  furnishings?: string[];
  currency?: string;
  operationType?: string;
  marketingAgreement?: string;
  partnerCompanyName?: string;
  partnerCompanySharePct?: number;
  registeredByUserId?: string;
  registeredByName?: string;
  pendingChanges?: Record<string, any>;
  approvalStatus?: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  // Availability & Marketer Assignments (9 States)
  availabilityStatus?: UnitAvailabilityStatus;
  confirmationValidityDays?: number;
  lastConfirmedAt?: string;
  confirmationValidUntil?: string;
  assignedMarketerIds?: string[];
  assignedMarketerNames?: string[];
  dealClosingId?: string;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
}

export type UnitAvailabilityStatus =
  | 'متاحة ومؤكدة'
  | 'متاحة لكن تحتاج إعادة تأكيد'
  | 'لم يتم الرد من المالك'
  | 'تحت التفاوض'
  | 'محجوزة'
  | 'تم البيع'
  | 'تم التأجير'
  | 'موقوفة بطلب المالك'
  | 'غير متاحة لسبب آخر';

export interface PropertyOwner {
  id: string;
  name: string;
  phones: string[];
  email: string;
  nationalId: string;
  address: string;
  bankAccount: string;
  ownedPropertyIds: string[];
  commissionAgreementPct: number;
  documents: string[];
  communicationHistory: CommunicationLog[];
  // Follow-up & Brokerage Relationships
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  lastContactDate?: string;
  lastFollowupOutcome?: string;
  nextFollowupDate?: string;
  dealsWithOthers?: boolean;
  otherBrokersDetails?: string;
  marketingTerms?: string;
  notes: string;
  createdAt: string;
}

export type LeadStatus =
  | 'عميل جديد'
  | 'تم تسجيل الطلب'
  | 'جاري البحث'
  | 'تم إرسال عروض'
  | 'بانتظار الرد'
  | 'مهتم'
  | 'طلب معاينة'
  | 'تمت المعاينة'
  | 'رفض الوحدات'
  | 'يحتاج إعادة بحث'
  | 'لم يقرر بعد'
  | 'تمت الصفقة'
  | 'مغلق أو غير نشط'
  // Legacy compatibility:
  | 'تم التواصل'
  | 'معاينة محددة'
  | 'تفاوض'
  | 'حجز'
  | 'عقد موقع'
  | 'مباع'
  | 'مفقود';

export type LeadSource =
  | 'فيس بوك'
  | 'إنستجرام'
  | 'تيك توك'
  | 'جوجل'
  | 'توصية'
  | 'الموقع الإلكتروني'
  | 'أوليكس (OLX)'
  | 'دبيزل (Dubizzle)'
  | 'مباشر'
  | 'عميل مباشر للشركة'
  | 'مسوق داخلي'
  | 'مسوق خارجي'
  | 'عميل سابق'
  | 'شراكة وساطة';

export interface CommunicationLog {
  id: string;
  type: 'اتصال' | 'اجتماع' | 'معاينة' | 'واتساب' | 'بريد إلكتروني' | 'ملاحظة';
  agentName: string;
  date: string;
  summary: string;
}

export interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  whatsapp?: string;
  email?: string;
  leadStatus: LeadStatus;
  leadSource: LeadSource | string;
  originalSource?: string;
  sourceLocked?: boolean;
  sourceAuditNotes?: string;
  budgetMin: number;
  budgetMax: number;
  preferredDistrict: string;
  preferredType: PropertyType;
  preferredPaymentMethod: 'كاش' | 'تقسيط' | 'تمويل عقاري' | 'كاش أو تقسيط';
  communicationHistory: CommunicationLog[];
  assignedAgentId: string;
  assignedAgentName: string;
  assignedMarketerId?: string;
  assignedMarketerName?: string;
  coMarketerId?: string;
  coMarketerName?: string;
  reminderDate?: string;
  lastContactDate?: string;
  lastContactChannel?: string;
  notes: string;
  searchRequestsCount?: number;
  totalProposalsCount?: number;
  totalViewingsCount?: number;
  createdAt: string;
}

export interface PropertyViewing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCode: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  agentId: string;
  agentName: string;
  driverName?: string;
  vehicle?: string;
  meetingPoint?: string;
  durationMinutes?: number;
  multiUnitIds?: string[];
  multiUnitTitles?: string[];
  clientSource?: string;
  assignedMarketerId?: string;
  assignedMarketerName?: string;
  viewingDate: string;
  viewingTime: string;
  locationAddress: string;
  status: 'مجدولة' | 'مؤكدة' | 'جارية' | 'مكتملة' | 'ملغاة' | 'مؤجلة' | 'عدم حضور العميل';
  customerFeedback?: string;
  result?: 'مهتم بالشراء' | 'طلب تخفيض السعر' | 'غير مهتم' | 'طلب بديل' | 'موافق ومستعد للتعاقد' | 'طلب تفاوض' | 'مرفوض';
  rating?: number;
  rejectionReason?: string;
  noShowReason?: string;
  cancellationReason?: string;
  rescheduledFromId?: string;
  followUpDate?: string;
  createdAt?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  platform: 'Facebook' | 'Instagram' | 'Google Ads' | 'TikTok' | 'Snapchat';
  budget: number;
  spend: number;
  leadsCount: number;
  dealsWon: number;
  costPerLead: number;
  roiPct: number;
  status: 'نشطة' | 'مكتملة' | 'مسودة' | 'متوقفة';
  startDate: string;
  endDate: string;
}

export interface AppTask {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  priority: 'عالية جداً' | 'عالية' | 'متوسطة' | 'منخفضة';
  deadline: string;
  status: 'قيد الانتظار' | 'قيد التنفيذ' | 'مكتملة';
  category: 'اتصال' | 'معاينة' | 'توقيع عقد' | 'تسويق' | 'تحصيل';
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCode: string;
  dealAmount: number;
  commissionPct: number;
  companyAmount: number;
  employeeName: string;
  employeeSharePct: number;
  employeeAmount: number;
  managerAmount: number;
  status: 'تم التحصيل' | 'قيد التحصيل' | 'معلق';
  date: string;
}

export interface AccountingTransaction {
  id: string;
  date: string;
  type: 'إيراد' | 'مصروف';
  category: 'عمولات بيع' | 'عمولات إيجار' | 'إعلانات وتسويق' | 'رواتب ومكافآت' | 'إيجار مقر' | 'مصاريف معايانات' | 'أخرى';
  amount: number;
  description: string;
  referenceNo: string;
  cashboxAccount: 'الخزينة الرئيسية' | 'البنك الأهلي المصري' | 'بنك مصر' | 'CIB' | 'فودافون كاش';
}

export type UserRole =
  | 'ADMIN'
  | 'GENERAL_MANAGER'
  | 'SALES_MANAGER'
  | 'SALES_AGENT'
  | 'MARKETING_AGENT'
  | 'CUSTOMER_SERVICE'
  | 'PROPERTY_MANAGER'
  | 'VIEWING_COORDINATOR'
  | 'ACCOUNTANT'
  | 'OWNER'
  | 'CUSTOMER';

export interface UserRoleOption {
  key: UserRole;
  labelAr: string;
  description: string;
}

export interface ExecutiveStats {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  totalClients: number;
  activeLeads: number;
  todayCalls: number;
  todayMeetings: number;
  todayViewings: number;
  pendingTasks: number;
  totalRevenueEGP: number;
  companyCommissionEGP: number;
}

// --------------------------------------------------------------------------
// Centralized Enterprise RBAC & Permissions Types
// --------------------------------------------------------------------------
export type PermissionScope = 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'export'
  | 'print_reports'
  | 'view_financials'
  | 'manage_employees'
  | 'manage_permissions'
  | 'access_dept_reports'
  | 'access_general_reports';

export type PropertyEditAction =
  | 'edit_basic'
  | 'edit_location'
  | 'edit_specs'
  | 'edit_price'
  | 'edit_media'
  | 'edit_owner'
  | 'edit_status'
  | 'edit_marketing_deal'
  | 'edit_partner_company'
  | 'edit_commission';

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  managerName?: string;
  createdAt: string;
}

export interface SystemRoleModel {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  description: string;
  hierarchyLevel: number; // 1: Super Admin, 2: Exec, 3: Manager, 4: Supervisor, 5: Staff, 6: External/Partner
  isSystem: boolean;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  module: string;
  action: string;
  scope: PermissionScope;
  isAllowed: boolean;
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  userName?: string;
  module: string;
  action: string;
  scope: PermissionScope;
  isAllowed: boolean;
  validFrom?: string;
  validUntil?: string;
  reason?: string;
  grantedByUserId?: string;
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  roleTitle: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  isReadOnly?: boolean;
  avatar?: string;
  phone?: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

// --------------------------------------------------------------------------
// Dynamic Property Types & History Types
// --------------------------------------------------------------------------
export interface PropertyTypeConfig {
  id: string;
  code: string;
  name: string;
  category: 'residential' | 'commercial' | 'land' | 'investment';
  defaultPurpose: 'بيع' | 'إيجار' | 'مشاركة';
  requiredFields: string[];
  applicableFields: string[];
  isSystem: boolean;
  active: boolean;
  createdAt: string;
}

export interface PropertyHistoryRecord {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  propertyCode?: string;
  changedByUserId: string;
  changedByName: string;
  changeCategory: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedByUserId?: string;
  approvedByName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SystemLookup {
  id: string;
  category: string;
  code: string;
  label: string;
  isSystem: boolean;
  active: boolean;
  sortOrder: number;
}

// --------------------------------------------------------------------------
// Owner Follow-ups & Availability Confirmation Models
// --------------------------------------------------------------------------
export interface OwnerFollowupRecord {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  employeeId?: string;
  employeeName?: string;
  channel: 'اتصال هاتفي' | 'واتساب' | 'مقابلة شخصية' | 'زيارة ميدانية' | 'بريد إلكتروني';
  isAnswered: boolean;
  availabilityStatus: UnitAvailabilityStatus;
  priceChanged: boolean;
  oldPrice?: number;
  newPrice?: number;
  specsChanged?: boolean;
  newSpecsNotes?: string;
  isSoldOrRented?: boolean;
  dealType?: 'بيع' | 'تأجير';
  closedByOtherCompany?: boolean;
  otherBrokerName?: string;
  commissionAgreedPct?: number;
  notes: string;
  nextFollowupDate?: string;
  validityDays?: number;
  contactDate: string;
}

export interface FollowupTask {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  assignedToId: string;
  assignedToName: string;
  priority: 'عاجلة جداً' | 'مرتفعة' | 'متوسطة' | 'عادية';
  dueDate: string;
  taskDetails: string;
  status: 'قيد الانتظار' | 'مكتملة' | 'ملغاة';
  outcome?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByName?: string;
  reassignedFromId?: string;
  reassignedFromName?: string;
  reassignReason?: string;
  reassignCount?: number;
  createdAt: string;
}

export type ExternalDealStatus =
  | 'جديد'
  | 'قيد التحقيق'
  | 'تم تحديد مصدر المشتري'
  | 'مطالبة بالعمولة'
  | 'منتهي ومحفوظ';

export interface ExternalDealReport {
  id: string;
  reportNumber: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  dealType: 'بيع خارجي' | 'تأجير خارجي';
  dealDate: string;
  estimatedPrice?: number;
  buyerName?: string;
  buyerPhone?: string;
  buyerSourceMatched?: 'نعم' | 'لا' | 'محتمل' | 'غير معلوم';
  externalBrokerName?: string;
  externalBrokerPhone?: string;
  commissionClaimEligible?: boolean;
  commissionClaimAmount?: number;
  investigationStatus: ExternalDealStatus;
  investigationNotes?: string;
  reportedBy: string;
  reportedByUserId?: string;
  createdAt: string;
}

export interface DealClosing {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  dealType: 'بيع' | 'تأجير';
  dealDate: string;
  finalPrice: number;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientNationalId?: string;
  sellerOwnerId?: string;
  sellerOwnerName?: string;
  closerEmployeeId?: string;
  closerEmployeeName?: string;
  commissionTotal: number;
  companyShare: number;
  marketerShare: number;
  notes?: string;
  archiveAt: string;
  status: 'معتمدة' | 'ملغاة';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledByUserId?: string;
  cancelledByName?: string;
  createdAt: string;
}

// --------------------------------------------------------------------------
// CLIENT CRM 360, SEARCH REQUESTS & SMART MATCHING ENGINE TYPES
// --------------------------------------------------------------------------

export interface ClientSearchRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  requestTitle: string;
  propertyType: string;
  purpose: 'سكن' | 'استثمار' | 'تجاري' | 'إداري';
  budgetMin: number;
  budgetMax: number;
  city: string;
  district: string;
  subDistrict?: string;
  alternativeDistricts: string[];
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  preferredFloor?: string;
  acceptGroundFloor: boolean;
  acceptLastFloor: boolean;
  elevatorRequired: boolean;
  finishingStatus?: string;
  legalStatusRequired?: string;
  landShareRequired: boolean;
  paymentMethod: 'كاش' | 'تقسيط' | 'كاش أو تقسيط';
  downPaymentMax?: number;
  installmentYearsMax?: number;
  urgencyLevel: 'عاجل جداً (خلال أسبوع)' | 'خلال شهر' | 'متوسط الاستعجال' | 'استكشافي';
  additionalNotes?: string;
  status: 'نشط' | 'معلق' | 'مكتمل بنجاح' | 'ملغي';
  completenessScore: number;
  missingFields: string[];
  lastMatchedAt?: string;
  lastMatchedCount?: number;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchRequestHistoryRecord {
  id: string;
  requestId: string;
  clientId: string;
  changedByUserId: string;
  changedByName: string;
  changeReason: string;
  oldValues: any;
  newValues: any;
  newMatchesCount: number;
  removedMatchesCount: number;
  createdAt: string;
}

export interface MatchingOptions {
  scope: 'EXACT_DISTRICT' | 'DISTRICT_AND_NEARBY' | 'ALTERNATIVE_DISTRICTS' | 'ALL_CITY';
  budgetFlexibility: 'STRICT' | 'ALLOW_10_PCT' | 'ALLOW_20_PCT' | 'SUGGEST_LOWER';
  minScoreThreshold?: number; // default 50
}

export interface PropertyMatchResult {
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  price: number;
  district: string;
  type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  finishing?: string;
  matchScore: number; // 0 to 100 calculated
  matchReasons: string[];
  mismatchPoints: string[];
  priceComparison: {
    diffAmount: number;
    diffPct: number;
    isWithinBudget: boolean;
    label: string;
  };
  locationComparison: {
    isExactDistrict: boolean;
    isAlternative: boolean;
    label: string;
  };
  lastConfirmedAt?: string;
  availabilityStatus: string;
  priorHistoryState: 'لم تعرض سابقاً' | 'سبق عرضها' | 'رفضها العميل' | 'طلب معاينتها' | 'لم تعد مناسبة' | 'تغير سعرها أو مواصفاتها';
  images: string[];
}

export interface ReverseClientMatchResult {
  clientId: string;
  clientName: string;
  clientPhone: string;
  requestId: string;
  requestTitle: string;
  assignedAgentId: string;
  assignedAgentName: string;
  assignedMarketerId?: string;
  assignedMarketerName?: string;
  leadSource: string;
  matchScore: number;
  matchReasons: string[];
  mismatchPoints: string[];
  budgetMax: number;
  urgencyLevel: string;
  leadStatus: string;
  lastContactDate?: string;
  priorOfferedThisUnit: boolean;
  hasRejectedSimilar: boolean;
  lastViewingResult?: string;
}

export interface ClientProposal {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  requestId?: string;
  propertyId: string;
  propertyTitle: string;
  propertyCode: string;
  propertyPrice: number;
  channel: 'واتساب' | 'اتصال هاتفي' | 'مقابلة شخصية' | 'بريد إلكتروني';
  sentByUserId: string;
  sentByName: string;
  proposalText: string;
  approvalStatus: 'بانتظار موافقة الإدارة' | 'معتمد' | 'مرفوض إدارياً' | 'مؤجل';
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  clientReaction: string;
  clientFeedbackNotes?: string;
  sentAt: string;
}

export interface SourceDispute {
  id: string;
  clientId: string;
  clientName: string;
  claimedById: string;
  claimedByName: string;
  currentSource: string;
  disputedSource: string;
  reason: string;
  proofDetails?: string;
  status: 'قيد المراجعة الإدارية' | 'مقبول وتم تعديل المصدر' | 'مرفوض وتثبيت المصدر الأصلي' | 'تسوية مشتركة وتقاسم العمولة';
  resolutionNotes?: string;
  resolvedByUserId?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
}

// --------------------------------------------------------------------------
// PARTNER MARKETING COMPANIES & COMMISSION DISTRIBUTION SYSTEM
// --------------------------------------------------------------------------

export interface PartnerCompany {
  id: string;
  name: string;
  companyType: 'شركة تسويق عقاري' | 'وسيط مستقل' | 'مطور عقاري' | 'شريك استراتيجي';
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  commercialRegister?: string;
  taxNumber?: string;
  defaultCommissionSharePct: number;
  status: 'نشط' | 'معلق' | 'منتهي التعاقد';
  agreementStartDate: string;
  agreementEndDate?: string;
  termsNotes?: string;
  documentsJson?: string;
  totalUnitsSupplied: number;
  totalDealsClosed: number;
  totalCommissionClaimed: number;
  totalCommissionPaid: number;
  remainingCommission: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerUnitShare {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  partnerCompanyId: string;
  partnerCompanyName: string;
  sharePercentage: number;
  fixedAmount?: number;
  shareCondition: string;
  agreementDate: string;
  expirationDate?: string;
  registeredByUserId: string;
  registeredByName: string;
  status: 'معتمد' | 'بانتظار الاعتماد' | 'ملغي' | 'معدل';
  notes?: string;
  createdAt: string;
}

export interface RealEstateDeal {
  id: string;
  dealNumber: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientSource: string;
  propertySource: 'مالك مباشر' | 'شركة تسويق متعاونة' | 'وسيط خارجي' | 'شراكة متعددة';
  partnerCompanyId?: string;
  partnerCompanyName?: string;
  dealType: 'بيع' | 'إيجار' | 'إيجار مفروش' | 'مشاركة في أرض' | 'استثمار عقاري';
  dealPrice: number;
  agreedCommission: number;
  finalNegotiatedCommission: number;
  collectedAmount: number;
  remainingAmount: number;
  distributableAmount: number;
  totalPaidOut: number;
  dealDate: string;
  closingDate?: string;
  primaryAgentId: string;
  primaryAgentName: string;
  secondaryAgentId?: string;
  secondaryAgentName?: string;
  viewingAgentId?: string;
  viewingAgentName?: string;
  closerUserId: string;
  closerUserName: string;
  approvalStatus: 'مسودة' | 'بانتظار مراجعة الإدارة' | 'معتمدة' | 'مرفوضة';
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  contractDocumentUrl?: string;
  notes?: string;
  snapshotRulesJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionBeneficiarySplit {
  id: string;
  dealId: string;
  beneficiaryType: 'شركة تسويق متعاونة' | 'مسوق داخلي' | 'مسوق خارجي' | 'موظف معاينة' | 'موظف إتمام الصفقة' | 'حصة الشركة والاحتياطي' | 'شريك ملكية';
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryRole?: string;
  percentage: number;
  allocatedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'غير مستحق بعد' | 'معتمد للصرف' | 'مصروف جزئياً' | 'مصروف بالكامل' | 'معلق';
  approvedByUserId?: string;
  approvedByName?: string;
  deductionsAmount?: number;
  deductionReason?: string;
  notes?: string;
  createdAt: string;
}

export interface CommissionDisbursement {
  id: string;
  splitId: string;
  dealId: string;
  beneficiaryName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'تحويل بنكي' | 'شيك مصرفي' | 'خزينة نقدية (كاش)' | 'محفظة إلكترونية';
  receiptNumber: string;
  executedByUserId: string;
  executedByName: string;
  authorizedByUserId: string;
  authorizedByName: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface EquityPartner {
  id: string;
  name: string;
  nationalId?: string;
  phone: string;
  email?: string;
  equityPercentage: number;
  partnershipStartDate: string;
  status: 'نشط' | 'معلق' | 'منسحب';
  totalCapitalContributed: number;
  totalDividendsPaid: number;
  currentBalance: number;
  bankAccountDetails?: string;
  notes?: string;
  createdAt: string;
}

// --------------------------------------------------------------------------
// SMART PROPERTY LOCATION INTELLIGENCE
// --------------------------------------------------------------------------

export interface NearbyPlace {
  id: string;
  placeId?: string;
  name: string;
  category: 'تعليم' | 'صحة' | 'تسوق' | 'مواصلات' | 'ترفيه' | 'خدمات عامة';
  type: string;
  distanceMeters: number;
  distanceKm: number;
  distanceRoadMeters?: number;
  distanceFormatted: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  lat: number;
  lng: number;
  mapsUrl?: string;
  selectedForPublishing: boolean;
  customNote?: string;
}

export interface PropertyLocationIntelligence {
  id: string;
  propertyId: string;
  lat: number;
  lng: number;
  searchRadiusMeters: number;
  status: 'لم يتم البحث' | 'تم البحث' | 'بانتظار المراجعة' | 'تم تعديل الوصف' | 'معتمد' | 'يحتاج إلى تحديث';
  autoGeneratedDescriptionAr: string;
  reviewedDescriptionAr?: string;
  finalApprovedDescriptionAr?: string;
  placesFoundCount: number;
  selectedPlacesCount: number;
  placesJson: string; // JSON array of NearbyPlace
  reviewedByUserId?: string;
  reviewedByName?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  lastSearchedAt: string;
  createdAt: string;
  updatedAt: string;
}



