export type UserRole =
  | 'Super Admin'
  | 'Direktur Utama'
  | 'Direktur'
  | 'Finance'
  | 'Accounting'
  | 'Purchasing'
  | 'Marketing'
  | 'Estimator'
  | 'Project Manager'
  | 'Site Manager'
  | 'Supervisor'
  | 'Warehouse'
  | 'HRD'
  | 'Equipment'
  | 'Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type ModuleType =
  | 'dashboard'
  | 'crm'
  | 'tender'
  | 'estimator'
  | 'project'
  | 'trading'
  | 'inventory'
  | 'purchasing'
  | 'sales'
  | 'equipment'
  | 'hr_payroll'
  | 'finance'
  | 'invoicing'
  | 'bank_accounts'
  | 'accounting'
  | 'approvals'
  | 'reports'
  | 'settings'
  | 'official_letters'
  | 'forms'
  | 'master_data';

// --- SURAT & DOKUMEN RESMI ---
export type LetterCategory =
  | 'SPK'
  | 'SUBKON_SPK'
  | 'SPH'
  | 'MOU'
  | 'SKK'
  | 'SURAT_TUGAS'
  | 'SP'
  | 'UNDANGAN'
  | 'PERMOHONAN'
  | 'BAST1'
  | 'BAST2'
  | 'CUSTOM';

export interface ScannedAttachment {
  id: string;
  title: string;
  category?: 'Kontrak' | 'Nota / Kwitansi' | 'Lampiran BAST' | 'Surat Jalan' | 'Lainnya';
  dataUrl?: string;
  imageDataUrl?: string;
  pageNumber?: number;
  scannedAt: string;
  fileSizeKb?: number;
  notes?: string;
  filterUsed?: 'normal' | 'bw' | 'magic' | 'contrast';
}

export interface OfficialLetter {
  id: string;
  letterNumber: string;
  category: LetterCategory;
  title: string;
  subject: string; // Hal
  enclosure: string; // Lampiran
  letterDate: string;
  city: string;
  // Recipient
  recipientName: string;
  recipientTitle: string;
  recipientCompany: string;
  recipientAddress: string;
  // Content
  openingText: string;
  bodyParagraphs: string[];
  closingText: string;
  // Signatory
  signatoryName: string;
  signatoryTitle: string;
  signatoryNik?: string;
  showStamp: boolean;
  showQrCode?: boolean;
  qrCodeValue?: string;
  // Scanned Physical Attachments (Camera Scan)
  scannedAttachments?: ScannedAttachment[];
  // Status
  status: 'Draft' | 'Diterbitkan' | 'Arsip';
  createdAt: string;
  updatedAt: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  category: LetterCategory;
  description?: string;
  defaultTitle: string;
  defaultSubject: string;
  defaultEnclosure?: string;
  defaultOpeningText: string;
  defaultBodyText: string;
  defaultClosingText: string;
  defaultSignatoryTitle?: string;
  isSystemDefault?: boolean;
  createdAt: string;
}

// --- SYSTEM & SETTINGS ---
export interface CompanyBank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  initialBalance?: number;
}

export interface DocumentSignatory {
  id: string;
  name: string;
  title: string;
  roleType: 'Disiapkan' | 'Diverifikasi' | 'Disetujui' | 'Lainnya';
  division?: string;
  nipOrNik?: string;
  isDefault?: boolean;
  employeeId?: string;
}

export interface CompanyProfile {
  name: string;
  shortName: string;
  tagline: string;
  logoUrl?: string;
  npwp: string;
  nib: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  directorName: string;
  directorTitle: string;
  financeManager: string;
  banks: CompanyBank[];
}

export interface LetterheadSettings {
  headerTitle: string;
  headerSubtitle: string;
  addressLine1: string;
  addressLine2: string;
  contactLine: string;
  logoText: string;
  logoBgColor: string;
  logoUrl?: string;
  showLogo: boolean;
  showDivider: boolean;
  dividerColor: string;
  watermarkText: string;
  showWatermark: boolean;
  footerText: string;
  documentCodePrefix: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  allowedModules?: ModuleType[];
}

export interface SystemSettings {
  defaultCurrency: string;
  fiscalYearStart: string;
  autoApprovalThreshold: number;
  enableEmailAlerts: boolean;
  enableAuditLogging: boolean;
  themePrimaryColor: string;
}

