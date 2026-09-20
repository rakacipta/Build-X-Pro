import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { CrmModule } from './components/crm/CrmModule';
import { TenderModule } from './components/tender/TenderModule';
import { EstimatorModule } from './components/estimator/EstimatorModule';
import { ProjectModule } from './components/project/ProjectModule';
import { TradingModule } from './components/trading/TradingModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { PurchasingModule } from './components/purchasing/PurchasingModule';
import { EquipmentModule } from './components/equipment/EquipmentModule';
import { HrPayrollModule } from './components/hr/HrPayrollModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { InvoiceModule } from './components/invoicing/InvoiceModule';
import { BankAccountsModule } from './components/finance/BankAccountsModule';
import { AccountingModule } from './components/accounting/AccountingModule';
import { ApprovalsModule } from './components/approvals/ApprovalsModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { OfficialLettersModule } from './components/letters/OfficialLettersModule';
import { FormModule } from './components/forms/FormModule';
import { LoginPage } from './components/auth/LoginPage';
import { DeepAuditLogModal } from './components/common/DeepAuditLogModal';
import { CloudStorageManagerModal } from './components/common/CloudStorageManagerModal';

import {
  ModuleType,
  UserRole,
  Project,
  Tender,
  Quotation,
  Material,
  PurchaseOrder,
  SalesOrder,
  CrmLead,
  Equipment,
  Employee,
  AttendanceRecord,
  OvertimeRecord,
  PayrollSlip,
  FinanceTransaction,
  ChartOfAccount,
  JournalEntry,
  ApprovalRequest,
  AHSPItem,
  RABItem,
  CompanyProfile,
  LetterheadSettings,
  SystemUser,
  SystemSettings,
  AppNotification,
  SubkonContract,
  SubkonOpname,
  ProjectInvoice,
  DeepAuditLog,
  ActiveDocumentLock,
  CloudLargeAttachment,
  CustomForm,
  FormSubmission,
  OfficialLetter,
  LetterTemplate,
} from './types';
import { BastDocument } from './components/letters/BastSubmodule';
import {
  isModuleAllowed,
  getFirstAllowedModule,
  NOVIA_EMAIL,
  SISKA_EMAIL,
} from './utils/permission';

import {
  INITIAL_PROJECTS,
  INITIAL_TENDERS,
  INITIAL_QUOTATIONS,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_LEADS,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_OVERTIME,
  INITIAL_PAYROLL,
  INITIAL_FINANCE,
  INITIAL_COA,
  INITIAL_JOURNALS,
  INITIAL_APPROVALS,
  INITIAL_AHSP,
  INITIAL_RAB_ITEMS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_LETTERHEAD,
  INITIAL_SYSTEM_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUBKON_CONTRACTS,
  INITIAL_SUBKON_OPNAMES,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CLOUD_ATTACHMENTS,
  INITIAL_DOCUMENT_LOCKS,
  INITIAL_CUSTOM_FORMS,
  INITIAL_FORM_SUBMISSIONS,
  INITIAL_OFFICIAL_LETTERS,
  INITIAL_LETTER_TEMPLATES,
  INITIAL_BAST_DOCS,
} from './lib/seedData';
import { formatRupiah } from './utils/formatters';

