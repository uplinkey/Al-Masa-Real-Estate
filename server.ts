import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initDatabase, db, UPLOADS_DIR, createDatabaseBackup, listDatabaseBackups } from './src/server/db.js';
import * as repo from './src/server/repository.js';

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing, AI Assistant will return simulated responses.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function startServer() {
  // 1. Initialize Relational Database Schema & Constraints
  initDatabase();

  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 15MB limit for attachments & image uploads
  app.use(express.json({ limit: '15mb' }));

  // Static uploads serving
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Request logger in dev
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Authentication & Session Context Middleware
  app.use((req: any, res, next) => {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    let user = null;

    if (authHeader) {
      const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : (authHeader as string);
      user = repo.getUserByToken(token);
    } else if (req.headers['x-user-id']) {
      user = repo.getUserById(req.headers['x-user-id'] as string);
    }

    // Role preview / simulation mode (Strictly restricted to Admin / Super Admin)
    const previewRole = req.headers['x-preview-role'] as string;
    if (previewRole && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      const roleMap: Record<string, string> = {
        ADMIN: 'usr-admin',
        GENERAL_MANAGER: 'usr-exec',
        SALES_MANAGER: 'usr-sales-mgr',
        SALES_AGENT: 'usr-sales-agent',
        ACCOUNTANT: 'usr-acct',
      };
      const simulatedUserId = roleMap[previewRole];
      if (simulatedUserId) {
        const simulatedUser = repo.getUserById(simulatedUserId);
        if (simulatedUser) {
          req.user = simulatedUser;
          req.isPreviewMode = true;
          return next();
        }
      }
    }

    // If no token provided, fallback to admin in dev if specifically requested or unauthenticated
    if (!user && req.headers['x-user-role']) {
      const roleMap: Record<string, string> = {
        ADMIN: 'usr-admin',
        GENERAL_MANAGER: 'usr-exec',
        SALES_MANAGER: 'usr-sales-mgr',
        SALES_AGENT: 'usr-sales-agent',
        ACCOUNTANT: 'usr-acct',
      };
      user = repo.getUserById(roleMap[req.headers['x-user-role'] as string] || 'usr-sales-agent');
    }

    req.user = user;
    next();
  });

  // Centralized Permission Verification Middleware (Deny-By-Default)
  const requirePermission = (module: string, action: string) => {
    return (req: any, res: any, next: any) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          error: 'يرجى تسجيل الدخول للوصول إلى هذا القسم (401 Unauthorized)',
          requiredPermission: { module, action },
        });
      }

      const perm = repo.getUserPermission(user, module, action);

      if (!perm.allowed) {
        repo.recordUnauthorizedAccess(user, module, action, req.ip || '127.0.0.1', {
          path: req.path,
          method: req.method,
        });

        return res.status(403).json({
          error: 'عملية غير مصرح بها (403 Forbidden)',
          details: perm.reason || `ليس لديك صلاحية [${action}] على قسم [${module}].`,
          requiredPermission: { module, action },
          user: { id: user?.id, username: user?.username, role: user?.role },
        });
      }

      req.permissionScope = perm.scope;
      next();
    };
  };

  // --------------------------------------------------------------------------
  // Authentication & User Management Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/auth/login', (req: any, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني وكلمة المرور مطلوبة' });
    }
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const result = repo.loginUser(identifier, password, ip);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json(result);
  });

  app.get('/api/auth/me', (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مسجل الدخول' });
    }
    const perms = repo.getUserEffectivePermissions(req.user);
    res.json({
      user: req.user,
      allowedTabs: perms.allowedTabs,
      permissions: perms.permissions,
      dataScope: perms.dataScope,
      isPreviewMode: Boolean(req.isPreviewMode),
    });
  });

  app.post('/api/auth/logout', (req: any, res) => {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    if (authHeader) {
      const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : (authHeader as string);
      repo.logoutUser(token);
    }
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  });

  // User Self Password Change
  app.post('/api/auth/change-password', (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية وكلمة المرور الجديدة مطلوبة' });
    }
    const result = repo.changeUserPassword(req.user.id, currentPassword, newPassword, req.ip || '127.0.0.1');
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Forgot Password: Request link or OTP
  app.post('/api/auth/forgot-password/request', (req: any, res) => {
    const { identifier, resetType = 'email' } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم، البريد، أو رقم الهاتف' });
    }
    const result = repo.requestPasswordReset(identifier, resetType, req.ip || '127.0.0.1');
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Forgot Password: Verify & Reset
  app.post('/api/auth/forgot-password/reset', (req: any, res) => {
    const { tokenOrCode, newPassword } = req.body;
    if (!tokenOrCode || !newPassword) {
      return res.status(400).json({ error: 'كود التحقق وكلمة المرور الجديدة مطلوبان' });
    }
    const result = repo.verifyAndResetPassword(tokenOrCode, newPassword, req.ip || '127.0.0.1');
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Current User Effective Permissions & Visible Navigation Tabs
  app.get('/api/rbac/my-permissions', (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مسجل الدخول' });
    }
    const perms = repo.getUserEffectivePermissions(req.user);
    res.json(perms);
  });

  app.get('/api/auth/users', (req: any, res) => {
    try {
      const users = repo.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  });

  // --------------------------------------------------------------------------
  // Audit Logs API
  // --------------------------------------------------------------------------
  app.get('/api/audit-logs', (req: any, res) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const logs = repo.getAuditLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  });

  // --------------------------------------------------------------------------
  // Real File Upload API (Supports Images & Property Documents)
  // --------------------------------------------------------------------------
  app.post('/api/upload', (req: any, res) => {
    try {
      const { filename, base64Data, category = 'property_image', entityId } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'اسم الملف وبيانات الملف بصيغة base64 مطلوبة' });
      }

      // Validate extension
      const ext = path.extname(filename).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({ error: `نوع الملف غير مسموح به. الأنواع المدعومة: ${allowedExts.join(', ')}` });
      }

      // Decode Base64 data
      const cleanBase64 = base64Data.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Max size: 12MB
      if (buffer.length > 12 * 1024 * 1024) {
        return res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (12 ميجابايت)' });
      }

      // Generate secure unique filename
      const safeRandom = crypto.randomBytes(8).toString('hex');
      const cleanBasename = path.basename(filename, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
      const storedFilename = `${Date.now()}_${safeRandom}_${cleanBasename}${ext}`;
      const filePath = path.join(UPLOADS_DIR, storedFilename);

      fs.writeFileSync(filePath, buffer);

      // Determine mime type
      let mimeType = 'application/octet-stream';
      if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const uploadedRecord = repo.recordUploadedFile({
        originalName: filename,
        storedFilename,
        filePath,
        mimeType,
        sizeBytes: buffer.length,
        category,
        entityId,
        uploadedBy: req.user ? req.user.name : 'مستخدم النظام',
      });

      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'FILE_UPLOAD',
        entityType: 'FILE',
        entityId: uploadedRecord.id,
        details: { filename, sizeBytes: buffer.length, category },
      });

      res.status(201).json({
        success: true,
        file: uploadedRecord,
        url: uploadedRecord.url,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'فشل حفظ الملف المرفوع في الخادم' });
    }
  });

  // --------------------------------------------------------------------------
  // Data Export Endpoints (Excel-Ready UTF-8 CSV)
  // --------------------------------------------------------------------------
  app.get('/api/export/:entity', (req: any, res) => {
    try {
      const entity = req.params.entity as 'properties' | 'clients' | 'commissions' | 'transactions';
      if (!['properties', 'clients', 'commissions', 'transactions'].includes(entity)) {
        return res.status(400).json({ error: 'كيان التصدير غير صالح' });
      }

      const csvData = repo.generateCsvExport(entity);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `almasa_${entity}_${dateStr}.csv`;

      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'DATA_EXPORT',
        entityType: entity.toUpperCase(),
        details: { entity, filename },
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (err: any) {
      console.error('Export error:', err);
      res.status(500).json({ error: 'فشل تصدير البيانات' });
    }
  });

  // --------------------------------------------------------------------------
  // Safe Online Database Backup Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/backup', async (req: any, res) => {
    try {
      const backupInfo = await createDatabaseBackup();
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'DATABASE_BACKUP_CREATED',
        entityType: 'SYSTEM',
        details: backupInfo,
      });
      res.status(201).json({
        success: true,
        message: 'تم إنشاء نسخة احتياطية آمنة لقاعدة البيانات بنجاح',
        backup: backupInfo,
      });
    } catch (err: any) {
      console.error('Backup error:', err);
      res.status(500).json({ error: 'فشل إنشاء النسخة الاحتياطية' });
    }
  });

  app.get('/api/backup', (req: any, res) => {
    try {
      const backups = listDatabaseBackups();
      res.json(backups);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع قائمة النسخ الاحتياطية' });
    }
  });

  // --------------------------------------------------------------------------
  // Health & Database Diagnostics API
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    try {
      const dbCheck = db.prepare('SELECT sqlite_version() as sqliteVersion').get() as { sqliteVersion: string };
      const propCount = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
      const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
      const ownerCount = db.prepare('SELECT COUNT(*) as count FROM owners').get() as { count: number };
      const viewingCount = db.prepare('SELECT COUNT(*) as count FROM viewings').get() as { count: number };
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };
      const backups = listDatabaseBackups();

      res.json({
        status: 'healthy',
        database: 'SQLite (Relational RDBMS with Foreign Keys & WAL Mode)',
        sqliteVersion: dbCheck.sqliteVersion,
        company: 'الماسة للتسويق العقاري - مصر',
        counts: {
          properties: propCount.count,
          clients: clientCount.count,
          owners: ownerCount.count,
          viewings: viewingCount.count,
          users: userCount.count,
          auditLogs: auditCount.count,
          backupsAvailable: backups.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // Executive Dashboard Stats (Computed live via SQL aggregates)
  // --------------------------------------------------------------------------
  app.get('/api/stats', (req, res) => {
    try {
      const stats = repo.getExecutiveStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to compute executive stats' });
    }
  });

  // --------------------------------------------------------------------------
  // Properties API (CRUD with Granular RBAC, Field-level Validation & History)
  // --------------------------------------------------------------------------
  app.get('/api/properties', (req: any, res) => {
    try {
      const { governorate, district, type, purpose, status, minPrice, maxPrice, query } = req.query;
      const properties = repo.getProperties({
        governorate: governorate as string,
        district: district as string,
        type: type as string,
        purpose: purpose as string,
        status: status as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        query: query as string,
      });
      res.json(properties);
    } catch (err: any) {
      console.error('Get properties error:', err);
      res.status(500).json({ error: 'Failed to retrieve properties' });
    }
  });

  app.get('/api/properties/:id', (req, res) => {
    try {
      const prop = repo.getPropertyById(req.params.id);
      if (!prop) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(prop);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve property' });
    }
  });

  app.post('/api/properties', requirePermission('properties', 'create'), (req: any, res) => {
    try {
      if (!req.body.title || !req.body.price) {
        return res.status(400).json({ error: 'عنوان العقار وسعر الوحدة حقول مطلوبة' });
      }
      const created = repo.createProperty(req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CREATE_PROPERTY',
        entityType: 'PROPERTY',
        entityId: created?.id,
        details: { title: created?.title, code: created?.code, price: created?.price },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create property error:', err);
      res.status(500).json({ error: 'Failed to create property in database' });
    }
  });

  app.put('/api/properties/:id', requirePermission('properties', 'edit'), (req: any, res) => {
    try {
      const existing = repo.getPropertyById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'العقار غير موجود' });
      }

      // Granular Field-Level Permission Check
      const fieldCheck = repo.checkFieldEditPermission(req.user, existing, req.body);
      if (!fieldCheck.allowed) {
        repo.recordUnauthorizedAccess(req.user, 'properties', fieldCheck.missingAction || 'edit', req.ip || '127.0.0.1', {
          propertyId: req.params.id,
          attemptedUpdates: Object.keys(req.body),
        });

        return res.status(403).json({
          error: 'عملية غير مصرح بها (403 Forbidden)',
          details: fieldCheck.error,
          missingAction: fieldCheck.missingAction,
        });
      }

      const reason = req.body._reason || req.body.reason || 'تعديل بيانات الوحدة';
      const updated = repo.updateProperty(req.params.id, req.body, req.user, reason);

      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'UPDATE_PROPERTY',
        entityType: 'PROPERTY',
        entityId: updated.id,
        details: req.body,
      });

      res.json(updated);
    } catch (err: any) {
      console.error('Update property error:', err);
      res.status(500).json({ error: 'Failed to update property' });
    }
  });

  app.delete('/api/properties/:id', requirePermission('properties', 'delete'), (req: any, res) => {
    try {
      const prop = repo.getPropertyById(req.params.id);
      const success = repo.deleteProperty(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Property not found' });
      }
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'DELETE_PROPERTY',
        entityType: 'PROPERTY',
        entityId: req.params.id,
        details: { title: prop?.title, code: prop?.code },
      });
      res.json({ success: true, message: 'Property deleted successfully' });
    } catch (err: any) {
      console.error('Delete property error:', err);
      res.status(500).json({ error: 'Failed to delete property' });
    }
  });

  // --------------------------------------------------------------------------
  // Property History & Value Restoration Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/properties/:id/history', (req: any, res) => {
    try {
      const history = repo.getPropertyHistory(req.params.id);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع سجل تاريخ الوحدة' });
    }
  });

  app.post('/api/properties/:id/history/:historyId/approve', requirePermission('properties', 'approve'), (req: any, res) => {
    try {
      const result = repo.approvePropertyHistory(req.params.historyId, req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل اعتماد التعديل' });
    }
  });

  app.post('/api/properties/:id/history/:historyId/reject', requirePermission('properties', 'reject'), (req: any, res) => {
    try {
      const result = repo.rejectPropertyHistory(req.params.historyId, req.user, req.body.reason);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل رفض التعديل' });
    }
  });

  app.post('/api/properties/:id/history/:historyId/restore', requirePermission('properties', 'edit'), (req: any, res) => {
    try {
      const result = repo.restorePropertyHistory(req.params.historyId, req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استعادة القيمة السابقة' });
    }
  });

  // --------------------------------------------------------------------------
  // Dynamic Property Types & Lookups Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/property-types', (req, res) => {
    try {
      const types = repo.getPropertyTypes();
      res.json(types);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع أنواع العقارات' });
    }
  });

  app.post('/api/property-types', requirePermission('properties', 'edit'), (req: any, res) => {
    try {
      if (!req.body.name || !req.body.code) {
        return res.status(400).json({ error: 'اسم ونوع العقار مطلوب' });
      }
      const created = repo.createPropertyType(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إضافة نوع العقار' });
    }
  });

  app.get('/api/lookups', (req: any, res) => {
    try {
      const lookups = repo.getLookups(req.query.category as string);
      res.json(lookups);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع قوائم النظام' });
    }
  });

  app.post('/api/lookups', requirePermission('properties', 'edit'), (req: any, res) => {
    try {
      const created = repo.createLookup(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إضافة الخيار' });
    }
  });

  // --------------------------------------------------------------------------
  // Centralized Enterprise RBAC API
  // --------------------------------------------------------------------------
  app.get('/api/rbac/departments', (req, res) => {
    try {
      const depts = repo.getDepartments();
      res.json(depts);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع الأقسام' });
    }
  });

  app.post('/api/rbac/departments', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      if (!req.body.name || !req.body.code) return res.status(400).json({ error: 'كود واسم القسم مطلوبان' });
      const created = repo.createDepartment(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إنشاء القسم' });
    }
  });

  app.put('/api/rbac/departments/:id', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const updated = repo.updateDepartment(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل تحديث بيانات القسم' });
    }
  });

  app.get('/api/rbac/roles', (req, res) => {
    try {
      const roles = repo.getRoles();
      res.json(roles);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع الأدوار' });
    }
  });

  app.post('/api/rbac/roles', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      if (!req.body.name || !req.body.code) return res.status(400).json({ error: 'كود واسم الدور مطلوبان' });
      const created = repo.createRole(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إنشاء الدور' });
    }
  });

  app.put('/api/rbac/roles/:id', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const updated = repo.updateRole(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل تحديث الدور' });
    }
  });

  app.get('/api/rbac/roles/:roleId/permissions', (req: any, res) => {
    try {
      const perms = repo.getRolePermissions(req.params.roleId);
      res.json(perms);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع صلاحيات الدور' });
    }
  });

  app.put('/api/rbac/roles/:roleId/permissions', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const updated = repo.updateRolePermissions(req.params.roleId, req.body.permissions || []);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'UPDATE_ROLE_PERMISSIONS',
        entityType: 'ROLE',
        entityId: req.params.roleId,
        details: { count: req.body.permissions?.length },
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل تحديث صلاحيات الدور' });
    }
  });

  app.get('/api/rbac/users/:userId/overrides', (req: any, res) => {
    try {
      const overrides = repo.getUserPermissionOverrides(req.params.userId);
      res.json(overrides);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع الاستثناءات' });
    }
  });

  app.post('/api/rbac/users/:userId/overrides', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const updated = repo.setUserPermissionOverride({ ...req.body, userId: req.params.userId }, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'USER_PERMISSION_OVERRIDE_SET',
        entityType: 'USER',
        entityId: req.params.userId,
        details: req.body,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل حفظ تخصيص الصلاحية' });
    }
  });

  app.delete('/api/rbac/users/overrides/:overrideId', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const success = repo.revokeUserPermissionOverride(req.params.overrideId);
      res.json({ success, message: 'تم سحب وإلغاء الاستثناء فوراً' });
    } catch (err: any) {
      res.status(500).json({ error: 'فشل سحب الاستثناء' });
    }
  });

  app.post('/api/rbac/clone', requirePermission('roles', 'manage_permissions'), (req: any, res) => {
    try {
      const { fromType, fromId, toType, toId } = req.body;
      const result = repo.clonePermissions(fromType, fromId, toType, toId, req.user?.id || 'usr-admin');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل نسخ الصلاحيات' });
    }
  });

  app.get('/api/rbac/users', (req, res) => {
    try {
      const users = repo.getAllUsersWithRoles();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع المستخدمين' });
    }
  });

  app.put('/api/rbac/users/:id', requirePermission('roles', 'manage_employees'), (req: any, res) => {
    try {
      const result = repo.updateUserWithRole(req.params.id, req.body, req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل تعديل المستخدم' });
    }
  });

  app.post('/api/rbac/users', requirePermission('roles', 'manage_employees'), (req: any, res) => {
    try {
      const result = repo.adminCreateUser(req.body, req.user);
      if (!result.success) return res.status(400).json(result);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إنشاء حساب المستخدم' });
    }
  });

  app.post('/api/rbac/users/:id/reset-password', requirePermission('roles', 'manage_employees'), (req: any, res) => {
    try {
      const { newPassword, mustChangePassword = true } = req.body;
      const result = repo.adminResetUserPassword(req.params.id, newPassword, Boolean(mustChangePassword), req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إعادة تعيين كلمة المرور' });
    }
  });

  app.post('/api/rbac/users/:id/toggle-status', requirePermission('roles', 'manage_employees'), (req: any, res) => {
    try {
      const { active } = req.body;
      const result = repo.adminToggleUserStatus(req.params.id, Boolean(active), req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل تغيير حالة الحساب' });
    }
  });

  app.post('/api/rbac/users/:id/revoke-sessions', requirePermission('roles', 'manage_employees'), (req: any, res) => {
    try {
      const result = repo.adminRevokeUserSessions(req.params.id, req.user);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل إلغاء الجلسات النشطة' });
    }
  });

  // --------------------------------------------------------------------------
  // Owners CRM API
  // --------------------------------------------------------------------------
  app.get('/api/owners', (req, res) => {
    try {
      const owners = repo.getOwners();
      res.json(owners);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get owners' });
    }
  });

  app.post('/api/owners', (req: any, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'اسم المالك مطلوب' });
      }
      const created = repo.createOwner(req.body);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CREATE_OWNER',
        entityType: 'OWNER',
        entityId: created?.id,
        details: { name: created?.name },
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create owner' });
    }
  });

  app.put('/api/owners/:id', (req: any, res) => {
    try {
      const updated = repo.updateOwner(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'المالك غير موجود' });
      }
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'UPDATE_OWNER',
        entityType: 'OWNER',
        entityId: updated.id,
        details: req.body,
      });
      res.json(updated);
    } catch (err: any) {
      console.error('Update owner error:', err);
      res.status(500).json({ error: 'فشل تعديل بيانات المالك' });
    }
  });

  // --------------------------------------------------------------------------
  // Owner Follow-ups & Availability Confirmation API
  // --------------------------------------------------------------------------
  app.get('/api/owner-followups', (req: any, res) => {
    try {
      const { propertyId, ownerId, employeeId } = req.query;
      const followups = repo.getOwnerFollowups({ propertyId, ownerId, employeeId });
      res.json(followups);
    } catch (err: any) {
      console.error('Get owner followups error:', err);
      res.status(500).json({ error: 'فشل استرجاع سجلات المتابعة' });
    }
  });

  app.post('/api/owner-followups', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.ownerId) {
        return res.status(400).json({ error: 'معرف العقار ومعرف المالك حقول إلزامية' });
      }
      const created = repo.createOwnerFollowup(req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'RECORD_OWNER_FOLLOWUP',
        entityType: 'OWNER_FOLLOWUP',
        entityId: created.id,
        details: {
          propertyId: req.body.propertyId,
          availabilityStatus: req.body.availabilityStatus,
          isAnswered: req.body.isAnswered,
          priceChanged: req.body.priceChanged,
        },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create owner followup error:', err);
      res.status(400).json({ error: err.message || 'فشل تسجيل المتابعة' });
    }
  });

  // --------------------------------------------------------------------------
  // Follow-up Tasks API (Assignments, Deadlines, Supervision)
  // --------------------------------------------------------------------------
  app.get('/api/followup-tasks', (req: any, res) => {
    try {
      const { assignedToId, status, priority } = req.query;
      const tasks = repo.getFollowupTasks({ assignedToId, status, priority });
      res.json(tasks);
    } catch (err: any) {
      console.error('Get followup tasks error:', err);
      res.status(500).json({ error: 'فشل استرجاع مهام المتابعة' });
    }
  });

  app.post('/api/followup-tasks', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.assignedToId || !req.body.dueDate) {
        return res.status(400).json({ error: 'معرف العقار، الموظف المسؤول، وتاريخ الاستحقاق حقول إلزامية' });
      }
      const created = repo.createFollowupTask(req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CREATE_FOLLOWUP_TASK',
        entityType: 'FOLLOWUP_TASK',
        entityId: created.id,
        details: { propertyId: req.body.propertyId, assignedToId: req.body.assignedToId, dueDate: req.body.dueDate },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create followup task error:', err);
      res.status(400).json({ error: err.message || 'فشل إنشاء مهمة المتابعة' });
    }
  });

  app.post('/api/followup-tasks/:id/reassign', (req: any, res) => {
    try {
      const { newAssignedToId, newAssignedToName, reason } = req.body;
      if (!newAssignedToId || !newAssignedToName) {
        return res.status(400).json({ error: 'الموظف البديل وسبب إعادة التعيين مطلوبان' });
      }
      const updated = repo.reassignFollowupTask(req.params.id, newAssignedToId, newAssignedToName, req.user, reason);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'REASSIGN_FOLLOWUP_TASK',
        entityType: 'FOLLOWUP_TASK',
        entityId: req.params.id,
        details: { newAssignedToId, newAssignedToName, reason },
      });
      res.json(updated);
    } catch (err: any) {
      console.error('Reassign task error:', err);
      res.status(400).json({ error: err.message || 'فشل إعادة إسناد المهمة' });
    }
  });

  app.post('/api/followup-tasks/:id/complete', (req: any, res) => {
    try {
      const { outcome, followupId } = req.body;
      const updated = repo.completeFollowupTask(req.params.id, outcome || 'تم إنجاز المتابعة بنجاح', req.user, followupId);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'COMPLETE_FOLLOWUP_TASK',
        entityType: 'FOLLOWUP_TASK',
        entityId: req.params.id,
        details: { outcome, followupId },
      });
      res.json(updated);
    } catch (err: any) {
      console.error('Complete task error:', err);
      res.status(400).json({ error: err.message || 'فشل إكمال المهمة' });
    }
  });

  // --------------------------------------------------------------------------
  // External Deal Incident Reports & Investigation Workflow API
  // --------------------------------------------------------------------------
  app.get('/api/external-deals', (req: any, res) => {
    try {
      const { propertyId, status } = req.query;
      const reports = repo.getExternalDealReports({ propertyId, status });
      res.json(reports);
    } catch (err: any) {
      console.error('Get external deals error:', err);
      res.status(500).json({ error: 'فشل استرجاع بلاغات الصفقات الخارجية' });
    }
  });

  app.post('/api/external-deals', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.dealType) {
        return res.status(400).json({ error: 'معرف العقار ونوع الصفقة حقول مطلوبة' });
      }
      const created = repo.createExternalDealReport(req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'REPORT_EXTERNAL_DEAL',
        entityType: 'EXTERNAL_DEAL_REPORT',
        entityId: created.id,
        details: {
          reportNumber: created.reportNumber,
          propertyId: req.body.propertyId,
          dealType: req.body.dealType,
          reportedBy: req.body.reportedBy,
        },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create external deal report error:', err);
      res.status(400).json({ error: err.message || 'فشل تسجيل البلاغ الخارجي' });
    }
  });

  app.put('/api/external-deals/:id/investigate', (req: any, res) => {
    try {
      const updated = repo.updateExternalDealInvestigation(req.params.id, req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'INVESTIGATE_EXTERNAL_DEAL',
        entityType: 'EXTERNAL_DEAL_REPORT',
        entityId: req.params.id,
        details: req.body,
      });
      res.json(updated);
    } catch (err: any) {
      console.error('Investigate external deal error:', err);
      res.status(400).json({ error: err.message || 'فشل تحديث مجريات التحقيق' });
    }
  });

  // --------------------------------------------------------------------------
  // Internal Deal Closings & 24-Hour Archival Workflow API
  // --------------------------------------------------------------------------
  app.get('/api/deal-closings', (req: any, res) => {
    try {
      const closings = repo.getDealClosings();
      res.json(closings);
    } catch (err: any) {
      console.error('Get deal closings error:', err);
      res.status(500).json({ error: 'فشل استرجاع الصفقات المعتمدة' });
    }
  });

  app.post('/api/deal-closings', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.dealType || !req.body.finalPrice || !req.body.clientName) {
        return res.status(400).json({ error: 'معرف العقار، نوع الصفقة، السعر النهائي، واسم العميل حقول مطلوبة' });
      }
      const created = repo.createDealClosing(req.body, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CLOSE_DEAL',
        entityType: 'DEAL_CLOSING',
        entityId: created.id,
        details: { propertyId: req.body.propertyId, dealType: req.body.dealType, finalPrice: req.body.finalPrice },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create deal closing error:', err);
      res.status(400).json({ error: err.message || 'فشل اعتماد الصفقة' });
    }
  });

  app.post('/api/deal-closings/:id/cancel', (req: any, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'سبب الإلغاء إلزامي' });
      }
      const result = repo.cancelDealClosing(req.params.id, reason, req.user);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CANCEL_DEAL_CLOSING',
        entityType: 'DEAL_CLOSING',
        entityId: req.params.id,
        details: { reason },
      });
      res.json(result);
    } catch (err: any) {
      console.error('Cancel deal closing error:', err);
      res.status(400).json({ error: err.message || 'فشل إلغاء الصفقة' });
    }
  });

  app.post('/api/properties/:id/reactivate', (req: any, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'سبب إعادة التفعيل الإداري إلزامي' });
      }
      const result = repo.reactivatePropertyAfterReview(req.params.id, req.user, reason);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'REACTIVATE_PROPERTY',
        entityType: 'PROPERTY',
        entityId: req.params.id,
        details: { reason },
      });
      res.json(result);
    } catch (err: any) {
      console.error('Reactivate property error:', err);
      res.status(400).json({ error: err.message || 'فشل إعادة تفعيل العقار' });
    }
  });

  // --------------------------------------------------------------------------
  // Marketing & Availability Comprehensive Analytics Dashboard API
  // --------------------------------------------------------------------------
  app.get('/api/marketing-dashboard/stats', (req: any, res) => {
    try {
      const stats = repo.getMarketingDashboardStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Marketing stats error:', err);
      res.status(500).json({ error: 'فشل إحصائيات لوحة التسويق' });
    }
  });

  // --------------------------------------------------------------------------
  // Customer CRM 360 & Leads API
  // --------------------------------------------------------------------------
  app.get('/api/clients', requirePermission('clients', 'view'), (req: any, res) => {
    try {
      const clients = repo.getClients(req.user, req.permissionScope);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع بيانات العملاء' });
    }
  });

  app.get('/api/clients/:id/profile360', (req, res) => {
    try {
      const profile = repo.getClientProfile360(req.params.id);
      res.json(profile);
    } catch (err: any) {
      console.error('Get profile 360 error:', err);
      res.status(404).json({ error: err.message || 'فشل استرجاع الملف المتكامل للعميل' });
    }
  });

  app.post('/api/clients', (req: any, res) => {
    try {
      if (!req.body.name || !req.body.phone) {
        return res.status(400).json({ error: 'اسم العميل ورقم الهاتف حقول مطلوبة' });
      }
      const created = repo.createClient(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create client error:', err);
      res.status(400).json({ error: err.message || 'فشل تسجيل العميل في قاعدة البيانات' });
    }
  });

  app.put('/api/clients/:id', (req: any, res) => {
    try {
      const updated = repo.updateClient(req.params.id, req.body, req.user);
      if (!updated) {
        return res.status(404).json({ error: 'العميل غير موجود' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Update client error:', err);
      res.status(400).json({ error: err.message || 'فشل تعديل بيانات العميل' });
    }
  });

  app.post('/api/clients/:id/logs', (req: any, res) => {
    try {
      const log = repo.addCommunicationLog({
        clientId: req.params.id,
        type: req.body.type || 'ملاحظة',
        agentName: req.body.agentName || (req.user ? req.user.name : 'النظام'),
        summary: req.body.summary || 'سجل تواصل',
        date: req.body.date,
      });
      res.status(201).json(log);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add communication log' });
    }
  });

  // --------------------------------------------------------------------------
  // Client Search Requests & Dynamic Matching Engine API
  // --------------------------------------------------------------------------
  app.get('/api/client-search-requests', (req: any, res) => {
    try {
      const { clientId, status, district } = req.query;
      const requests = repo.getClientSearchRequests({ clientId, status, district });
      res.json(requests);
    } catch (err: any) {
      console.error('Get search requests error:', err);
      res.status(500).json({ error: 'فشل استرجاع طلبات البحث' });
    }
  });

  app.get('/api/client-search-requests/:id', (req, res) => {
    try {
      const request = repo.getClientSearchRequestById(req.params.id);
      if (!request) return res.status(404).json({ error: 'طلب البحث غير موجود' });
      res.json(request);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع طلب البحث' });
    }
  });

  app.post('/api/client-search-requests', (req: any, res) => {
    try {
      const clientId = req.body.clientId || req.body.client_id;
      if (!clientId) {
        return res.status(400).json({ error: 'معرف العميل حقل إلزامي لإنشاء طلب بحث' });
      }
      const payload = {
        ...req.body,
        clientId,
        clientName: req.body.clientName || req.body.client_name,
        clientPhone: req.body.clientPhone || req.body.client_phone,
        requestTitle: req.body.requestTitle || req.body.request_title,
        propertyType: req.body.propertyType || req.body.property_type,
        purpose: req.body.purpose,
        budgetMin: req.body.budgetMin !== undefined ? req.body.budgetMin : req.body.min_budget,
        budgetMax: req.body.budgetMax !== undefined ? req.body.budgetMax : req.body.max_budget,
        city: req.body.city || req.body.preferred_city,
        district: req.body.district || req.body.preferred_district,
        subDistrict: req.body.subDistrict || req.body.sub_district,
        alternativeDistricts: req.body.alternativeDistricts || req.body.alternative_districts,
        minArea: req.body.minArea !== undefined ? req.body.minArea : req.body.min_area_sqm,
        maxArea: req.body.maxArea !== undefined ? req.body.maxArea : req.body.max_area_sqm,
        minBedrooms: req.body.minBedrooms !== undefined ? req.body.minBedrooms : req.body.min_bedrooms,
        minBathrooms: req.body.minBathrooms !== undefined ? req.body.minBathrooms : req.body.min_bathrooms,
        finishingStatus: req.body.finishingStatus || req.body.finishing_level,
        paymentMethod: req.body.paymentMethod || req.body.payment_method,
        urgencyLevel: req.body.urgencyLevel || req.body.urgency_level,
      };
      const created = repo.createClientSearchRequest(payload, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create search request error:', err);
      res.status(400).json({ error: err.message || 'فشل إنشاء طلب البحث' });
    }
  });

  app.put('/api/client-search-requests/:id', (req: any, res) => {
    try {
      const payload = {
        ...req.body,
        budgetMin: req.body.budgetMin !== undefined ? req.body.budgetMin : req.body.min_budget,
        budgetMax: req.body.budgetMax !== undefined ? req.body.budgetMax : req.body.max_budget,
        city: req.body.city || req.body.preferred_city,
        district: req.body.district || req.body.preferred_district,
        changeReason: req.body.changeReason || req.body.change_reason,
      };
      const result = repo.updateClientSearchRequest(req.params.id, payload, req.user, payload.changeReason);
      res.json(result);
    } catch (err: any) {
      console.error('Update search request error:', err);
      res.status(400).json({ error: err.message || 'فشل تعديل طلب البحث' });
    }
  });

  app.delete('/api/client-search-requests/:id', (req: any, res) => {
    try {
      const deleted = repo.deleteClientSearchRequest(req.params.id, req.user);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: 'فشل حذف طلب البحث' });
    }
  });

  app.get('/api/client-search-requests/:id/matches', (req: any, res) => {
    try {
      const { scope, budgetFlexibility, minScore } = req.query;
      const matches = repo.matchPropertiesForRequest(req.params.id, {
        scope: scope || 'DISTRICT_AND_NEARBY',
        budgetFlexibility: budgetFlexibility || 'ALLOW_10_PCT',
        minScoreThreshold: minScore ? Number(minScore) : 40,
      });
      res.json(matches);
    } catch (err: any) {
      console.error('Matching properties error:', err);
      res.status(500).json({ error: 'فشل تشغيل محرك المطابقة' });
    }
  });

  app.post('/api/matching/properties-for-request', (req: any, res) => {
    try {
      const matches = repo.matchPropertiesForRequest(req.body.request, req.body.options);
      res.json(matches);
    } catch (err: any) {
      console.error('Matching on-the-fly error:', err);
      res.status(400).json({ error: err.message || 'فشل مطابقة الوحدات للطلب' });
    }
  });

  app.get('/api/properties/:id/matched-clients', (req: any, res) => {
    try {
      const minScore = req.query.minScore ? Number(req.query.minScore) : 45;
      const clients = repo.matchClientsForProperty(req.params.id, minScore);
      res.json(clients);
    } catch (err: any) {
      console.error('Reverse matching error:', err);
      res.status(500).json({ error: 'فشل محرك المطابقة العكسية' });
    }
  });

  // --------------------------------------------------------------------------
  // Client Property Proposals & WhatsApp Sharing API
  // --------------------------------------------------------------------------
  app.get('/api/client-proposals', (req: any, res) => {
    try {
      const { clientId, propertyId, approvalStatus } = req.query;
      const proposals = repo.getClientProposals({ clientId, propertyId, approvalStatus });
      res.json(proposals);
    } catch (err: any) {
      console.error('Get proposals error:', err);
      res.status(500).json({ error: 'فشل استرجاع عروض الوحدات' });
    }
  });

  app.post('/api/client-proposals', (req: any, res) => {
    try {
      if (!req.body.clientId || !req.body.propertyId) {
        return res.status(400).json({ error: 'معرف العميل ومعرف العقار حقول إلزامية' });
      }
      const created = repo.createClientProposal(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create proposal error:', err);
      res.status(400).json({ error: err.message || 'فشل تسجيل العرض العقاري' });
    }
  });

  app.post('/api/client-proposals/batch-approve', (req: any, res) => {
    try {
      const { proposalIds, proposals } = req.body;
      if (Array.isArray(proposals) && proposals.length > 0) {
        // Create multiple proposals in batch and approve them
        let count = 0;
        for (const item of proposals) {
          try {
            repo.createClientProposal({
              clientId: item.client_id || item.clientId,
              propertyId: item.property_id || item.propertyId,
              requestId: item.search_request_id || item.requestId,
              channel: item.share_channel || item.channel || 'واتساب',
              offeredPrice: item.offered_price || item.offeredPrice,
              clientFeedbackNotes: item.internal_notes || item.clientFeedbackNotes,
            }, req.user);
            count++;
          } catch (e) {
            console.warn('Batch item creation warning:', e);
          }
        }
        return res.json({ success: true, count, created_count: count });
      }

      if (!Array.isArray(proposalIds) || !proposalIds.length) {
        return res.status(400).json({ error: 'قائمة معرفات العروض أو بيانات المقترحات مطلوبة' });
      }
      const result = repo.batchApproveProposals(proposalIds, req.user);
      res.json({ ...result, created_count: result.count });
    } catch (err: any) {
      console.error('Batch approve error:', err);
      res.status(400).json({ error: err.message || 'فشل اعتماد العروض' });
    }
  });

  app.put('/api/client-proposals/:id/reaction', (req: any, res) => {
    try {
      const { reaction, feedbackNotes } = req.body;
      if (!reaction) return res.status(400).json({ error: 'رد العميل إلزامي' });
      const updated = repo.updateProposalReaction(req.params.id, reaction, feedbackNotes, req.user);
      res.json(updated);
    } catch (err: any) {
      console.error('Update proposal reaction error:', err);
      res.status(400).json({ error: err.message || 'فشل تحديث رد العميل' });
    }
  });

  app.get('/api/properties/:id/share-message', (req: any, res) => {
    try {
      const { clientId, agentName } = req.query;
      const message = repo.generatePropertyShareMessage(req.params.id, clientId, agentName);
      res.json({ message });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل صياغة رسالة المشاركة' });
    }
  });

  // --------------------------------------------------------------------------
  // Client Source Disputes & Arbitration API
  // --------------------------------------------------------------------------
  app.get('/api/source-disputes', (req: any, res) => {
    try {
      const { clientId, status } = req.query;
      const disputes = repo.getSourceDisputes({ clientId, status });
      res.json(disputes);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع طلبات نزاع المصدر' });
    }
  });

  app.post('/api/source-disputes', (req: any, res) => {
    try {
      if (!req.body.clientId || !req.body.disputedSource || !req.body.reason) {
        return res.status(400).json({ error: 'معرف العميل، المصدر المدعى به، وسبب النزاع حقول إلزامية' });
      }
      const created = repo.createSourceDispute(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create dispute error:', err);
      res.status(400).json({ error: err.message || 'فشل تقديم طلب النزاع' });
    }
  });

  app.put('/api/source-disputes/:id/resolve', (req: any, res) => {
    try {
      const { status, notes, newSource } = req.body;
      if (!status || !notes) {
        return res.status(400).json({ error: 'قرار الفصل وملاحظات القرار حقول مطلوبة' });
      }
      const resolved = repo.resolveSourceDispute(req.params.id, { status, notes, newSource }, req.user);
      res.json(resolved);
    } catch (err: any) {
      console.error('Resolve dispute error:', err);
      res.status(400).json({ error: err.message || 'فشل البت في نزاع المصدر' });
    }
  });

  // --------------------------------------------------------------------------
  // Field Viewings API
  // --------------------------------------------------------------------------
  app.get('/api/viewings', requirePermission('viewings', 'view'), (req: any, res) => {
    try {
      const viewings = repo.getViewings(req.user, req.permissionScope);
      res.json(viewings);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get viewings' });
    }
  });

  app.post('/api/viewings', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.viewingDate) {
        return res.status(400).json({ error: 'معرف العقار وموعد المعاينة حقول مطلوبة' });
      }
      const created = repo.createViewing(req.body);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'SCHEDULE_VIEWING',
        entityType: 'VIEWING',
        entityId: created?.id,
        details: { propertyCode: created?.propertyCode, clientName: created?.clientName, date: created?.viewingDate },
      });
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create viewing error:', err);
      res.status(400).json({ error: err.message || 'Failed to create viewing' });
    }
  });

  app.put('/api/viewings/:id', (req: any, res) => {
    try {
      const updated = repo.updateViewing(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Viewing not found' });
      }
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'UPDATE_VIEWING',
        entityType: 'VIEWING',
        entityId: updated.id,
        details: req.body,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update viewing' });
    }
  });

  // --------------------------------------------------------------------------
  // Tasks API
  // --------------------------------------------------------------------------
  app.get('/api/tasks', (req, res) => {
    try {
      const tasks = repo.getTasks();
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  });

  app.post('/api/tasks', (req: any, res) => {
    try {
      if (!req.body.title) {
        return res.status(400).json({ error: 'عنوان المهمة مطلوب' });
      }
      const created = repo.createTask(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.put('/api/tasks/:id', (req: any, res) => {
    try {
      const updated = repo.updateTask(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // --------------------------------------------------------------------------
  // Marketing Campaigns API
  // --------------------------------------------------------------------------
  app.get('/api/campaigns', (req, res) => {
    try {
      const campaigns = repo.getCampaigns();
      res.json(campaigns);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get campaigns' });
    }
  });

  app.post('/api/campaigns', (req: any, res) => {
    try {
      const created = repo.createCampaign(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  // --------------------------------------------------------------------------
  // Commissions & Contracts API
  // --------------------------------------------------------------------------
  app.get('/api/commissions', requirePermission('commissions', 'view'), (req: any, res) => {
    try {
      const commissions = repo.getCommissions(req.user, req.permissionScope);
      res.json(commissions);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get commissions' });
    }
  });

  app.post('/api/commissions', requirePermission('commissions', 'create'), (req: any, res) => {
    try {
      const created = repo.createCommission(req.body);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'RECORD_COMMISSION',
        entityType: 'COMMISSION',
        entityId: created?.id,
        details: { propertyCode: created?.propertyCode, dealAmount: created?.dealAmount, companyAmount: created?.companyAmount },
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record commission' });
    }
  });

  // --------------------------------------------------------------------------
  // Accounting Transactions API
  // --------------------------------------------------------------------------
  app.get('/api/accounting', requirePermission('financials', 'view'), (req: any, res) => {
    try {
      const txs = repo.getTransactions();
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get accounting transactions' });
    }
  });

  app.post('/api/accounting', (req: any, res) => {
    try {
      const created = repo.createTransaction(req.body);
      repo.recordAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'RECORD_TRANSACTION',
        entityType: 'ACCOUNTING',
        entityId: created?.id,
        details: { type: created?.type, amount: created?.amount, category: created?.category },
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // --------------------------------------------------------------------------
  // Employees API
  // --------------------------------------------------------------------------
  app.get('/api/employees', (req, res) => {
    try {
      const employees = repo.getEmployees();
      res.json(employees);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get employees' });
    }
  });

  // --------------------------------------------------------------------------
  // Server-Side Gemini AI Assistant Route
  // --------------------------------------------------------------------------
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const { action, prompt, propertyDetails, clientDetails } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        let simulatedText = '';
        if (action === 'GENERATE_DESCRIPTION') {
          simulatedText = `🏢 **فرصة عقارية ممتازة من شركة الماسة للتسويق العقاري!**

يعلن قسم التسويق العقاري عن عرض مميز للغاية:
📍 **الموقع:** ${propertyDetails?.district || 'التجمع الخامس'} - ${propertyDetails?.city || 'القاهرة الجديدة'}
✨ **النوع:** ${propertyDetails?.type || 'شقة سكنية'} (${propertyDetails?.areaSqM || 200} متر مربع)
🛋️ **التشطيب:** ${propertyDetails?.finishing || 'ألترا سوبر لوكس'}
🛏️ **المواصفات:** ${propertyDetails?.bedrooms || 3} غرف نوم + ${propertyDetails?.bathrooms || 3} حمام + رسيبشن واسع

💰 **السعر المطلوب:** ${propertyDetails?.price ? Number(propertyDetails.price).toLocaleString('ar-EG') : '6,850,000'} جنيه مصري.
📞 للتواصل والمعاينة الفورية، يرجى الاتصال بشركة الماسة: 01001234567`;
        } else if (action === 'GENERATE_SOCIAL_POST') {
          simulatedText = `🔥 **عقار الأسبوع الاستثماري | الماسة العقارية** 🔥

هل تبحث عن السكن الرفيع أو الاستثمار الآمن في مصر؟ 🇪🇬✨
نقدم لك أحدث العروض الحصرية:

🏡 **${propertyDetails?.title || 'وحدة فاخرة بموقع استراتيجي'}**
📍 **المنطقة:** ${propertyDetails?.district || 'الشيخ زايد'}
📐 **المساحة:** ${propertyDetails?.areaSqM || 180} م²
💵 **السعر:** ${propertyDetails?.price ? Number(propertyDetails.price).toLocaleString('ar-EG') : '5,500,000'} ج.م (تسهيلات في السداد متوفرة)

مميزات العقار:
✅ إطلالة ساحرة ومجتمع راقي
✅ أوراق ملكية مسجلة وجاهزة للتعاقد
✅ كمبوند مغلق بخدمات أمنية وحراسة 24/7

👇 اكتب (مهتم) في التعليقات أو تواصل معنا عبر واتساب فوراً:
📲 01001234567

#الماسة_للتسويق_العقاري #عقارات_مصر #شقق_للبيع #الشيخ_زايد #التجمع_الخامس #العاصمة_الإدارية`;
        } else if (action === 'GENERATE_WHATSAPP') {
          simulatedText = `أهلاً بحضرتك أستاذ ${clientDetails?.name || 'العميل العزيز'} 👋
معك مسئول المبيعات من شركة الماسة للتسويق العقاري 🏢

بناءً على طلب حضرتك لبحث عن ${clientDetails?.preferredType || 'شقة'} في منطقة ${clientDetails?.preferredDistrict || 'التجمع الخامس'} بميزانية حوالي ${clientDetails?.budgetMax ? Number(clientDetails.budgetMax).toLocaleString('ar-EG') : '7,000,000'} ج.م.

يسعدنا إبلاغك بتوفر وحدة فاخرة جديدة تماماً تطابق مواصفات حضرتك تماماً!
📸 هل يناسب حضرتك إرسال الصور والتفاصيل الكاملة عبر واتساب الآن لتحديد موعد المعاينة الميدانية؟

تحياتنا،
فريق الماسة للتسويق العقاري 💎`;
        } else if (action === 'ESTIMATE_PRICE') {
          simulatedText = `📊 **تقرير تقدير السعر العادل من الذكاء الاصطناعي (الماسة ERP):**

بناءً على تحليل قاعدة بيانات العقارات في منطقة **${propertyDetails?.district || 'التجمع الخامس'}**:
- متوسط سعر المتر المربع الموصى به: **28,000 إلى 34,000 ج.م**
- السعر الإجمالي التقديري للوحدة (${propertyDetails?.areaSqM || 200} م²): **5,600,000 إلى 6,800,000 ج.م**
- نسبة العائد الاستثماري المتوقع عند الإيجار: **7.5% سنوياً**
- تقييم سرعة البيع: **عالي جداً (خلال 30-45 يوماً)**`;
        } else {
          simulatedText = `تم تحليل البيانات بنجاح بواسطة المساعد الذكي لشركة الماسة العقارية: ${prompt || 'يرجى تحديد طلبك'}`;
        }

        return res.json({ result: simulatedText, modelUsed: 'Simulated Engine' });
      }

      // Live Gemini Call using @google/genai
      const systemPrompt =
        'أنت المساعد الذكي الخبير لشركة الماسة للتسويق العقاري في مصر (Almasa Real Estate). أجب باللغة العربية بأسلوب احترافي تسويقي راقٍ ومقنع للغاية.';

      let userQuery = prompt || '';
      if (action === 'GENERATE_DESCRIPTION') {
        userQuery = `اكتب وصفاً عقارياً تسويقياً فخماً باللغة العربية المجهرة لمصر للعقار التالي:
عنوان العقار: ${propertyDetails?.title}
النوع: ${propertyDetails?.type}
المنطقة: ${propertyDetails?.district} - ${propertyDetails?.governorate}
المساحة: ${propertyDetails?.areaSqM} متر مربع
التشطيب: ${propertyDetails?.finishing}
السعر: ${propertyDetails?.price} جنيه مصري
الغرف: ${propertyDetails?.bedrooms} غرف, الحمامات: ${propertyDetails?.bathrooms}`;
      } else if (action === 'GENERATE_SOCIAL_POST') {
        userQuery = `اصنع منشوراً تسويقياً رائعاً لمنصات فيس بوك وإنستجرام جذابا للجمهور المصري لشراء العقار التالي:
${JSON.stringify(propertyDetails)}
استخدم الرموز التعبيرية والإيموجيز، وهاشتاجات عقارية مصرية مشهورة.`;
      } else if (action === 'GENERATE_WHATSAPP') {
        userQuery = `اصنع صيغة رسالة واتساب مبيعات احترافية ومقنعة للعميل التالي:
اسم العميل: ${clientDetails?.name}
المنطقة المطلوبة: ${clientDetails?.preferredDistrict}
الميزانية: ${clientDetails?.budgetMax} جنيه
تفاصيل المبيعات: ارضائه بتحديد موعد معاينة ميدانية مع شركة الماسة.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userQuery,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        result: response.text || 'لم يتم استرجاع نص من نموذج الذكاء الاصطناعي',
        modelUsed: 'gemini-3.6-flash',
      });
    } catch (error: any) {
      console.error('Gemini Assistant Error:', error);
      res.status(500).json({ error: error?.message || 'AI assistant error occurred' });
    }
  });

  // --------------------------------------------------------------------------
  // PARTNER MARKETING COMPANIES REST API
  // --------------------------------------------------------------------------
  app.get('/api/partner-companies', (req: any, res) => {
    try {
      const partners = repo.getPartnerCompanies();
      res.json(partners);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع شركات التسويق المتعاونة' });
    }
  });

  app.get('/api/partner-companies/:id', (req: any, res) => {
    try {
      const partner = repo.getPartnerCompanyById(req.params.id);
      if (!partner) return res.status(404).json({ error: 'الشركة غير موجودة' });
      res.json(partner);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع بيانات الشركة' });
    }
  });

  app.post('/api/partner-companies', (req: any, res) => {
    try {
      if (!req.body.name || !req.body.contactPerson || !req.body.phone) {
        return res.status(400).json({ error: 'اسم الشركة، الشخص المسؤول، ورقم الهاتف حقول مطلوبة' });
      }
      const created = repo.createPartnerCompany(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تسجيل الشركة المتعاونة' });
    }
  });

  app.put('/api/partner-companies/:id', (req: any, res) => {
    try {
      const updated = repo.updatePartnerCompany(req.params.id, req.body, req.user);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تحديث بيانات الشركة' });
    }
  });

  // Partner Unit Shares
  app.get('/api/partner-unit-shares', (req: any, res) => {
    try {
      const shares = repo.getPartnerUnitShares(req.query.propertyId);
      res.json(shares);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع حصص الشركات المتعاونة في الوحدات' });
    }
  });

  app.post('/api/partner-unit-shares', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.partnerCompanyId) {
        return res.status(400).json({ error: 'معرف العقار ومعرف الشركة الشريكة حقول إلزامية' });
      }
      const created = repo.addPartnerUnitShare(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تسجيل حصة الشركة الشريكة' });
    }
  });

  // --------------------------------------------------------------------------
  // REAL ESTATE DEALS & COMMISSION SPLITS REST API
  // --------------------------------------------------------------------------
  app.get('/api/real-estate-deals', (req: any, res) => {
    try {
      const { dealType, approvalStatus, partnerCompanyId } = req.query;
      const deals = repo.getRealEstateDeals({ dealType, approvalStatus, partnerCompanyId });
      res.json(deals);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع الصفقات العقارية' });
    }
  });

  app.get('/api/real-estate-deals/:id', (req: any, res) => {
    try {
      const deal = repo.getRealEstateDealById(req.params.id);
      if (!deal) return res.status(404).json({ error: 'الصفقة غير موجودة' });
      res.json(deal);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع تفاصيل الصفقة' });
    }
  });

  app.post('/api/real-estate-deals', (req: any, res) => {
    try {
      if (!req.body.propertyId || !req.body.dealPrice || !req.body.clientName) {
        return res.status(400).json({ error: 'معرف العقار، قيمة الصفقة، واسم العميل حقول مطلوبة' });
      }
      const created = repo.createRealEstateDeal(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تسجيل الصفقة العقارية' });
    }
  });

  app.post('/api/real-estate-deals/:id/collection', (req: any, res) => {
    try {
      const { amount, paymentMethod, receiptNo } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: 'مبلغ التحصيل يجب أن يكون أكبر من صفر' });
      const updated = repo.recordDealCollection(req.params.id, Number(amount), paymentMethod || 'تحويل بنكي', receiptNo || 'REC-AUTO', req.user);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تسجيل التحصيل' });
    }
  });

  app.post('/api/commission-splits/:id/disburse', (req: any, res) => {
    try {
      const { amount, paymentMethod, receiptNumber, notes } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: 'مبلغ الصرف مطلوب' });
      const updatedDeal = repo.disburseCommissionSplit(req.params.id, Number(amount), paymentMethod || 'تحويل بنكي', receiptNumber || `DISB-${Date.now()}`, req.user, notes);
      res.json({ success: true, deal: updatedDeal });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل صرف المستحق' });
    }
  });

  // --------------------------------------------------------------------------
  // EQUITY PARTNERS (نظام الشركاء)
  // --------------------------------------------------------------------------
  app.get('/api/equity-partners', (req: any, res) => {
    try {
      const partners = repo.getEquityPartners();
      res.json(partners);
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع بيانات الشركاء' });
    }
  });

  app.post('/api/equity-partners', (req: any, res) => {
    try {
      if (!req.body.name || !req.body.phone || req.body.equityPercentage === undefined) {
        return res.status(400).json({ error: 'اسم الشريك ورقم الهاتف ونسبة الملكية حقول إلزامية' });
      }
      const created = repo.createEquityPartner(req.body, req.user);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تسجيل الشريك' });
    }
  });

  // --------------------------------------------------------------------------
  // SMART PROPERTY LOCATION INTELLIGENCE (التحليل الجغرافي والخدمات المحيطة)
  // --------------------------------------------------------------------------
  app.get('/api/properties/:id/location-intelligence', (req: any, res) => {
    try {
      const intel = repo.getPropertyLocationIntelligence(req.params.id);
      res.json(intel || { status: 'لم يتم البحث', places: [] });
    } catch (err: any) {
      res.status(500).json({ error: 'فشل استرجاع بيانات التحليل الجغرافي' });
    }
  });

  app.post('/api/properties/:id/location-intelligence/search', (req: any, res) => {
    try {
      const radius = req.body.radiusMeters ? Number(req.body.radiusMeters) : 2000;
      const result = repo.searchAndAnalyzePropertyLocation(req.params.id, radius, req.user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل تشغيل التحليل الجغرافي' });
    }
  });

  app.put('/api/properties/:id/location-intelligence/approve', (req: any, res) => {
    try {
      const result = repo.reviewAndApproveLocationIntelligence(req.params.id, req.body, req.user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل مراجعة واعتماد الوصف الجغرافي' });
    }
  });

  // Dynamic nearby places lookup by coordinates or street name (before saving unit)
  app.post('/api/location/lookup-nearby', (req: any, res) => {
    try {
      const { lat, lng, radiusMeters, streetOrDistrict } = req.body;
      const result = repo.lookupNearbyServices(
        Number(lat) || 0,
        Number(lng) || 0,
        Number(radiusMeters) || 3000,
        streetOrDistrict || ''
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'فشل جلب المعالم المحيطة' });
    }
  });

  // Serve static files in production or Vite middleware in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Almasa CRM & ERP SQLite Relational Server running on http://localhost:${PORT}`);
  });
}

startServer();