// --- PROJECT ---
export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  contractValue: number;
  rabTotal: number;
  actualCost: number;
  progressPct: number;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  startDate: string;
  endDate: string;
  projectManager: string;
  siteManager?: string;
  location: string;
  category: 'Gedung' | 'Infrastruktur' | 'Jalan & Jembatan' | 'Perumahan' | 'Lainnya';
  retentionPct?: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  wbsCode: string;
  title: string;
  weightPct: number;
  progressPct: number;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Done';
}

export interface VariationOrder {
  id: string;
  projectId: string;
  voNumber: string;
  title: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedDate: string;
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string;
  weather: 'Cerah' | 'Hujan' | 'Mendung';
  activities: string;
  workersCount: number;
  equipmentUsed: string;
  supervisor: string;
}

// --- TENDER & QUOTATION ---
export interface Tender {
  id: string;
  tenderNo: string;
  title: string;
  agency: string;
  budgetEstimate: number;
  submissionDate: string;
  status: 'Draft' | 'Submitted' | 'Winner' | 'Loser';
  notes: string;
  boqTotal: number;
  category: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  clientName: string;
  companyName: string;
  clientAddress?: string;
  projectName: string;
  date: string;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';
  items: QuotationItem[];
  taxPercent: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  notes: string;
  preparedBy?: string;
  approvedBy?: string;
  signatureUrl?: string;
  signatoryTitle?: string;
}

// --- ESTIMATOR & AHSP ---
export interface AHSPItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  unitPrice: number;
}

export interface RABItem {
  id: string;
  section: string;
  itemCode: string;
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  totalPrice: number;
}

// --- MATERIAL & INVENTORY ---
export interface Material {
  id: string;
  sku: string;
  name: string;
  category: 'Semen & Beton' | 'Besi & Baja' | 'Kayu & Papan' | 'Batu & Pasir' | 'Finishing' | 'Pipa & Plambing' | 'Lainnya';
  unit: string;
  stockQty: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  warehouse: string;
  qrCode?: string;
}

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  type: 'IN' | 'OUT' | 'TRANSFER';
  qty: number;
  date: string;
  referenceNo: string;
  notes: string;
  operator: string;
}

// --- PURCHASING ---
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  date: string;
  deliveryDate: string;
  totalAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Received' | 'Rejected';
  items: {
    materialName: string;
    qty: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }[];
  requestedBy: string;
  approvedBy?: string;
  signatureUrl?: string;
  signatoryTitle?: string;
}

// --- TRADING & SALES ---
export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  date: string;
  totalAmount: number;
  paymentStatus: 'Lunas' | 'Belum Bayar' | 'DP / Partial';
  deliveryStatus: 'Dikirim' | 'Diproses' | 'Selesai';
  items: {
    productName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

// --- CRM & LEADS ---
export interface CrmLead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  type: 'Customer' | 'Prospect' | 'Vendor' | 'Supplier';
  stage: 'Lead In' | 'Contacted' | 'Quotation Sent' | 'Negotiation' | 'Deal Won' | 'Deal Lost';
  estimatedValue: number;
  lastFollowUp: string;
  notes: string;
}

// --- EQUIPMENT ---
export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: 'Excavator' | 'Bulldozer' | 'Tower Crane' | 'Dump Truck' | 'Concrete Mixer' | 'Generator' | 'Lainnya';
  operator: string;
  status: 'Ready' | 'In Use' | 'Maintenance' | 'Breakdown';
  operatingHours: number;
  fuelCostThisMonth: number;
  hourlyRate: number;
  currentProject?: string;
  lastServiceDate: string;
}

// --- HR & PAYROLL ---
export interface Employee {
  id: string;
  nik: string;
  name: string;
  position: string;
  division: 'Teknik' | 'Operasional' | 'Keuangan' | 'HRD' | 'Marketing' | 'Logistik';
  status: 'Tetap' | 'Kontrak' | 'Harian';
  basicSalary: number;
  allowance: number;
  bankAccount: string;
  phone: string;
  attendanceDays: number;
  overtimeHours: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Cuti';
  location: string;
  notes?: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  projectOrTask: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
}

export interface PayrollSlip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basicSalary: number;
  allowance: number;
  overtimePay: number;
  bpjsDeduction: number;
  taxPph21: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

