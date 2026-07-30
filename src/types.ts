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
  | 'bank_accounts'
  | 'accounting'
  | 'approvals'
  | 'reports'
  | 'settings'
  | 'master_data';

// --- SYSTEM & SETTINGS ---
export interface CompanyBank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
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
}

// --- APPROVAL WORKFLOW ---
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