import {
  subscribeToCollection,
  saveDocument,
  deleteDocument,
  getStoredData,
  setStoredData,
  replaceAllDocuments,
  clearCollectionDocuments,
  recordAuditLog,
  forceRefreshAllCollections,
} from './services/firestoreService';
import { testConnection } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isZeroOutModalOpen, setIsZeroOutModalOpen] = useState(false);

  // Persistent Collections State
  const [projects, setProjects] = useState<Project[]>(() =>
    getStoredData('projects', INITIAL_PROJECTS)
  );
  const [tenders, setTenders] = useState<Tender[]>(() =>
    getStoredData('tenders', INITIAL_TENDERS)
  );
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    getStoredData('quotations', INITIAL_QUOTATIONS)
  );
  const [materials, setMaterials] = useState<Material[]>(() =>
    getStoredData('materials', INITIAL_MATERIALS)
  );
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    getStoredData('purchases', INITIAL_PURCHASES)
  );
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() =>
    getStoredData('sales', INITIAL_SALES)
  );
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() =>
    getStoredData('crm_leads', INITIAL_LEADS)
  );
  const [equipment, setEquipment] = useState<Equipment[]>(() =>
    getStoredData('equipment', INITIAL_EQUIPMENT)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    getStoredData('employees', INITIAL_EMPLOYEES)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getStoredData('attendance', INITIAL_ATTENDANCE)
  );
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() =>
    getStoredData('overtime', INITIAL_OVERTIME)
  );
  const [payrollSlips, setPayrollSlips] = useState<PayrollSlip[]>(() =>
    getStoredData('payroll', INITIAL_PAYROLL)
  );
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() =>
    getStoredData('finance_transactions', INITIAL_FINANCE)
  );
  const [coaList, setCoaList] = useState<ChartOfAccount[]>(() =>
    getStoredData('coa', INITIAL_COA)
  );
  const [journals, setJournals] = useState<JournalEntry[]>(() =>
    getStoredData('journals', INITIAL_JOURNALS)
  );
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() =>
    getStoredData('approvals', INITIAL_APPROVALS)
  );
  const [ahspList, setAhspList] = useState<AHSPItem[]>(() =>
    getStoredData('ahsp', INITIAL_AHSP)
  );
  const [rabItems, setRabItems] = useState<RABItem[]>(() =>
    getStoredData('rab_items', INITIAL_RAB_ITEMS)
  );

  // Subkon & SPK Borongan States
  const [subkonContracts, setSubkonContracts] = useState<SubkonContract[]>(() =>
    getStoredData('subkon_contracts', INITIAL_SUBKON_CONTRACTS)
  );
  const [subkonOpnames, setSubkonOpnames] = useState<SubkonOpname[]>(() =>
    getStoredData('subkon_opnames', INITIAL_SUBKON_OPNAMES)
  );

  // Invoices State
  const [invoices, setInvoices] = useState<ProjectInvoice[]>(() =>
    getStoredData('invoices', INITIAL_INVOICES)
  );

  // Notifications & Alert State
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getStoredData('notifications', INITIAL_NOTIFICATIONS)
  );
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success';
  } | null>(null);

  // Settings States
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() =>
    getStoredData('company_profile', INITIAL_COMPANY_PROFILE)
  );
  const [letterhead, setLetterhead] = useState<LetterheadSettings>(() =>
    getStoredData('letterhead', INITIAL_LETTERHEAD)
  );
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() =>
    getStoredData('system_users', INITIAL_SYSTEM_USERS)
  );
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    getStoredData('system_settings', INITIAL_SYSTEM_SETTINGS)
  );

  // Deep Audit Trail & Storage Vault States
  const [auditLogs, setAuditLogs] = useState<DeepAuditLog[]>(() =>
    getStoredData('audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [cloudAttachments, setCloudAttachments] = useState<CloudLargeAttachment[]>(() =>
    getStoredData('cloud_attachments', INITIAL_CLOUD_ATTACHMENTS)
  );
  const [documentLocks, setDocumentLocks] = useState<ActiveDocumentLock[]>(() =>
    getStoredData('document_locks', INITIAL_DOCUMENT_LOCKS)
  );
  const [customForms, setCustomForms] = useState<CustomForm[]>(() =>
    getStoredData('custom_forms', INITIAL_CUSTOM_FORMS)
  );
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>(() =>
    getStoredData('form_submissions', INITIAL_FORM_SUBMISSIONS)
  );
  const [officialLetters, setOfficialLetters] = useState<OfficialLetter[]>(() =>
    getStoredData('official_letters', INITIAL_OFFICIAL_LETTERS)
  );
  const [bastDocuments, setBastDocuments] = useState<BastDocument[]>(() =>
    getStoredData('bast_documents', INITIAL_BAST_DOCS)
  );
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>(() =>
    getStoredData('letter_templates', INITIAL_LETTER_TEMPLATES)
  );
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  useEffect(() => {
    setStoredData('custom_forms', customForms);
  }, [customForms]);

  useEffect(() => {
    setStoredData('form_submissions', formSubmissions);
  }, [formSubmissions]);

  useEffect(() => {
    setStoredData('official_letters', officialLetters);
  }, [officialLetters]);

  useEffect(() => {
    setStoredData('bast_documents', bastDocuments);
  }, [bastDocuments]);

  useEffect(() => {
    setStoredData('letter_templates', letterTemplates);
  }, [letterTemplates]);

  // Initialize Firestore Subscriptions
  useEffect(() => {
    testConnection();

    const unsubProjects = subscribeToCollection('projects', INITIAL_PROJECTS, setProjects);
    const unsubTenders = subscribeToCollection('tenders', INITIAL_TENDERS, setTenders);
    const unsubMaterials = subscribeToCollection('materials', INITIAL_MATERIALS, setMaterials);
    const unsubPurchases = subscribeToCollection('purchases', INITIAL_PURCHASES, setPurchases);
    const unsubSales = subscribeToCollection('sales', INITIAL_SALES, setSalesOrders);
    const unsubLeads = subscribeToCollection('crm_leads', INITIAL_LEADS, setCrmLeads);
    const unsubEquipment = subscribeToCollection('equipment', INITIAL_EQUIPMENT, setEquipment);
    const unsubEmployees = subscribeToCollection('employees', INITIAL_EMPLOYEES, setEmployees);
    const unsubAttendance = subscribeToCollection('attendance', INITIAL_ATTENDANCE, setAttendanceRecords);
    const unsubOvertime = subscribeToCollection('overtime', INITIAL_OVERTIME, setOvertimeRecords);
    const unsubPayroll = subscribeToCollection('payroll', INITIAL_PAYROLL, setPayrollSlips);
    const unsubFinance = subscribeToCollection(
      'finance_transactions',
      INITIAL_FINANCE,
      setFinanceTransactions
    );
    const unsubCoa = subscribeToCollection('coa', INITIAL_COA, setCoaList);
    const unsubJournals = subscribeToCollection('journals', INITIAL_JOURNALS, setJournals);
    const unsubApprovals = subscribeToCollection('approvals', INITIAL_APPROVALS, setApprovals);
    const unsubAhsp = subscribeToCollection('ahsp', INITIAL_AHSP, setAhspList);
    const unsubRab = subscribeToCollection('rab_items', INITIAL_RAB_ITEMS, setRabItems);
    const unsubUsers = subscribeToCollection('system_users', INITIAL_SYSTEM_USERS, setSystemUsers);
    const unsubNotifs = subscribeToCollection('notifications', INITIAL_NOTIFICATIONS, setNotifications);
    const unsubSubkon = subscribeToCollection('subkon_contracts', INITIAL_SUBKON_CONTRACTS, setSubkonContracts);
    const unsubOpnames = subscribeToCollection('subkon_opnames', INITIAL_SUBKON_OPNAMES, setSubkonOpnames);
    const unsubInvoices = subscribeToCollection('invoices', INITIAL_INVOICES, setInvoices);
    const unsubQuotations = subscribeToCollection('quotations', INITIAL_QUOTATIONS, setQuotations);
    const unsubAuditLogs = subscribeToCollection('audit_logs', INITIAL_AUDIT_LOGS, setAuditLogs);
    const unsubAttachments = subscribeToCollection('cloud_attachments', INITIAL_CLOUD_ATTACHMENTS, setCloudAttachments);
    const unsubLocks = subscribeToCollection('document_locks', INITIAL_DOCUMENT_LOCKS, setDocumentLocks);
    const unsubCustomForms = subscribeToCollection('custom_forms', INITIAL_CUSTOM_FORMS, setCustomForms);
    const unsubFormSubmissions = subscribeToCollection('form_submissions', INITIAL_FORM_SUBMISSIONS, setFormSubmissions);
    const unsubOfficialLetters = subscribeToCollection('official_letters', INITIAL_OFFICIAL_LETTERS, setOfficialLetters);
    const unsubBast = subscribeToCollection('bast_documents', INITIAL_BAST_DOCS, setBastDocuments);
    const unsubTemplates = subscribeToCollection('letter_templates', INITIAL_LETTER_TEMPLATES, setLetterTemplates);
    const unsubSettings = subscribeToCollection('settings_single', [], (items: any[]) => {
      items.forEach((item) => {
        if (item.id === 'company_profile') {
          const { id, ...profile } = item;
          setCompanyProfile(profile as CompanyProfile);
          setStoredData('company_profile', profile);
        } else if (item.id === 'letterhead') {
          const { id, ...lh } = item;
          setLetterhead(lh as LetterheadSettings);
          setStoredData('letterhead', lh);
        } else if (item.id === 'system_settings') {
          const { id, ...s } = item;
          setSystemSettings(s as SystemSettings);
          setStoredData('system_settings', s);
        }
      });
    });

    return () => {
      unsubProjects();
      unsubTenders();
      unsubMaterials();
      unsubPurchases();
      unsubSales();
      unsubLeads();
      unsubEquipment();
      unsubEmployees();
      unsubAttendance();
      unsubOvertime();
      unsubPayroll();
      unsubFinance();
      unsubCoa();
      unsubJournals();
      unsubApprovals();
      unsubAhsp();
      unsubRab();
      unsubUsers();
      unsubNotifs();
      unsubSubkon();
      unsubOpnames();
      unsubInvoices();
      unsubQuotations();
      unsubAuditLogs();
      unsubAttachments();
      unsubLocks();
      unsubCustomForms();
      unsubFormSubmissions();
      unsubOfficialLetters();
      unsubBast();
      unsubTemplates();
      unsubSettings();
    };
  }, []);

  // Enforce module accessibility check when activeModule or currentUser changes
  useEffect(() => {
    if (currentUser && !isModuleAllowed(activeModule, currentUser)) {
      const fallbackModule = getFirstAllowedModule(currentUser);
      setActiveModule(fallbackModule);
    }
  }, [activeModule, currentUser]);

  const handleSelectModule = (mod: ModuleType) => {
    if (!isModuleAllowed(mod, currentUser)) {
      const cleanEmail = currentUser?.email.toLowerCase().trim() || '';
      let msg = `Akun ${currentUser?.email || 'ini'} tidak memiliki akses ke modul ini.`;
      if (cleanEmail === NOVIA_EMAIL.toLowerCase()) {
        msg = `Akun Novia (${currentUser?.email}) hanya dapat mengakses KPI Dashboard, HR & Keuangan, dan Laporan Executive.`;
      } else if (cleanEmail === SISKA_EMAIL.toLowerCase()) {
        msg = `Akun Siska (${currentUser?.email}) hanya dapat mengakses Marketing & Tender, Konstruksi & Proyek, serta Trading & Supply Chain.`;
      }
      setToastMessage({
        title: 'Akses Dibatasi',
        message: msg,
        type: 'alert',
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setActiveModule(mod);
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending').length;

  // Deep Audit Log & Cloud Storage Handlers
  const handleRecordAuditLog = async (logData: Omit<DeepAuditLog, 'id' | 'timestamp'>) => {
    const log = await recordAuditLog(logData);
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleUploadAttachment = async (
    attData: Omit<CloudLargeAttachment, 'id' | 'uploadedAt'>
  ) => {
    const newAtt: CloudLargeAttachment = {
      id: 'att-' + Date.now(),
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ...attData,
    };
    const updated = await saveDocument('cloud_attachments', newAtt);
    setCloudAttachments(updated);

    // Also record an audit log entry for uploading attachment
    await handleRecordAuditLog({
      userEmail: currentUser?.email || 'user@company.com',
      userName: currentUser?.name || 'Staf ERP',
      userRole: currentRole,
      module: attData.relatedModule,
      entityName: attData.relatedEntityName,
      itemId: attData.relatedEntityId,
      fieldName: 'lampiran_berkas_cloud',
      oldValue: '(tanpa lampiran)',
      newValue: `${attData.fileName} (${attData.fileSizeMb} MB)`,
      reason: `Pengunggahan dokumen berkas besar ${attData.category} ke ${attData.storageProvider}`,
    });

    setToastMessage({
      title: 'Berkas Cloud Berhasil Diunggah',
      message: `File ${newAtt.fileName} (${newAtt.fileSizeMb} MB) tersimpan terenkripsi di ${newAtt.storageProvider}.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAttachment = async (id: string) => {
    const target = cloudAttachments.find((a) => a.id === id);
    const updated = await deleteDocument<CloudLargeAttachment>('cloud_attachments', id);
    setCloudAttachments(updated);

    if (target) {
      await handleRecordAuditLog({
        userEmail: currentUser?.email || 'user@company.com',
        userName: currentUser?.name || 'Staf ERP',
        userRole: currentRole,
        module: target.relatedModule,
        entityName: target.relatedEntityName,
        itemId: target.relatedEntityId,
        fieldName: 'penghapusan_lampiran_cloud',
        oldValue: target.fileName,
        newValue: '(dihapus)',
        reason: 'Penghapusan manual berkas dari Cloud Media Vault',
      });
    }
  };

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id: string) => {
    const existing = notifications.find((n) => n.id === id);
    if (existing) {
      const updated = await saveDocument('notifications', { ...existing, isRead: true });
      setNotifications(updated);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const updatedList = notifications.map((n) => ({ ...n, isRead: true }));
    setStoredData('notifications', updatedList);
    setNotifications(updatedList);
    for (const n of updatedList) {
      await saveDocument('notifications', n);
    }
  };

  const handleTriggerNotification = async (notifData: Partial<AppNotification>) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      type: notifData.type || 'SYSTEM',
      title: notifData.title || 'Notifikasi Sistem',
      message: notifData.message || '',
      timestamp: 'Baru saja',
      isRead: false,
      priority: notifData.priority || 'high',
      targetRoles: notifData.targetRoles || ['Direktur Utama', 'Direktur', 'Super Admin'],
      linkModule: notifData.linkModule,
      relatedId: notifData.relatedId,
      amount: notifData.amount,
      senderName: notifData.senderName || currentRole,
    };

    const updated = await saveDocument('notifications', newNotif);
    setNotifications(updated);

    setToastMessage({
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type === 'OVER_BUDGET' ? 'alert' : 'info',
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSendReminder = async (reqNo: string, title: string, amount: number) => {
    await handleTriggerNotification({
      type: 'REMINDER',
      title: `⚡ INGATAN PUSH ALERT: Approval ${reqNo}`,
      message: `Peringatan dari ${currentRole}: Pengajuan ${title} senilai ${formatRupiah(
        amount
      )} membutuhkan tindakan persetujuan direksi segera.`,
      priority: 'urgent',
      targetRoles: ['Direktur Utama', 'Direktur', 'Super Admin'],
      linkModule: 'approvals',
      relatedId: reqNo,
      amount: amount,
      senderName: currentRole,
    });

    setToastMessage({
      title: 'Notifikasi Reminder Terkirim!',
      message: `Peringatan & alert persetujuan untuk ${reqNo} telah didorong ke Direksi secara real-time.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subkon CRUD Handlers
  const handleSaveSubkonContract = async (contract: SubkonContract) => {
    const updated = await saveDocument('subkon_contracts', contract);
    setSubkonContracts(updated);
  };

  const handleDeleteSubkonContract = async (id: string) => {
    const updated = await deleteDocument('subkon_contracts', id);
    setSubkonContracts(updated);
  };

  const handleSaveSubkonOpname = async (opname: SubkonOpname) => {
    const updated = await saveDocument('subkon_opnames', opname);
    setSubkonOpnames(updated);
  };

  const handleDeleteSubkonOpname = async (id: string) => {
    const updated = await deleteDocument('subkon_opnames', id);
    setSubkonOpnames(updated);
  };

  // Persistent Handlers for Save and Delete
  const handleSaveProject = async (p: Project) => {
    const updated = await saveDocument('projects', p);
    setProjects(updated);
  };
  const handleDeleteProject = async (id: string) => {
    const updated = await deleteDocument<Project>('projects', id);
    setProjects(updated);
  };

  const handleSaveTender = async (t: Tender) => {
    const updated = await saveDocument('tenders', t);
    setTenders(updated);
  };
  const handleDeleteTender = async (id: string) => {
    const updated = await deleteDocument<Tender>('tenders', id);
    setTenders(updated);
  };

  const handleSaveQuotation = async (q: Quotation) => {
    const updated = await saveDocument('quotations', q);
    setQuotations(updated);
  };
  const handleDeleteQuotation = async (id: string) => {
    const updated = await deleteDocument<Quotation>('quotations', id);
    setQuotations(updated);
  };

  const handleSaveMaterial = async (m: Material) => {
    const updated = await saveDocument('materials', m);
    setMaterials(updated);
  };
  const handleDeleteMaterial = async (id: string) => {
    const updated = await deleteDocument<Material>('materials', id);
    setMaterials(updated);
  };

  const handleSavePurchase = async (po: PurchaseOrder) => {
    const updated = await saveDocument('purchases', po);
    setPurchases(updated);
  };
  const handleDeletePurchase = async (id: string) => {
    const updated = await deleteDocument<PurchaseOrder>('purchases', id);
    setPurchases(updated);
  };

  const handleSaveSalesOrder = async (so: SalesOrder) => {
    const updated = await saveDocument('sales', so);
    setSalesOrders(updated);
  };
  const handleDeleteSalesOrder = async (id: string) => {
    const updated = await deleteDocument<SalesOrder>('sales', id);
    setSalesOrders(updated);
  };

  const handleSaveLead = async (l: CrmLead) => {
    const updated = await saveDocument('crm_leads', l);
    setCrmLeads(updated);
  };
  const handleDeleteLead = async (id: string) => {
    const updated = await deleteDocument<CrmLead>('crm_leads', id);
    setCrmLeads(updated);
  };

  const handleSaveEquipment = async (e: Equipment) => {
    const updated = await saveDocument('equipment', e);
    setEquipment(updated);
  };
  const handleDeleteEquipment = async (id: string) => {
    const updated = await deleteDocument<Equipment>('equipment', id);
    setEquipment(updated);
  };

  const handleSaveEmployee = async (e: Employee) => {
    const updatedEmployees = await saveDocument('employees', e);
    setEmployees(updatedEmployees);

    // Auto-sync payroll slip for this employee
    const currentPeriod = 'Juli 2026';
    const overtimePay = Math.round((e.overtimeHours || 0) * (e.basicSalary / 173));
    const bpjsDeduction = Math.round(e.basicSalary * 0.04);
    const taxPph21 = Math.round((e.basicSalary + e.allowance) * 0.05);
    const netSalary = e.basicSalary + e.allowance + overtimePay - bpjsDeduction - taxPph21;

    const existingSlip = payrollSlips.find(
      (s) => s.employeeId === e.id || s.employeeName === e.name
    );

    const updatedSlip: PayrollSlip = {
      id: existingSlip ? existingSlip.id : 'pay-' + Date.now(),
      employeeId: e.id,
      employeeName: e.name,
      period: existingSlip ? existingSlip.period : currentPeriod,
      basicSalary: e.basicSalary,
      allowance: e.allowance,
      overtimePay: overtimePay,
      bpjsDeduction: bpjsDeduction,
      taxPph21: taxPph21,
      netSalary: netSalary,
      status: existingSlip ? existingSlip.status : 'Approved',
    };

    const updatedPayroll = await saveDocument('payroll', updatedSlip);
    setPayrollSlips(updatedPayroll);
  };

  const handleDeleteEmployee = async (id: string) => {
    const updatedEmployees = await deleteDocument<Employee>('employees', id);
    setEmployees(updatedEmployees);

    // Remove associated payroll slip if exists
    const targetSlip = payrollSlips.find((s) => s.employeeId === id);
    if (targetSlip) {
      const updatedPayroll = await deleteDocument<PayrollSlip>('payroll', targetSlip.id);
      setPayrollSlips(updatedPayroll);
    }
  };

  const handleSavePayroll = async (p: PayrollSlip) => {
    const updatedPayroll = await saveDocument('payroll', p);
    setPayrollSlips(updatedPayroll);
  };

  const handleDeletePayroll = async (id: string) => {
    const updatedPayroll = await deleteDocument<PayrollSlip>('payroll', id);
    setPayrollSlips(updatedPayroll);
  };

  const handleSaveAttendance = async (a: AttendanceRecord) => {
    const updated = await saveDocument('attendance', a);
    setAttendanceRecords(updated);
  };

  const handleDeleteAttendance = async (id: string) => {
    const updated = await deleteDocument<AttendanceRecord>('attendance', id);
    setAttendanceRecords(updated);
  };

  const handleSaveOvertime = async (o: OvertimeRecord) => {
    const updated = await saveDocument('overtime', o);
    setOvertimeRecords(updated);
  };

  const handleDeleteOvertime = async (id: string) => {
    const updated = await deleteDocument<OvertimeRecord>('overtime', id);
    setOvertimeRecords(updated);
  };

  const handleSaveFinance = async (f: FinanceTransaction) => {
    const updated = await saveDocument('finance_transactions', f);
    setFinanceTransactions(updated);
  };
  const handleDeleteFinance = async (id: string) => {
    const updated = await deleteDocument<FinanceTransaction>('finance_transactions', id);
    setFinanceTransactions(updated);
  };

  const handleSaveJournal = async (jrn: JournalEntry) => {
    const updated = await saveDocument('journals', jrn);
    setJournals(updated);
  };

  const handleSaveCoa = async (coa: ChartOfAccount) => {
    const updated = await saveDocument('coa', coa);
    setCoaList(updated);
  };

  const handleZeroOutFinancialLedger = () => {
    setIsZeroOutModalOpen(true);
  };

  const handleConfirmZeroOut = async () => {
    try {
      // 1. Zero out bank initial balances in company profile
      const updatedBanks = (companyProfile.banks || []).map((b) => ({
        ...b,
        initialBalance: 0,
      }));
      const updatedProfile: CompanyProfile = {
        ...companyProfile,
        banks: updatedBanks,
      };
      setCompanyProfile(updatedProfile);
      setStoredData('company_profile', updatedProfile);
      saveDocument('settings_single', { id: 'company_profile', ...updatedProfile }).catch((e) =>
        console.warn('saveDocument settings_single error:', e)
      );

      // 2. Zero out all COA balances
      const updatedCoa = (coaList || []).map((c) => ({
        ...c,
        balance: 0,
      }));
      setCoaList(updatedCoa);
      setStoredData('coa', updatedCoa);
      replaceAllDocuments('coa', updatedCoa).catch((e) =>
        console.warn('replaceAllDocuments coa error:', e)
      );

      // 3. Clear finance transactions
      setFinanceTransactions([]);
      setStoredData('finance_transactions', []);
      clearCollectionDocuments('finance_transactions', financeTransactions).catch((e) =>
        console.warn('clearCollectionDocuments finance_transactions error:', e)
      );

      // 4. Clear journals
      setJournals([]);
      setStoredData('journals', []);
      clearCollectionDocuments('journals', journals).catch((e) =>
        console.warn('clearCollectionDocuments journals error:', e)
      );

      // 5. Reset invoice paid amounts / status
      if (invoices && invoices.length > 0) {
        const updatedInvoices = invoices.map((inv) => ({
          ...inv,
          amountPaid: 0,
          status: 'Draft' as const,
        }));
        setInvoices(updatedInvoices);
        setStoredData('invoices', updatedInvoices);
        replaceAllDocuments('invoices', updatedInvoices).catch((e) =>
          console.warn('replaceAllDocuments invoices error:', e)
        );
      }

      // 6. Reset Sales Orders paid amounts
      if (salesOrders && salesOrders.length > 0) {
        const updatedSales = salesOrders.map((so) => ({
          ...so,
          paidAmount: 0,
        }));
        setSalesOrders(updatedSales);
        setStoredData('sales', updatedSales);
        replaceAllDocuments('sales', updatedSales).catch((e) =>
          console.warn('replaceAllDocuments sales error:', e)
        );
      }

      // 7. Reset Purchase Orders paid amounts
      if (purchases && purchases.length > 0) {
        const updatedPurchases = purchases.map((po) => ({
          ...po,
          paidAmount: 0,
        }));
        setPurchases(updatedPurchases);
        setStoredData('purchases', updatedPurchases);
        replaceAllDocuments('purchases', updatedPurchases).catch((e) =>
          console.warn('replaceAllDocuments purchases error:', e)
        );
      }

      // 8. Reset Subkon Opnames paid amounts / status
      if (subkonOpnames && subkonOpnames.length > 0) {
        const updatedSubkonOp = subkonOpnames.map((op) => ({
          ...op,
          status: 'Draft' as const,
        }));
        setSubkonOpnames(updatedSubkonOp);
        setStoredData('subkon_opnames', updatedSubkonOp);
        replaceAllDocuments('subkon_opnames', updatedSubkonOp).catch((e) =>
          console.warn('replaceAllDocuments subkon_opnames error:', e)
        );
      }

      // 9. Reset Projects actual cost
      if (projects && projects.length > 0) {
        const updatedProjects = projects.map((prj) => ({
          ...prj,
          actualCost: 0,
        }));
        setProjects(updatedProjects);
        setStoredData('projects', updatedProjects);
        replaceAllDocuments('projects', updatedProjects).catch((e) =>
          console.warn('replaceAllDocuments projects error:', e)
        );
      }

      // 10. Clear payroll history
      if (payrollSlips && payrollSlips.length > 0) {
        setPayrollSlips([]);
        setStoredData('payroll', []);
        clearCollectionDocuments('payroll', payrollSlips).catch((e) =>
          console.warn('clearCollectionDocuments payroll error:', e)
        );
      }

      setIsZeroOutModalOpen(false);

      handleTriggerNotification({
        title: 'Nol-kan Pembukuan Berhasil',
        message:
          'Semua nilai Rupiah (saldo awal bank, COA, transaksi kas, jurnal, dan pencatatan pembayaran) telah berhasil DINOLKAN (Rp 0) untuk pembukuan periode baru!',
        type: 'SYSTEM',
      });
    } catch (err) {
      console.error('Error in handleZeroOutFinancialLedger:', err);
      setIsZeroOutModalOpen(false);
      handleTriggerNotification({
        title: 'Gagal Menolkan Saldo',
        message: 'Terjadi kesalahan saat menolkan saldo pembukuan. Silakan coba lagi.',
        type: 'SYSTEM',
      });
    }
  };

  const handleSaveRabItem = async (r: RABItem) => {
    const updated = await saveDocument('rab_items', r);
    setRabItems(updated);
  };
  const handleDeleteRabItem = async (id: string) => {
    const updated = await deleteDocument<RABItem>('rab_items', id);
    setRabItems(updated);
  };

  const handleSaveAhsp = async (a: AHSPItem) => {
    const updated = await saveDocument('ahsp', a);
    setAhspList(updated);
  };

  // Invoice Handlers
  const handleSaveInvoice = async (invoice: ProjectInvoice) => {
    const updated = await saveDocument('invoices', invoice);
    setInvoices(updated);
  };

  const handleDeleteInvoice = async (id: string) => {
    const updated = await deleteDocument<ProjectInvoice>('invoices', id);
    setInvoices(updated);
  };

  const handleMarkInvoiceAsPaid = async (
    invoiceId: string,
    paymentDetails: {
      paymentDate: string;
      account: 'Kas Utama' | 'Kas Proyek' | 'Bank BCA' | 'Bank Mandiri' | 'Petty Cash';
      paymentRefNo: string;
      notes?: string;
    }
  ) => {
    const targetInvoice = invoices.find((i) => i.id === invoiceId);
    if (!targetInvoice) return;

    // Create Cash In finance transaction
    const newTrxId = `trx-${Date.now()}`;
    const newTrx: FinanceTransaction = {
      id: newTrxId,
      trxNo: paymentDetails.paymentRefNo || `TRX/IN/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      type: 'Cash In',
      account: paymentDetails.account,
      amount: targetInvoice.totalAmount,
      category: 'Pembayaran Proyek',
      description: `Pembayaran Invoice ${targetInvoice.invoiceNumber} - ${targetInvoice.projectName} (${targetInvoice.termName})`,
      date: paymentDetails.paymentDate,
      projectId: targetInvoice.projectId,
      refNo: targetInvoice.invoiceNumber,
    };

    const updatedFinance = await saveDocument('finance_transactions', newTrx);
    setFinanceTransactions(updatedFinance);

    // Update invoice status to Paid
    const updatedInvoice: ProjectInvoice = {
      ...targetInvoice,
      status: 'Paid',
      paymentDate: paymentDetails.paymentDate,
      paymentRefNo: newTrx.trxNo,
      financeTransactionId: newTrxId,
      updatedAt: new Date().toISOString(),
    };

    const updatedInvoices = await saveDocument('invoices', updatedInvoice);
    setInvoices(updatedInvoices);
  };

  // Settings Handlers
  const handleSaveSystemUser = async (u: SystemUser) => {
    const updated = await saveDocument('system_users', u);
    setSystemUsers(updated);
  };
  const handleDeleteSystemUser = async (id: string) => {
    const updated = await deleteDocument<SystemUser>('system_users', id);
    setSystemUsers(updated);
  };

  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setStoredData('company_profile', profile);
    saveDocument('settings_single', { id: 'company_profile', ...profile });
  };

  const handleUpdateLetterhead = (lh: LetterheadSettings) => {
    setLetterhead(lh);
    setStoredData('letterhead', lh);
    saveDocument('settings_single', { id: 'letterhead', ...lh });
  };

  const handleUpdateSystemSettings = (s: SystemSettings) => {
    setSystemSettings(s);
    setStoredData('system_settings', s);
    saveDocument('settings_single', { id: 'system_settings', ...s });
  };

  // Custom Forms & Submissions Handlers
  const handleSaveCustomForm = async (f: CustomForm) => {
    const updated = await saveDocument('custom_forms', f);
    setCustomForms(updated);
  };
  const handleDeleteCustomForm = async (id: string) => {
    const updated = await deleteDocument<CustomForm>('custom_forms', id);
    setCustomForms(updated);
  };
  const handleSaveFormSubmission = async (s: FormSubmission) => {
    const updated = await saveDocument('form_submissions', s);
    setFormSubmissions(updated);
  };
  const handleDeleteFormSubmission = async (id: string) => {
    const updated = await deleteDocument<FormSubmission>('form_submissions', id);
    setFormSubmissions(updated);
  };

  // Official Letters & BAST Handlers
  const handleSaveOfficialLetter = async (l: OfficialLetter) => {
    const updated = await saveDocument('official_letters', l);
    setOfficialLetters(updated);
  };
  const handleDeleteOfficialLetter = async (id: string) => {
    const updated = await deleteDocument<OfficialLetter>('official_letters', id);
    setOfficialLetters(updated);
  };
  const handleSaveBastDocument = async (b: BastDocument) => {
    const updated = await saveDocument('bast_documents', b);
    setBastDocuments(updated);
  };
  const handleDeleteBastDocument = async (id: string) => {
    const updated = await deleteDocument<BastDocument>('bast_documents', id);
    setBastDocuments(updated);
  };
  const handleSaveLetterTemplate = async (t: LetterTemplate) => {
    const updated = await saveDocument('letter_templates', t);
    setLetterTemplates(updated);
  };
  const handleDeleteLetterTemplate = async (id: string) => {
    const updated = await deleteDocument<LetterTemplate>('letter_templates', id);
    setLetterTemplates(updated);
  };

  // Comprehensive Cloud Sync Across Devices
  const handleRefreshAllFromCloud = async () => {
    setIsCloudSyncing(true);
    try {
      const refreshed = await forceRefreshAllCollections([
        'projects',
        'tenders',
        'quotations',
        'materials',
        'purchases',
        'sales',
        'crm_leads',
        'equipment',
        'employees',
        'attendance',
        'overtime',
        'payroll',
        'finance_transactions',
        'coa',
        'journals',
        'approvals',
        'ahsp',
        'rab_items',
        'system_users',
        'notifications',
        'subkon_contracts',
        'subkon_opnames',
        'invoices',
        'audit_logs',
        'cloud_attachments',
        'document_locks',
        'custom_forms',
        'form_submissions',
        'official_letters',
        'bast_documents',
        'letter_templates',
      ]);

      if (refreshed['projects']) setProjects(refreshed['projects']);
      if (refreshed['tenders']) setTenders(refreshed['tenders']);
      if (refreshed['quotations']) setQuotations(refreshed['quotations']);
      if (refreshed['materials']) setMaterials(refreshed['materials']);
      if (refreshed['purchases']) setPurchases(refreshed['purchases']);
      if (refreshed['sales']) setSalesOrders(refreshed['sales']);
      if (refreshed['crm_leads']) setCrmLeads(refreshed['crm_leads']);
      if (refreshed['equipment']) setEquipment(refreshed['equipment']);
      if (refreshed['employees']) setEmployees(refreshed['employees']);
      if (refreshed['attendance']) setAttendanceRecords(refreshed['attendance']);
      if (refreshed['overtime']) setOvertimeRecords(refreshed['overtime']);
      if (refreshed['payroll']) setPayrollSlips(refreshed['payroll']);
      if (refreshed['finance_transactions']) setFinanceTransactions(refreshed['finance_transactions']);
      if (refreshed['coa']) setCoaList(refreshed['coa']);
      if (refreshed['journals']) setJournals(refreshed['journals']);
      if (refreshed['approvals']) setApprovals(refreshed['approvals']);
      if (refreshed['ahsp']) setAhspList(refreshed['ahsp']);
      if (refreshed['rab_items']) setRabItems(refreshed['rab_items']);
      if (refreshed['system_users']) setSystemUsers(refreshed['system_users']);
      if (refreshed['notifications']) setNotifications(refreshed['notifications']);
      if (refreshed['subkon_contracts']) setSubkonContracts(refreshed['subkon_contracts']);
      if (refreshed['subkon_opnames']) setSubkonOpnames(refreshed['subkon_opnames']);
      if (refreshed['invoices']) setInvoices(refreshed['invoices']);
      if (refreshed['audit_logs']) setAuditLogs(refreshed['audit_logs']);
      if (refreshed['cloud_attachments']) setCloudAttachments(refreshed['cloud_attachments']);
      if (refreshed['document_locks']) setDocumentLocks(refreshed['document_locks']);
      if (refreshed['custom_forms']) setCustomForms(refreshed['custom_forms']);
      if (refreshed['form_submissions']) setFormSubmissions(refreshed['form_submissions']);
      if (refreshed['official_letters']) setOfficialLetters(refreshed['official_letters']);
      if (refreshed['bast_documents']) setBastDocuments(refreshed['bast_documents']);
      if (refreshed['letter_templates']) setLetterTemplates(refreshed['letter_templates']);

      setToastMessage({
        title: 'Sinkronisasi Cloud Selesai',
        message: 'Seluruh data multi-perangkat telah disinkronkan langsung dengan Firestore Cloud Database.',
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      console.warn('Cloud sync error:', e);
      setToastMessage({
        title: 'Sinkronisasi Cloud Gagal',
        message: 'Tidak dapat memperbarui data dari cloud. Silakan periksa koneksi.',
        type: 'alert',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Approval Handlers
  const handleApprove = async (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      const updatedApproval = {
        ...existing,
        status: 'Approved' as const,
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      };
      const updated = await saveDocument('approvals', updatedApproval);
      setApprovals(updated);
    }
  };

  const handleReject = async (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      const updatedApproval = {
        ...existing,
        status: 'Rejected' as const,
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      };
      const updated = await saveDocument('approvals', updatedApproval);
      setApprovals(updated);
    }
  };

  // Auth & Login Handlers
  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('gmk_erp_logged_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    // Auto sync from cloud on login so device 2 immediately sees latest deletions & additions
    handleRefreshAllFromCloud();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gmk_erp_logged_user');
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <LoginPage
        systemUsers={systemUsers}
        companyProfile={companyProfile}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden relative">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-start gap-3 animate-slide-up">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
            <span className="text-lg">⚡</span>
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-400 text-sm mb-0.5">{toastMessage.title}</h4>
            <p className="text-slate-300 leading-relaxed">{toastMessage.message}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white font-bold text-sm px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenApprovals={() => handleSelectModule('approvals')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        companyName={companyProfile.name}
        companyLogoUrl={companyProfile.logoUrl}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNavigateModule={(mod) => handleSelectModule(mod as ModuleType)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        onOpenCloudStorage={() => setIsCloudModalOpen(true)}
        onRefreshCloudSync={handleRefreshAllFromCloud}
        isCloudSyncing={isCloudSyncing}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          pendingApprovalsCount={pendingApprovalsCount}
          currentUser={currentUser}
        />

        {/* Main Content Module Screen */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-12">
          {activeModule === 'dashboard' && (
            <DashboardModule
              projects={projects}
              financeTransactions={financeTransactions}
              equipment={equipment}
              employees={employees}
              approvals={approvals}
              materials={materials}
              purchaseOrders={purchases}
              invoices={invoices}
              coaList={coaList}
              tenders={tenders}
              onNavigate={handleSelectModule}
            />
          )}

          {activeModule === 'crm' && (
            <CrmModule
              leads={crmLeads}
              onSaveLead={handleSaveLead}
              onDeleteLead={handleDeleteLead}
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
            />
          )}

          {activeModule === 'tender' && (
            <TenderModule
              tenders={tenders}
              onSaveTender={handleSaveTender}
              onDeleteTender={handleDeleteTender}
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
            />
          )}

          {activeModule === 'estimator' && (
            <EstimatorModule
              ahspList={ahspList}
              rabItems={rabItems}
              onSaveRabItem={handleSaveRabItem}
              onDeleteRabItem={handleDeleteRabItem}
              onSaveAhsp={handleSaveAhsp}
            />
          )}

          {activeModule === 'project' && (
            <ProjectModule
              projects={projects}
              rabItems={rabItems}
              financeTransactions={financeTransactions}
              purchases={purchases}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'trading' && (
            <TradingModule
              salesOrders={salesOrders}
              onSaveSalesOrder={handleSaveSalesOrder}
              onDeleteSalesOrder={handleDeleteSalesOrder}
            />
          )}

          {activeModule === 'inventory' && (
            <InventoryModule
              materials={materials}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeModule === 'purchasing' && (
            <PurchasingModule
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onDeletePurchase={handleDeletePurchase}
              onSendReminder={handleSendReminder}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'equipment' && (
            <EquipmentModule
              equipmentList={equipment}
              onSaveEquipment={handleSaveEquipment}
              onDeleteEquipment={handleDeleteEquipment}
            />
          )}

          {activeModule === 'hr_payroll' && (
            <HrPayrollModule
              employees={employees}
              payrollSlips={payrollSlips}
              attendanceRecords={attendanceRecords}
              overtimeRecords={overtimeRecords}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onSavePayroll={handleSavePayroll}
              onDeletePayroll={handleDeletePayroll}
              onSaveAttendance={handleSaveAttendance}
              onDeleteAttendance={handleDeleteAttendance}
              onSaveOvertime={handleSaveOvertime}
              onDeleteOvertime={handleDeleteOvertime}
            />
          )}

          {activeModule === 'finance' && (
            <FinanceModule
              transactions={financeTransactions}
              projects={projects}
              onSaveTransaction={handleSaveFinance}
              onDeleteTransaction={handleDeleteFinance}
            />
          )}

          {activeModule === 'invoicing' && (
            <InvoiceModule
              invoices={invoices}
              projects={projects}
              companyProfile={companyProfile}
              letterhead={letterhead}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onMarkInvoiceAsPaid={handleMarkInvoiceAsPaid}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'bank_accounts' && (
            <BankAccountsModule
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              transactions={financeTransactions}
              currentRole={currentRole}
            />
          )}

          {activeModule === 'accounting' && (
            <AccountingModule
              coaList={coaList}
              journals={journals}
              financeTransactions={financeTransactions}
              companyProfile={companyProfile}
              invoices={invoices}
              purchases={purchases}
              payrollSlips={payrollSlips}
              projects={projects}
              onSaveJournal={handleSaveJournal}
              onSaveCoa={handleSaveCoa}
            />
          )}

          {activeModule === 'approvals' && (
            <ApprovalsModule
              approvals={approvals}
              currentRole={currentRole}
              onApprove={handleApprove}
              onReject={handleReject}
              onSendReminder={handleSendReminder}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              projects={projects}
              salesOrders={salesOrders}
              purchases={purchases}
              financeTransactions={financeTransactions}
              employees={employees}
              materials={materials}
            />
          )}

          {activeModule === 'official_letters' && (
            <OfficialLettersModule
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              letterhead={letterhead}
              projects={projects}
              subkonContracts={subkonContracts}
              subkonOpnames={subkonOpnames}
              onSaveSubkonContract={handleSaveSubkonContract}
              onDeleteSubkonContract={handleDeleteSubkonContract}
              onSaveSubkonOpname={handleSaveSubkonOpname}
              onDeleteSubkonOpname={handleDeleteSubkonOpname}
              letters={officialLetters}
              onSaveLetter={handleSaveOfficialLetter}
              onDeleteLetter={handleDeleteOfficialLetter}
              bastList={bastDocuments}
              onSaveBast={handleSaveBastDocument}
              onDeleteBast={handleDeleteBastDocument}
              templates={letterTemplates}
              onSaveTemplate={handleSaveLetterTemplate}
              onDeleteTemplate={handleDeleteLetterTemplate}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'forms' && (
            <FormModule
              projects={projects}
              currentUser={currentUser}
              companyProfile={companyProfile}
              letterhead={letterhead}
              customForms={customForms}
              setCustomForms={setCustomForms}
              formSubmissions={formSubmissions}
              setFormSubmissions={setFormSubmissions}
              onSaveForm={handleSaveCustomForm}
              onDeleteForm={handleDeleteCustomForm}
              onSaveSubmission={handleSaveFormSubmission}
              onDeleteSubmission={handleDeleteFormSubmission}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsModule
              currentRole={currentRole}
              currentUser={currentUser}
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              letterhead={letterhead}
              onUpdateLetterhead={handleUpdateLetterhead}
              users={systemUsers}
              onSaveUser={handleSaveSystemUser}
              onDeleteUser={handleDeleteSystemUser}
              systemSettings={systemSettings}
              onUpdateSystemSettings={handleUpdateSystemSettings}
              onZeroOutFinancialLedger={handleZeroOutFinancialLedger}
            />
          )}
        </main>
      </div>

      {/* Custom Confirmation Modal for Nol-kan Saldo */}
      {isZeroOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setIsZeroOutModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Nol-kan Pembukuan Baru
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Konfirmasi Reset Nilai Keuangan (Rp 0)
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 mb-5 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-950">
                Apakah Anda yakin ingin menolkan seluruh nilai Rupiah untuk pembukuan periode baru?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pt-1">
                <li>Saldo awal akun Kas/Bank menjadi <strong className="text-rose-700">Rp 0</strong></li>
                <li>Seluruh saldo Chart of Accounts (COA) menjadi <strong className="text-rose-700">Rp 0</strong></li>
                <li>Riwayat Transaksi Kas, Jurnal Umumm, dan Payroll dibersihkan</li>
                <li>Catatan Pembayaran Invoice, PO, SO, dan Project Cost di-reset</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsZeroOutModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmZeroOut}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Ya, Nol-kan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Deep Audit Log Modal */}
      <DeepAuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        onRecordLog={handleRecordAuditLog}
      />

      {/* Cloud Storage Vault Modal */}
      <CloudStorageManagerModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        attachments={cloudAttachments}
        onUploadAttachment={handleUploadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        currentUserName={currentUser?.name || 'Siska (Mktg & Proyek)'}
        defaultModule={activeModule}
      />
    </div>
  );
}