// --- FINANCE & CASHFLOW ---
export interface FinanceTransaction {
  id: string;
  trxNo: string;
  type: 'Cash In' | 'Cash Out' | 'Transfer';
  account: 'Kas Utama' | 'Kas Proyek' | 'Bank BCA' | 'Bank Mandiri' | 'Petty Cash';
  amount: number;
  category: 'Pembayaran Proyek' | 'Pembelian Material' | 'Gaji & Payroll' | 'Sewa Alat' | 'Operasional' | 'Lainnya';
  description: string;
  date: string;
  projectId?: string;
  refNo?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  ppnPct?: number; // % PPN (default 11%)
  ppnAmount?: number; // Rp PPN
  pph21Pct?: number; // % PPh 21
  pph21Amount?: number; // Rp PPh 21
  customTaxPct?: number; // Field input persentase pajak kustom (%)
  customTaxAmount?: number; // Rp pajak kustom
}

export interface ProjectInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  clientName: string;
  termName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  pph21Pct?: number;
  pph21Amount?: number;
  customTaxPct?: number;
  customTaxAmount?: number;
  retentionPct?: number; // e.g. 5 (%)
  retentionDeduction?: number; // Potongan Retensi (Rp)
  pphPct?: number; // e.g. 1.75, 2, 4 (%)
  pphAmount?: number; // Potongan PPh (Rp)
  dpDeduction?: number;
  totalAmount: number;
  notes?: string;
  bankAccountId?: string;
  bankAccountDetails?: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentDate?: string;
  paymentRefNo?: string;
  financeTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// --- ACCOUNTING & COA ---
export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
  balance: number;
}

export interface JournalEntry {
  id: string;
  journalNo: string;
  date: string;
  refNo: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  source?: 'Finance' | 'Invoice' | 'PO' | 'Payroll' | 'Manual' | string;
}

// --- APPROVAL WORKFLOW & NOTIFICATIONS ---
export type NotificationType =
  | 'PO_APPROVAL'
  | 'OVER_BUDGET'
  | 'VARIATION_ORDER'
  | 'REMINDER'
  | 'CASHFLOW'
  | 'SYSTEM';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  targetRoles: UserRole[];
  linkModule?: ModuleType;
  relatedId?: string;
  amount?: number;
  senderName?: string;
}

export interface ApprovalRequest {
  id: string;
  reqNo: string;
  type: 'Purchase Order' | 'Anggaran Proyek' | 'Pengeluaran Kas' | 'Variation Order' | 'Payroll' | 'Tender Submisison';
  title: string;
  requestedBy: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
  approvalDate?: string;
  approver?: string;
  notes?: string;
}

// --- SUBKON & SPK BORONGAN ---
export interface SubkonContract {
  id: string;
  spkNumber: string; // e.g. SPK-BOR-2026-001
  subkonName: string; // e.g. PT Subkon Mandiri / Mandor Supardi
  subkonContact?: string;
  projectId: string;
  projectName: string;
  workScope: string;
  contractValue: number; // Nilai Kontrak Borongan (Rp)
  startDate: string;
  endDate: string;
  retentionPct: number; // Default 5%
  dpPct?: number; // Persentase Uang Muka DP (jika ada)
  dpAmount?: number;
  maintenancePeriodDays: number; // Masa Pemeliharaan (misal 90 hari)
  status: 'Draft' | 'Aktif' | 'Masa Pemeliharaan' | 'Selesai';
  notes?: string;
  createdAt: string;
}

export interface SubkonOpname {
  id: string;
  subkonContractId: string;
  opnameNumber: string; // e.g. OPN-001/SPK-001
  opnameDate: string;
  period: string; // e.g. Periode Minggu II - Agustus 2026
  progressPct: number; // Progress akumulasi fisik % (e.g. 40%)
  previousProgressPct: number; // Progress opname sebelumnya % (e.g. 20%)
  currentProgressPct: number; // Progress periode ini % (e.g. 20%)
  grossAmount: number; // Nilai progress periode ini (Rp)
  retentionDeduction: number; // Potongan retensi (misal 5% dari grossAmount)
  dpDeduction: number; // Potongan pengembalian DP (jika ada)
  netAmount: number; // Jumlah bersih dibayarkan (grossAmount - retentionDeduction - dpDeduction)
  notes?: string;
  supervisorName: string;
  status: 'Draft' | 'Approved' | 'Paid';
  createdAt: string;
}

