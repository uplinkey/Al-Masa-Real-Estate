import {
  Property,
  PropertyOwner,
  CustomerLead,
  PropertyViewing,
  AppTask,
  MarketingCampaign,
  CommissionRecord,
  AccountingTransaction,
  ExecutiveStats,
  OwnerFollowupRecord,
  FollowupTask,
  ExternalDealReport,
  DealClosing,
  ClientSearchRequest,
  PropertyMatchResult,
  ReverseClientMatchResult,
  ClientProposal,
  SourceDispute,
  MatchingOptions,
} from '../types';

let cachedToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('almasa_auth_token') : null;

export function setAuthToken(token: string | null) {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('almasa_auth_token', token);
    else localStorage.removeItem('almasa_auth_token');
  }
}

export function getAuthToken(): string | null {
  return cachedToken;
}

let currentActiveRole = 'ADMIN';
export function setActiveRoleHeader(role: string) {
  currentActiveRole = role;
}

let currentPreviewRole: string | null = null;
export function setPreviewRoleHeader(role: string | null) {
  currentPreviewRole = role;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }
  if (currentActiveRole) {
    headers.set('x-user-role', currentActiveRole);
  }
  if (currentPreviewRole) {
    headers.set('x-preview-role', currentPreviewRole);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    let message = 'حدث خطأ في معالجة الطلب مع الخادم';
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error) message = parsed.error;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  // Authentication & Users
  async login(identifier: string, passwordPlain: string) {
    const data = await request<{
      success: boolean;
      token: string;
      user: {
        id: string;
        username: string;
        email: string;
        name: string;
        role: string;
        roleTitle: string;
        avatar: string;
        phone: string;
        departmentId?: string;
        roleId?: string;
        dataScope?: string;
        mustChangePassword?: boolean;
        lastLogin: string;
      };
      allowedTabs: string[];
      permissions: Record<string, Record<string, boolean>>;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password: passwordPlain }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getMe() {
    return request<{
      user: any;
      allowedTabs: string[];
      permissions: Record<string, Record<string, boolean>>;
      dataScope: string;
      isPreviewMode: boolean;
    }>('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async requestForgotPassword(identifier: string, resetType: 'email' | 'phone') {
    return request<{ success: boolean; message: string; resetType: string; targetContact: string; code?: string }>(
      '/api/auth/forgot-password/request',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, resetType }),
      }
    );
  },

  async resetForgotPassword(tokenOrCode: string, newPassword: string) {
    return request<{ success: boolean; message: string }>('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ tokenOrCode, newPassword }),
    });
  },

  async getMyPermissions() {
    return request<{
      allowedTabs: string[];
      permissions: Record<string, Record<string, boolean>>;
      dataScope: string;
      isSuperAdmin: boolean;
    }>('/api/rbac/my-permissions');
  },

  async getUsers() {
    return request<any[]>('/api/auth/users');
  },

  async createUser(userData: {
    username: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    roleTitle?: string;
    departmentId?: string;
    roleId?: string;
    dataScope?: string;
    mustChangePassword?: boolean;
  }) {
    return request<{ success: boolean; message: string; userId: string }>('/api/rbac/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async adminResetPassword(userId: string, newPassword: string, mustChangePassword = true) {
    return request<{ success: boolean; message: string }>(`/api/rbac/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, mustChangePassword }),
    });
  },

  async toggleUserStatus(userId: string, active: boolean) {
    return request<{ success: boolean; message: string }>(`/api/rbac/users/${userId}/toggle-status`, {
      method: 'POST',
      body: JSON.stringify({ active }),
    });
  },

  async revokeUserSessions(userId: string) {
    return request<{ success: boolean; message: string }>(`/api/rbac/users/${userId}/revoke-sessions`, {
      method: 'POST',
    });
  },

  // Audit Logs
  async getAuditLogs(limit = 100) {
    return request<any[]>(`/api/audit-logs?limit=${limit}`);
  },

  // Database Backups
  async createBackup() {
    return request<{ success: boolean; message: string; backup: any }>('/api/backup', {
      method: 'POST',
    });
  },

  async getBackups() {
    return request<Array<{ fileName: string; sizeBytes: number; createdAt: string }>>('/api/backup');
  },

  // Real File Upload
  async uploadFile(filename: string, base64Data: string, category = 'property_image', entityId?: string) {
    return request<{ success: boolean; file: any; url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, base64Data, category, entityId }),
    });
  },

  // Export URL helper
  getExportUrl(entity: 'properties' | 'clients' | 'commissions' | 'transactions') {
    return `/api/export/${entity}`;
  },

  // System Health
  async getHealth() {
    return request<{
      status: string;
      database: string;
      sqliteVersion: string;
      counts: Record<string, number>;
    }>('/api/health');
  },

  // Stats
  async getStats(): Promise<ExecutiveStats> {
    return request<ExecutiveStats>('/api/stats');
  },

  // Properties
  async getProperties(query?: string): Promise<Property[]> {
    const url = query ? `/api/properties?query=${encodeURIComponent(query)}` : '/api/properties';
    return request<Property[]>(url);
  },

  async getPropertyById(id: string): Promise<Property> {
    return request<Property>(`/api/properties/${id}`);
  },

  async createProperty(property: Partial<Property>): Promise<Property> {
    return request<Property>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  },

  async updateProperty(id: string, updates: Partial<Property>, reason?: string): Promise<Property> {
    return request<Property>(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, reason }),
    });
  },

  async deleteProperty(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Owners
  async getOwners(): Promise<PropertyOwner[]> {
    return request<PropertyOwner[]>('/api/owners');
  },

  async createOwner(owner: Partial<PropertyOwner>): Promise<PropertyOwner> {
    return request<PropertyOwner>('/api/owners', {
      method: 'POST',
      body: JSON.stringify(owner),
    });
  },

  async updateOwner(id: string, updates: Partial<PropertyOwner>): Promise<PropertyOwner> {
    return request<PropertyOwner>(`/api/owners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Owner Follow-ups & Availability Confirmation
  async getOwnerFollowups(filters?: { propertyId?: string; ownerId?: string; employeeId?: string }): Promise<OwnerFollowupRecord[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<OwnerFollowupRecord[]>(`/api/owner-followups${qs}`);
  },

  async createOwnerFollowup(data: Partial<OwnerFollowupRecord>): Promise<OwnerFollowupRecord> {
    return request<OwnerFollowupRecord>('/api/owner-followups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Follow-up Tasks
  async getFollowupTasks(filters?: { assignedToId?: string; status?: string; priority?: string }): Promise<FollowupTask[]> {
    const params = new URLSearchParams();
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<FollowupTask[]>(`/api/followup-tasks${qs}`);
  },

  async createFollowupTask(data: Partial<FollowupTask>): Promise<FollowupTask> {
    return request<FollowupTask>('/api/followup-tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reassignFollowupTask(id: string, newAssignedToId: string, newAssignedToName: string, reason?: string): Promise<FollowupTask> {
    return request<FollowupTask>(`/api/followup-tasks/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ newAssignedToId, newAssignedToName, reason }),
    });
  },

  async completeFollowupTask(id: string, outcome?: string, followupId?: string): Promise<FollowupTask> {
    return request<FollowupTask>(`/api/followup-tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ outcome, followupId }),
    });
  },

  // External Deal Incident Reports
  async getExternalDeals(filters?: { propertyId?: string; status?: string }): Promise<ExternalDealReport[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.status) params.append('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ExternalDealReport[]>(`/api/external-deals${qs}`);
  },

  async createExternalDeal(data: Partial<ExternalDealReport>): Promise<ExternalDealReport> {
    return request<ExternalDealReport>('/api/external-deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateExternalDealInvestigation(id: string, updates: Partial<ExternalDealReport>): Promise<ExternalDealReport> {
    return request<ExternalDealReport>(`/api/external-deals/${id}/investigate`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Deal Closings & Reactivation
  async getDealClosings(): Promise<DealClosing[]> {
    return request<DealClosing[]>('/api/deal-closings');
  },

  async createDealClosing(data: Partial<DealClosing>): Promise<DealClosing> {
    return request<DealClosing>('/api/deal-closings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelDealClosing(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/deal-closings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async reactivateProperty(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/properties/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Marketing Dashboard Stats
  async getMarketingDashboardStats(): Promise<any> {
    return request<any>('/api/marketing-dashboard/stats');
  },

  // Clients
  async getClients(): Promise<CustomerLead[]> {
    return request<CustomerLead[]>('/api/clients');
  },

  async createClient(client: Partial<CustomerLead>): Promise<CustomerLead> {
    return request<CustomerLead>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  },

  async updateClient(id: string, updates: Partial<CustomerLead>): Promise<CustomerLead> {
    return request<CustomerLead>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addClientLog(clientId: string, log: { type: string; agentName: string; summary: string }) {
    return request<any>(`/api/clients/${clientId}/logs`, {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  async getClientProfile360(clientId: string): Promise<any> {
    return request<any>(`/api/clients/${clientId}/profile360`);
  },

  // Client Search Requests
  async getClientSearchRequests(filters?: { clientId?: string; status?: string; district?: string }): Promise<ClientSearchRequest[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.district) params.append('district', filters.district);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ClientSearchRequest[]>(`/api/client-search-requests${qs}`);
  },

  async getClientSearchRequestById(id: string): Promise<ClientSearchRequest> {
    return request<ClientSearchRequest>(`/api/client-search-requests/${id}`);
  },

  async createClientSearchRequest(data: Partial<ClientSearchRequest>): Promise<ClientSearchRequest> {
    return request<ClientSearchRequest>('/api/client-search-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClientSearchRequest(id: string, updates: Partial<ClientSearchRequest>, changeReason?: string): Promise<{
    request: ClientSearchRequest;
    matches: PropertyMatchResult[];
    newlyAppearedUnits: PropertyMatchResult[];
    droppedUnits: PropertyMatchResult[];
    newMatchesCount: number;
    removedMatchesCount: number;
  }> {
    return request<any>(`/api/client-search-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, changeReason }),
    });
  },

  async deleteClientSearchRequest(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/client-search-requests/${id}`, {
      method: 'DELETE',
    });
  },

  // Smart Matching Engine
  async getMatchesForRequest(requestId: string, options?: Partial<MatchingOptions>): Promise<PropertyMatchResult[]> {
    const params = new URLSearchParams();
    if (options?.scope) params.append('scope', options.scope);
    if (options?.budgetFlexibility) params.append('budgetFlexibility', options.budgetFlexibility);
    if (options?.minScoreThreshold) params.append('minScore', String(options.minScoreThreshold));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<PropertyMatchResult[]>(`/api/client-search-requests/${requestId}/matches${qs}`);
  },

  async matchPropertiesDirect(searchRequest: any, options?: Partial<MatchingOptions>): Promise<PropertyMatchResult[]> {
    return request<PropertyMatchResult[]>('/api/matching/properties-for-request', {
      method: 'POST',
      body: JSON.stringify({ request: searchRequest, options }),
    });
  },

  async getMatchedClientsForProperty(propertyId: string, minScore = 45): Promise<ReverseClientMatchResult[]> {
    return request<ReverseClientMatchResult[]>(`/api/properties/${propertyId}/matched-clients?minScore=${minScore}`);
  },

  // Client Proposals & WhatsApp Sharing
  async getClientProposals(filters?: { clientId?: string; propertyId?: string; approvalStatus?: string }): Promise<ClientProposal[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ClientProposal[]>(`/api/client-proposals${qs}`);
  },

  async createClientProposal(data: Partial<ClientProposal>): Promise<ClientProposal> {
    return request<ClientProposal>('/api/client-proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async batchApproveProposals(proposalIds: string[]): Promise<{ success: boolean; count: number }> {
    return request<{ success: boolean; count: number }>('/api/client-proposals/batch-approve', {
      method: 'POST',
      body: JSON.stringify({ proposalIds }),
    });
  },

  async updateProposalReaction(id: string, reaction: string, feedbackNotes?: string): Promise<ClientProposal> {
    return request<ClientProposal>(`/api/client-proposals/${id}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ reaction, feedbackNotes }),
    });
  },

  async getPropertyShareMessage(propertyId: string, clientId?: string, agentName?: string): Promise<{ message: string }> {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    if (agentName) params.append('agentName', agentName);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ message: string }>(`/api/properties/${propertyId}/share-message${qs}`);
  },

  // Source Disputes
  async getSourceDisputes(filters?: { clientId?: string; status?: string }): Promise<SourceDispute[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<SourceDispute[]>(`/api/source-disputes${qs}`);
  },

  async createSourceDispute(data: Partial<SourceDispute>): Promise<SourceDispute> {
    return request<SourceDispute>('/api/source-disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resolveSourceDispute(id: string, resolution: { status: string; notes: string; newSource?: string }): Promise<SourceDispute> {
    return request<SourceDispute>(`/api/source-disputes/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(resolution),
    });
  },

  // Viewings
  async getViewings(): Promise<PropertyViewing[]> {
    return request<PropertyViewing[]>('/api/viewings');
  },

  async createViewing(viewing: Partial<PropertyViewing>): Promise<PropertyViewing> {
    return request<PropertyViewing>('/api/viewings', {
      method: 'POST',
      body: JSON.stringify(viewing),
    });
  },

  async updateViewing(id: string, updates: Partial<PropertyViewing>): Promise<PropertyViewing> {
    return request<PropertyViewing>(`/api/viewings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Tasks
  async getTasks(): Promise<AppTask[]> {
    return request<AppTask[]>('/api/tasks');
  },

  async createTask(task: Partial<AppTask>): Promise<AppTask> {
    return request<AppTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: string, updates: Partial<AppTask>): Promise<AppTask> {
    return request<AppTask>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Campaigns
  async getCampaigns(): Promise<MarketingCampaign[]> {
    return request<MarketingCampaign[]>('/api/campaigns');
  },

  async createCampaign(campaign: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    return request<MarketingCampaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },

  // Commissions
  async getCommissions(): Promise<CommissionRecord[]> {
    return request<CommissionRecord[]>('/api/commissions');
  },

  async createCommission(commission: Partial<CommissionRecord>): Promise<CommissionRecord> {
    return request<CommissionRecord>('/api/commissions', {
      method: 'POST',
      body: JSON.stringify(commission),
    });
  },

  // Accounting Transactions
  async getTransactions(): Promise<AccountingTransaction[]> {
    return request<AccountingTransaction[]>('/api/accounting');
  },

  async createTransaction(transaction: Partial<AccountingTransaction>): Promise<AccountingTransaction> {
    return request<AccountingTransaction>('/api/accounting', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  // Property History & Approvals (Maker-Checker & Diff Recovery)
  async getPropertyHistory(propertyId: string) {
    return request<any[]>(`/api/properties/${propertyId}/history`);
  },

  async approvePropertyHistory(propertyId: string, historyId: string) {
    return request<{ success: boolean; message: string }>(`/api/properties/${propertyId}/history/${historyId}/approve`, {
      method: 'POST',
    });
  },

  async rejectPropertyHistory(propertyId: string, historyId: string, reason?: string) {
    return request<{ success: boolean; message: string }>(`/api/properties/${propertyId}/history/${historyId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async restorePropertyHistory(propertyId: string, historyId: string) {
    return request<{ success: boolean; message: string }>(`/api/properties/${propertyId}/history/${historyId}/restore`, {
      method: 'POST',
    });
  },

  // Dynamic Property Types & Lookups
  async getPropertyTypes() {
    return request<any[]>('/api/property-types');
  },

  async createPropertyType(data: any) {
    return request<any>('/api/property-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getLookups(category?: string) {
    const query = category ? `?category=${category}` : '';
    return request<any[]>(`/api/lookups${query}`);
  },

  async createLookup(data: any) {
    return request<any>('/api/lookups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Centralized Enterprise RBAC
  async getDepartments() {
    return request<any[]>('/api/rbac/departments');
  },

  async createDepartment(data: any) {
    return request<any>('/api/rbac/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDepartment(id: string, data: any) {
    return request<any>(`/api/rbac/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getRoles() {
    return request<any[]>('/api/rbac/roles');
  },

  async createRole(data: any) {
    return request<any>('/api/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRole(id: string, data: any) {
    return request<any>(`/api/rbac/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getRolePermissions(roleId: string) {
    return request<any[]>(`/api/rbac/roles/${roleId}/permissions`);
  },

  async updateRolePermissions(roleId: string, permissions: any[]) {
    return request<any[]>(`/api/rbac/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },

  async getUserOverrides(userId: string) {
    return request<any[]>(`/api/rbac/users/${userId}/overrides`);
  },

  async setUserOverride(userId: string, data: any) {
    return request<any[]>(`/api/rbac/users/${userId}/overrides`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeUserOverride(overrideId: string) {
    return request<{ success: boolean; message: string }>(`/api/rbac/users/overrides/${overrideId}`, {
      method: 'DELETE',
    });
  },

  async clonePermissions(fromType: string, fromId: string, toType: string, toId: string) {
    return request<{ success: boolean; count?: number; error?: string }>('/api/rbac/clone', {
      method: 'POST',
      body: JSON.stringify({ fromType, fromId, toType, toId }),
    });
  },

  async getRbacUsers() {
    return request<any[]>('/api/rbac/users');
  },

  async updateRbacUser(id: string, data: any) {
    return request<any>(`/api/rbac/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // Partner Marketing Companies & Unit Shares
  // --------------------------------------------------------------------------
  async getPartnerCompanies(): Promise<any[]> {
    return request<any[]>('/api/partner-companies');
  },

  async createPartnerCompany(data: any): Promise<any> {
    return request<any>('/api/partner-companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePartnerCompany(id: string, data: any): Promise<any> {
    return request<any>(`/api/partner-companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getPartnerUnitShares(propertyId?: string): Promise<any[]> {
    const qs = propertyId ? `?propertyId=${propertyId}` : '';
    return request<any[]>(`/api/partner-unit-shares${qs}`);
  },

  async addPartnerUnitShare(data: any): Promise<any> {
    return request<any>('/api/partner-unit-shares', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // Real Estate Deals & Commission Splits
  // --------------------------------------------------------------------------
  async getRealEstateDeals(filters?: { dealType?: string; approvalStatus?: string; partnerCompanyId?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.dealType) params.append('dealType', filters.dealType);
    if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    if (filters?.partnerCompanyId) params.append('partnerCompanyId', filters.partnerCompanyId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/api/real-estate-deals${qs}`);
  },

  async createRealEstateDeal(data: any): Promise<any> {
    return request<any>('/api/real-estate-deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordDealCollection(dealId: string, data: { amount: number; paymentMethod?: string; receiptNo?: string }): Promise<any> {
    return request<any>(`/api/real-estate-deals/${dealId}/collection`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async disburseCommissionSplit(splitId: string, data: { amount: number; paymentMethod?: string; receiptNumber?: string; notes?: string }): Promise<any> {
    return request<any>(`/api/commission-splits/${splitId}/disburse`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // Equity Partners
  // --------------------------------------------------------------------------
  async getEquityPartners(): Promise<any[]> {
    return request<any[]>('/api/equity-partners');
  },

  async createEquityPartner(data: any): Promise<any> {
    return request<any>('/api/equity-partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // Smart Property Location Intelligence
  // --------------------------------------------------------------------------
  async getPropertyLocationIntelligence(propertyId: string): Promise<any> {
    return request<any>(`/api/properties/${propertyId}/location-intelligence`);
  },

  async searchPropertyLocationIntelligence(propertyId: string, radiusMeters = 2000): Promise<any> {
    return request<any>(`/api/properties/${propertyId}/location-intelligence/search`, {
      method: 'POST',
      body: JSON.stringify({ radiusMeters }),
    });
  },

  async approvePropertyLocationIntelligence(propertyId: string, data: any): Promise<any> {
    return request<any>(`/api/properties/${propertyId}/location-intelligence/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async lookupNearbyPlaces(params: {
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    streetOrDistrict?: string;
  }): Promise<{
    lat: number;
    lng: number;
    radiusMeters: number;
    places: any[];
    description: string;
    totalPlaces: number;
  }> {
    return request<any>('/api/location/lookup-nearby', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