export interface SubkonRetentionRelease {
  id: string;
  subkonContractId: string;
  releaseNumber: string;
  releaseDate: string;
  totalRetentionAmount: number;
  releasedAmount: number;
  status: 'Pending' | 'Approved' | 'Paid';
  notes?: string;
}

// --- DEEP AUDIT TRAIL LOGGING ---
export interface DeepAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  module: ModuleType;
  entityName: string; // e.g. "Tender", "Invoice", "Kontrak Subkon", "Jurnal"
  itemId: string;
  itemTitle?: string;
  fieldName: string; // e.g. "nilai_kontrak", "status", "lampiran_pdf"
  oldValue: string;
  newValue: string;
  reason?: string;
  ipAddress?: string;
  clientVersion?: string;
}

// --- CONCURRENCY & REAL-TIME LOCKING ---
export interface ActiveDocumentLock {
  id: string; // collection:documentId
  collectionName: string;
  docId: string;
  docTitle: string;
  lockedByEmail: string;
  lockedByName: string;
  lockedByRole: UserRole;
  lockedAt: string;
  expiresAt: string;
  versionNumber: number;
}

// --- LARGE FILE CLOUD STORAGE ---
export interface CloudLargeAttachment {
  id: string;
  fileName: string;
  fileSizeMb: number;
  fileType: 'pdf' | 'dwg' | 'xlsx' | 'jpg' | 'png' | 'zip' | 'doc';
  category: 'PDF Tender' | 'Bukti Pembayaran' | 'Foto Opname Fisik' | 'Gambar Kerja CAD' | 'Dokumen Kontrak' | 'Lainnya';
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
  storageProvider: 'Firebase Storage' | 'Google Cloud Storage' | 'Direct Encrypted Link';
  relatedModule: ModuleType;
  relatedEntityId: string;
  relatedEntityName: string;
  isEncrypted: boolean;
}

// --- ENTERPRISE AUTH SESSION ---
export interface AuthSessionConfig {
  authMethod: 'Firebase Auth' | 'Google SSO Enterprise' | 'Role System';
  mfaEnabled: boolean;
  mfaVerified: boolean;
  sessionExpiry: string;
  ipAddress: string;
  tokenHash: string;
}

// --- FORMULIR DINAMIS & FORM BUILDER ---
export type FormCategory =
  | 'K3 & Keselamatan Kerja'
  | 'Mutu & Quality Control'
  | 'Operasional & Laporan Lapangan'
  | 'Logistik & Material'
  | 'Alat Berat & Fleet'
  | 'HRD & Personalia'
  | 'Keuangan & Kas Bon'
  | 'Umum & Administrasi';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'condition' // Baik / Cukup / Rusak or Pass / Fail
  | 'rating' // 1-5 bintang
  | 'photo' // Upload foto bukti lapangan
  | 'signature' // Tanda tangan digital
  | 'heading'; // Header bagian / seksi

export interface CustomFormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: any;
  required: boolean;
  options?: string[]; // for select, radio, condition
  helpText?: string;
  unit?: string; // e.g. m3, zak, kg, titik, jam, orang
  section?: string;
}

export interface CustomForm {
  id: string;
  code: string;
  title: string;
  category: FormCategory;
  description: string;
  icon?: string;
  projectId?: string; // Optional: specific to a project, or generic
  version: number;
  status: 'Active' | 'Draft' | 'Archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fields: CustomFormField[];
  requireSignature?: boolean;
  requirePhoto?: boolean;
  targetApproverRole?: string;
}

export interface FormSubmissionSignature {
  role: string;
  name: string;
  title?: string;
  signatureDataUrl?: string;
  signedAt: string;
}

export interface FormSubmissionPhoto {
  id: string;
  caption?: string;
  dataUrl: string;
  timestamp: string;
}

export interface FormSubmission {
  id: string;
  submissionNumber: string;
  formId: string;
  formCode: string;
  formTitle: string;
  formCategory: FormCategory;
  projectId?: string;
  projectName?: string;
  location?: string;
  submittedBy: string;
  submittedByRole: string;
  submittedByEmail?: string;
  submittedAt: string;
  values: Record<string, any>;
  signatures: FormSubmissionSignature[];
  photos: FormSubmissionPhoto[];
  status: 'Draft' | 'Submitted' | 'In Review' | 'Approved' | 'Rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}



