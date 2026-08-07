import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit3,
  CreditCard,
  Building2,
  Calendar,
  Printer,
  Download,
  Eye,
  Send,
  DollarSign,
  FileText,
  X,
  ChevronDown,
  Check,
  Briefcase,
  User,
  ArrowUpRight,
  Info,
  RotateCcw,
  Percent,
  TrendingUp,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  ProjectInvoice,
  InvoiceItem,
  Project,
  CompanyProfile,
  LetterheadSettings,
} from '../../types';
import { formatRupiah, formatCompactNumber, formatDate, terbilangRupiah } from '../../utils/formatters';
import { generatePdfFromElement, triggerPrintFallback } from '../../utils/pdfGenerator';

interface InvoiceModuleProps {
  invoices: ProjectInvoice[];
  projects: Project[];
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
  onSaveInvoice: (invoice: ProjectInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onMarkInvoiceAsPaid: (
    invoiceId: string,
    paymentDetails: {
      paymentDate: string;
      account: 'Kas Utama' | 'Kas Proyek' | 'Bank BCA' | 'Bank Mandiri' | 'Petty Cash';
      paymentRefNo: string;
      notes?: string;
    }
  ) => void;
  onTriggerNotification?: (notif: {
    type: any;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => void;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  invoices = [],
  projects = [],
  companyProfile,
  letterhead,
  onSaveInvoice,
  onDeleteInvoice,
  onMarkInvoiceAsPaid,
  onTriggerNotification,
}) => {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<ProjectInvoice> | null>(null);

  const [viewingInvoice, setViewingInvoice] = useState<ProjectInvoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async (inv: ProjectInvoice) => {
    setIsGeneratingPdf(true);
    try {
      const filename = `Invoice_${inv.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
      const success = await generatePdfFromElement({
        elementId: 'printable-letter-area',
        filename,
        title: `Invoice Penagihan ${inv.invoiceNumber}`,
      });
      if (!success) {
        triggerPrintFallback(`Invoice ${inv.invoiceNumber}`, document.getElementById('printable-letter-area'));
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      triggerPrintFallback(`Invoice ${inv.invoiceNumber}`, document.getElementById('printable-letter-area'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintWindow = (inv: ProjectInvoice) => {
    triggerPrintFallback(`Invoice ${inv.invoiceNumber}`, document.getElementById('printable-letter-area'));
  };

  const [payingInvoice, setPayingInvoice] = useState<ProjectInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    paymentDate: string;
    account: 'Kas Utama' | 'Kas Proyek' | 'Bank BCA' | 'Bank Mandiri' | 'Petty Cash';
    paymentRefNo: string;
    notes: string;
  }>({
    paymentDate: new Date().toISOString().split('T')[0],
    account: 'Bank BCA',
    paymentRefNo: '',
    notes: '',
  });

  const [deletingId, setDeletingId] = useState<{ id: string; no: string } | null>(null);

  // Form helper: Add/Remove items inside edit form
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);

  // Calculate Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPending = invoices
    .filter((inv) => inv.status === 'Sent' || inv.status === 'Draft')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOverdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const countOverdue = invoices.filter((inv) => inv.status === 'Overdue').length;

  // Chart Display Mode
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Compute monthly invoice aggregation
  const monthlyChartData = useMemo(() => {
    const monthMap: Record<
      string,
      {
        key: string;
        label: string;
        total: number;
        paid: number;
        pending: number;
        overdue: number;
        count: number;
      }
    > = {};

    invoices.forEach((inv) => {
      if (!inv.issueDate) return;
      const dateObj = new Date(inv.issueDate);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agt',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      const label = `${monthNames[month]} ${year}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          key,
          label,
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          count: 0,
        };
      }

      const amt = inv.totalAmount || 0;
      monthMap[key].total += amt;
      monthMap[key].count += 1;

      if (inv.status === 'Paid') {
        monthMap[key].paid += amt;
      } else if (inv.status === 'Overdue') {
        monthMap[key].overdue += amt;
        monthMap[key].pending += amt;
      } else if (inv.status === 'Sent' || inv.status === 'Draft') {
        monthMap[key].pending += amt;
      }
    });

    const sortedKeys = Object.keys(monthMap).sort();

    // Ensure at least last 6 months are visible if fewer entries exist
    if (sortedKeys.length < 6) {
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Agt',
          'Sep',
          'Okt',
          'Nov',
          'Des',
        ];
        const label = `${monthNames[month]} ${year}`;
        if (!monthMap[key]) {
          monthMap[key] = {
            key,
            label,
            total: 0,
            paid: 0,
            pending: 0,
            overdue: 0,
            count: 0,
          };
        }
      }
    }

    return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [invoices]);

  // Derived chart metrics
  const collectionRate = totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : '0.0';
  const peakMonthObj = useMemo(() => {
    if (monthlyChartData.length === 0) return null;
    return [...monthlyChartData].sort((a, b) => b.paid - a.paid)[0];
  }, [monthlyChartData]);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal">Perkembangan Kas</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-white tracking-tight">{formatRupiah(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.termName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesProject = projectFilter === 'ALL' || inv.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Open Create Form
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    const newInvNo = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(
      2,
      '0'
    )}/${String(invoices.length + 1).padStart(3, '0')}`;

    const initialProject = projects[0] || null;

    setEditingInvoice({
      invoiceNumber: newInvNo,
      projectId: initialProject ? initialProject.id : '',
      projectName: initialProject ? initialProject.name : '',
      clientName: initialProject ? initialProject.client : '',
      termName: 'Termijn #1 (DP 20%)',
      issueDate: today,
      dueDate: dueDateStr,
      subtotal: 0,
      taxPct: 11,
      taxAmount: 0,
      retentionDeduction: 0,
      dpDeduction: 0,
      totalAmount: 0,
      status: 'Draft',
      notes: 'Pembayaran mohon ditransfer sesuai rekening resmi perusahaan sebelum tanggal jatuh tempo.',
      bankAccountDetails: 'Bank BCA - 8830192831 a.n. PT BuildX Pro Construct',
    });

    setFormItems([
      {
        id: 'item-1',
        description: 'Pekerjaan Termijn Kemajuan Fisik Lapangan',
        quantity: 1,
        unit: 'ls',
        unitPrice: 1000000000,
        subtotal: 1000000000,
        ppnPct: 11,
        ppnAmount: 110000000,
        pph21Pct: 2.5,
        pph21Amount: 25000000,
        customTaxPct: 0,
        customTaxAmount: 0,
      },
    ]);

    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (inv: ProjectInvoice) => {
    setEditingInvoice({ ...inv });
    const mappedItems = inv.items && inv.items.length > 0
      ? inv.items.map((item) => {
          const sub = item.subtotal || ((item.quantity || 0) * (item.unitPrice || 0));
          const ppnPct = item.ppnPct !== undefined ? item.ppnPct : (inv.taxPct ?? 11);
          const pph21Pct = item.pph21Pct !== undefined ? item.pph21Pct : (inv.pph21Pct ?? 0);
          const customTaxPct = item.customTaxPct !== undefined ? item.customTaxPct : (inv.customTaxPct ?? 0);
          return {
            ...item,
            subtotal: sub,
            ppnPct,
            ppnAmount: item.ppnAmount !== undefined ? item.ppnAmount : (sub * ppnPct) / 100,
            pph21Pct,
            pph21Amount: item.pph21Amount !== undefined ? item.pph21Amount : (sub * pph21Pct) / 100,
            customTaxPct,
            customTaxAmount: item.customTaxAmount !== undefined ? item.customTaxAmount : (sub * customTaxPct) / 100,
          };
        })
      : [];
    setFormItems(mappedItems);
    setIsFormOpen(true);
  };

  // Handle Project Selection in Form
  const handleProjectSelect = (projId: string) => {
    const selProject = projects.find((p) => p.id === projId);
    if (selProject && editingInvoice) {
      setEditingInvoice({
        ...editingInvoice,
        projectId: selProject.id,
        projectName: selProject.name,
        clientName: selProject.client,
      });
    }
  };

  // Item modifications
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...formItems];
    const current = { ...updated[index], [field]: value };

    const q = parseFloat(current.quantity as any) || 0;
    const p = parseFloat(current.unitPrice as any) || 0;
    const sub = q * p;
    current.subtotal = sub;

    const ppnPct = current.ppnPct !== undefined ? (parseFloat(current.ppnPct as any) || 0) : (editingInvoice?.taxPct ?? 11);
    current.ppnPct = ppnPct;
    current.ppnAmount = (sub * ppnPct) / 100;

    const pph21Pct = parseFloat(current.pph21Pct as any) || 0;
    current.pph21Pct = pph21Pct;
    current.pph21Amount = (sub * pph21Pct) / 100;

    const customTaxPct = parseFloat(current.customTaxPct as any) || 0;
    current.customTaxPct = customTaxPct;
    current.customTaxAmount = (sub * customTaxPct) / 100;

    updated[index] = current;
    setFormItems(updated);
  };

  const handleAddItem = () => {
    const defaultPpn = editingInvoice?.taxPct ?? 11;
    const defaultPph21 = editingInvoice?.pph21Pct ?? 0;
    const defaultCustom = editingInvoice?.customTaxPct ?? 0;
    setFormItems([
      ...formItems,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'ls',
        unitPrice: 0,
        subtotal: 0,
        ppnPct: defaultPpn,
        ppnAmount: 0,
        pph21Pct: defaultPph21,
        pph21Amount: 0,
        customTaxPct: defaultCustom,
        customTaxAmount: 0,
      },
    ]);
  };

  const handleApplyTaxToAllItems = (taxType: 'ppn' | 'pph21' | 'custom', percentage: number) => {
    const updated = formItems.map((item) => {
      const q = parseFloat(item.quantity as any) || 0;
      const p = parseFloat(item.unitPrice as any) || 0;
      const sub = q * p;
      const newItem = { ...item, subtotal: sub };

      if (taxType === 'ppn') {
        newItem.ppnPct = percentage;
        newItem.ppnAmount = (sub * percentage) / 100;
      } else if (taxType === 'pph21') {
        newItem.pph21Pct = percentage;
        newItem.pph21Amount = (sub * percentage) / 100;
      } else if (taxType === 'custom') {
        newItem.customTaxPct = percentage;
        newItem.customTaxAmount = (sub * percentage) / 100;
      }

      return newItem;
    });
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Submit Save Invoice
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice || !editingInvoice.projectId) return;

    const itemsSubtotal = formItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const totalPpn = formItems.reduce(
      (acc, item) => acc + (item.ppnAmount ?? ((item.subtotal * (item.ppnPct ?? 11)) / 100)),
      0
    );
    const totalPph21 = formItems.reduce(
      (acc, item) => acc + (item.pph21Amount ?? ((item.subtotal * (item.pph21Pct ?? 0)) / 100)),
      0
    );
    const totalCustomTax = formItems.reduce(
      (acc, item) => acc + (item.customTaxAmount ?? ((item.subtotal * (item.customTaxPct ?? 0)) / 100)),
      0
    );

    const taxPct = editingInvoice.taxPct ?? 11;

    const retentionPct = editingInvoice.retentionPct ?? 5;
    const retention = editingInvoice.retentionDeduction !== undefined
      ? editingInvoice.retentionDeduction
      : (itemsSubtotal * retentionPct) / 100;

    const pphPct = editingInvoice.pphPct ?? 0;
    const pph = editingInvoice.pphAmount !== undefined
      ? editingInvoice.pphAmount
      : (itemsSubtotal * pphPct) / 100;

    const dp = editingInvoice.dpDeduction || 0;
    const grandTotal = Math.max(0, itemsSubtotal + totalPpn + totalCustomTax - totalPph21 - retention - pph - dp);

    const now = new Date().toISOString();

    const invoiceToSave: ProjectInvoice = {
      id: editingInvoice.id || `inv-${Date.now()}`,
      invoiceNumber: editingInvoice.invoiceNumber || `INV-${Date.now()}`,
      projectId: editingInvoice.projectId,
      projectName: editingInvoice.projectName || '',
      clientName: editingInvoice.clientName || '',
      termName: editingInvoice.termName || 'Termijn Payment',
      issueDate: editingInvoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: editingInvoice.dueDate || new Date().toISOString().split('T')[0],
      items: formItems,
      subtotal: itemsSubtotal,
      taxPct: taxPct,
      taxAmount: totalPpn,
      pph21Pct: editingInvoice.pph21Pct,
      pph21Amount: totalPph21,
      customTaxPct: editingInvoice.customTaxPct,
      customTaxAmount: totalCustomTax,
      retentionPct: retentionPct,
      retentionDeduction: retention,
      pphPct: pphPct,
      pphAmount: pph,
      dpDeduction: dp,
      totalAmount: grandTotal,
      notes: editingInvoice.notes || '',
      bankAccountDetails:
        editingInvoice.bankAccountDetails || 'Bank Mandiri / BCA PT BuildX Pro Construct',
      status: (editingInvoice.status as any) || 'Draft',
      createdAt: editingInvoice.createdAt || now,
      updatedAt: now,
    };

    onSaveInvoice(invoiceToSave);

    if (onTriggerNotification) {
      onTriggerNotification({
        type: 'SYSTEM',
        title: editingInvoice.id ? 'Invoice Diperbarui' : 'Invoice Baru Diterbitkan',
        message: `Invoice ${invoiceToSave.invoiceNumber} (${invoiceToSave.termName}) untuk ${invoiceToSave.clientName} sebesar ${formatRupiah(
          invoiceToSave.totalAmount
        )} telah disimpan.`,
        priority: 'medium',
      });
    }

    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  // Submit Mark as Paid
  const handleConfirmPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    const refNo = paymentForm.paymentRefNo || `TRX/IN/${Date.now().toString().slice(-6)}`;

    onMarkInvoiceAsPaid(payingInvoice.id, {
      paymentDate: paymentForm.paymentDate,
      account: paymentForm.account,
      paymentRefNo: refNo,
      notes: paymentForm.notes,
    });

    if (onTriggerNotification) {
      onTriggerNotification({
        type: 'CASHFLOW',
        title: 'Pelunasan Invoice Berhasil',
        message: `Invoice ${payingInvoice.invoiceNumber} telah dilunasi via ${paymentForm.account}. Transaksi Cash In sebesar ${formatRupiah(
          payingInvoice.totalAmount
        )} telah dicatat otomatis ke Keuangan/Finance.`,
        priority: 'high',
      });
    }

    setPayingInvoice(null);
  };

  // Calculate live calculations inside Modal
  const currentItemsSubtotal = formItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  const currentTotalPpnAmount = formItems.reduce(
    (acc, item) => acc + (item.ppnAmount ?? ((item.subtotal * (item.ppnPct ?? 11)) / 100)),
    0
  );
  const currentTotalPph21Amount = formItems.reduce(
    (acc, item) => acc + (item.pph21Amount ?? ((item.subtotal * (item.pph21Pct ?? 0)) / 100)),
    0
  );
  const currentTotalCustomTaxAmount = formItems.reduce(
    (acc, item) => acc + (item.customTaxAmount ?? ((item.subtotal * (item.customTaxPct ?? 0)) / 100)),
    0
  );

  const currentRetentionPct = editingInvoice?.retentionPct ?? 5;
  const currentRetention = editingInvoice?.retentionDeduction !== undefined
    ? editingInvoice.retentionDeduction
    : (currentItemsSubtotal * currentRetentionPct) / 100;

  const currentPphPct = editingInvoice?.pphPct ?? 0;
  const currentPph = editingInvoice?.pphAmount !== undefined
    ? editingInvoice.pphAmount
    : (currentItemsSubtotal * currentPphPct) / 100;

  const currentDp = editingInvoice?.dpDeduction || 0;
  const currentGrandTotal = Math.max(
    0,
    currentItemsSubtotal + currentTotalPpnAmount + currentTotalCustomTaxAmount - currentTotalPph21Amount - currentRetention - currentPph - currentDp
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Invoicing & Tagihan Proyek
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                ERP Integrated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola termijn tagihan klien, status pelunasan, dan pencatatan transaksi kas masuk otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tagihan Diterbitkan</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-3">{formatRupiah(totalInvoiced)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{invoices.length} Dokumen Invoice</p>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-400/40 rounded-r-2xl" />
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Terbayar (Cash In)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-600 mt-3">{formatRupiah(totalPaid)}</p>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">
            {invoices.filter((i) => i.status === 'Paid').length} Invoice Lunas
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 rounded-r-2xl" />
        </div>

        {/* Total Outstanding / Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Piutang / Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-600 mt-3">{formatRupiah(totalPending)}</p>
          <p className="text-[11px] text-amber-600/80 font-medium mt-1">
            {invoices.filter((i) => i.status === 'Sent' || i.status === 'Draft').length} Menunggu Pelunasan
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 rounded-r-2xl" />
        </div>

        {/* Total Overdue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jatuh Tempo (Overdue)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-rose-600 mt-3">{formatRupiah(totalOverdue)}</p>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            {countOverdue} Invoice Perlu Follow-up
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 rounded-r-2xl" />
        </div>
      </div>

      {/* Monthly Invoicing & Cash In Visual Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Visualisasi Total Invoice & Arus Masuk Kas (Cash In) Per Bulan
              </h2>
              <p className="text-xs text-slate-500">
                Monitoring realisasi pembayaran tagihan lunas vs tagihan diterbitkan untuk estimasi likuiditas perusahaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartType === 'bar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartType === 'area'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Area Chart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="total"
                  name="Total Invoice Diterbitkan"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="paid"
                  name="Realisasi Cash In (Paid)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="pending"
                  name="Piutang / Pending"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Invoice Diterbitkan"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  name="Realisasi Cash In (Paid)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPaid)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer Metrics Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Tingkat Pelunasan (Collection Rate):</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              {collectionRate}%
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Rata-rata Tagihan / Bulan:</span>
            <span className="font-bold text-indigo-600">
              {formatRupiah(totalInvoiced / (monthlyChartData.length || 1))}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Puncak Cash In:</span>
            <span className="font-bold text-slate-800">
              {peakMonthObj ? `${peakMonthObj.label} (${formatRupiah(peakMonthObj.paid)})` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no invoice, proyek, atau klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Dikirim (Sent)</option>
              <option value="Paid">Lunas (Paid)</option>
              <option value="Overdue">Jatuh Tempo (Overdue)</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Proyek:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-900">Daftar Tagihan & Invoice</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {filteredInvoices.length} Ditemukan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3.5 px-4">No. Invoice</th>
                <th className="py-3.5 px-4">Proyek & Klien</th>
                <th className="py-3.5 px-4">Termijn / Stage</th>
                <th className="py-3.5 px-4">Tgl Terbit & Due</th>
                <th className="py-3.5 px-4 text-right">Nilai Tagihan (Rp)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold">Tidak ada data invoice</p>
                    <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau filter status</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'Paid';
                  const isOverdue = inv.status === 'Overdue';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {inv.items ? inv.items.length : 0} Rincian Item
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={inv.projectName}>
                          {inv.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={inv.clientName}>
                          Klien: <strong className="text-slate-700 font-medium">{inv.clientName}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                          {inv.termName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{formatDate(inv.issueDate)}</div>
                        <div
                          className={`text-[10px] ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                          }`}
                        >
                          Due: {formatDate(inv.dueDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900">{formatRupiah(inv.totalAmount)}</div>
                        <div className="text-[10px] text-slate-400">
                          PPN ({inv.taxPct}%): {formatRupiah(inv.taxAmount)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'Draft' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                        {inv.status === 'Sent' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Dikirim
                          </span>
                        )}
                        {inv.status === 'Paid' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Lunas
                          </span>
                        )}
                        {inv.status === 'Overdue' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                        {inv.status === 'Cancelled' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Batal
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Cetak PDF Button */}
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition flex items-center gap-1 border border-indigo-200/80 shadow-xs"
                            title="Cetak / Preview PDF Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Cetak PDF</span>
                          </button>

                          {/* Edit Invoice (Draft/Sent/Overdue) */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Data Invoice"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Mark Paid Button */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentForm({
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  account: 'Bank BCA',
                                  paymentRefNo: `TRX/IN/${Date.now().toString().slice(-6)}`,
                                  notes: `Pelunasan invoice ${inv.invoiceNumber}`,
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center gap-1"
                              title="Tandai Lunas"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pelunasan</span>
                            </button>
                          )}

                          {/* Delete Invoice */}
                          <button
                            type="button"
                            onClick={() => setDeletingId({ id: inv.id, no: inv.invoiceNumber })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Create / Edit Invoice */}
      {isFormOpen && editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingInvoice.id ? 'Edit Dokumen Invoice' : 'Buat Invoice Proyek Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi data rincian penagihan termijn proyek
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingInvoice(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Project & Client Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Proyek *</label>
                  <select
                    required
                    value={editingInvoice.projectId || ''}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 bg-white"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Klien / Owner</label>
                  <input
                    type="text"
                    readOnly
                    value={editingInvoice.clientName || ''}
                    placeholder="Otomatis dari data proyek"
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl p-2.5 font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Invoice Number, Term Name, Issue & Due Dates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Invoice *</label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.invoiceNumber || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Termijn / Tahap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Termijn #1 (DP 20%)"
                    value={editingInvoice.termName || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, termName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Terbit *</label>
                  <input
                    type="date"
                    required
                    value={editingInvoice.issueDate || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, issueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jatuh Tempo *</label>
                  <input
                    type="date"
                    required
                    value={editingInvoice.dueDate || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Items Table with Per-Item Tax Breakdown */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Rincian Item & Kalkulasi Pajak Per Baris</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Deskripsi, volume, PPN 11%, PPh 21, dan persentase pajak kustom per item)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] transition flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                {/* Batch apply tax bar */}
                <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-indigo-900 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    Terapkan Cepat Ke Semua Item:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                      <span className="text-slate-600 font-semibold">PPN:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('ppn', 11)}
                        className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[10px]"
                      >
                        11%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('ppn', 12)}
                        className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[10px]"
                      >
                        12%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('ppn', 0)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px]"
                      >
                        0%
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                      <span className="text-slate-600 font-semibold">PPh 21:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('pph21', 2.5)}
                        className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold text-[10px]"
                      >
                        2.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('pph21', 5)}
                        className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold text-[10px]"
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTaxToAllItems('pph21', 0)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px]"
                      >
                        0%
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                      <span className="text-slate-600 font-semibold">Kustom:</span>
                      <input
                        type="number"
                        placeholder="%"
                        step="0.1"
                        className="w-12 border border-slate-200 rounded px-1 py-0.5 text-center text-[10px] font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                            handleApplyTaxToAllItems('custom', val);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const val = parseFloat(input.value) || 0;
                          handleApplyTaxToAllItems('custom', val);
                        }}
                        className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[10px]"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Deskripsi Pekerjaan</th>
                        <th className="p-2.5 w-28 text-center">Vol & Satuan</th>
                        <th className="p-2.5 w-32 text-right">Harga Satuan (Rp)</th>
                        <th className="p-2.5 w-32 text-right">Subtotal (Rp)</th>
                        <th className="p-2.5 w-28 text-center bg-blue-50/50 text-blue-900">PPN 11%</th>
                        <th className="p-2.5 w-28 text-center bg-amber-50/50 text-amber-900">PPh 21 (%)</th>
                        <th className="p-2.5 w-28 text-center bg-indigo-50/50 text-indigo-900">Pajak Kustom</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {formItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="Deskripsi item penagihan..."
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-14 border border-slate-200 rounded-lg p-1 text-xs text-center font-bold"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                placeholder="ls"
                                className="w-12 border border-slate-200 rounded-lg p-1 text-xs text-center text-slate-600"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-right font-medium"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatRupiah(item.subtotal || 0)}
                          </td>
                          <td className="p-2 text-center bg-blue-50/30">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={item.ppnPct ?? 11}
                                  onChange={(e) => handleItemChange(idx, 'ppnPct', parseFloat(e.target.value) || 0)}
                                  className="w-12 border border-blue-200 rounded p-0.5 text-[11px] text-center font-bold text-blue-700 bg-white"
                                />
                                <span className="text-[10px] text-blue-600 font-bold">%</span>
                              </div>
                              <span className="text-[10px] text-blue-700 font-medium">
                                +{formatRupiah(item.ppnAmount || ((item.subtotal * (item.ppnPct ?? 11)) / 100))}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center bg-amber-50/30">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={item.pph21Pct ?? 0}
                                  onChange={(e) => handleItemChange(idx, 'pph21Pct', parseFloat(e.target.value) || 0)}
                                  className="w-12 border border-amber-200 rounded p-0.5 text-[11px] text-center font-bold text-amber-800 bg-white"
                                  placeholder="0"
                                />
                                <span className="text-[10px] text-amber-700 font-bold">%</span>
                              </div>
                              <span className="text-[10px] text-amber-800 font-medium">
                                -{formatRupiah(item.pph21Amount || ((item.subtotal * (item.pph21Pct ?? 0)) / 100))}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center bg-indigo-50/30">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={item.customTaxPct ?? 0}
                                  onChange={(e) => handleItemChange(idx, 'customTaxPct', parseFloat(e.target.value) || 0)}
                                  className="w-12 border border-indigo-200 rounded p-0.5 text-[11px] text-center font-bold text-indigo-700 bg-white"
                                  placeholder="0"
                                />
                                <span className="text-[10px] text-indigo-600 font-bold">%</span>
                              </div>
                              <span className="text-[10px] text-indigo-700 font-medium">
                                +{formatRupiah(item.customTaxAmount || ((item.subtotal * (item.customTaxPct ?? 0)) / 100))}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Hapus baris item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Taxes, Retention & Deduction Calculations */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Ringkasan Pajak PPh/PPN, Retensi 5% & Net Invoice
                  </h4>
                  <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Kalkulasi Otomatis Berjalan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* PPN TOTAL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Akumulasi PPN
                    </span>
                    <p className="text-sm font-black text-blue-700">
                      +{formatRupiah(currentTotalPpnAmount)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Dihitung dari PPN tiap baris item
                    </p>
                  </div>

                  {/* PPH 21 TOTAL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Akumulasi PPh 21
                    </span>
                    <p className="text-sm font-black text-amber-700">
                      -{formatRupiah(currentTotalPph21Amount)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Dipotong dari PPh 21 tiap baris item
                    </p>
                  </div>

                  {/* RETENSI 5% */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-rose-800">Retensi Proyek (%)</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const pct = 5;
                            const amt = (currentItemsSubtotal * pct) / 100;
                            setEditingInvoice({ ...editingInvoice, retentionPct: pct, retentionDeduction: amt });
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${editingInvoice.retentionPct === 5 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}
                        >
                          5%
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingInvoice({ ...editingInvoice, retentionPct: 0, retentionDeduction: 0 })}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${editingInvoice.retentionPct === 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          0%
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="%"
                          value={editingInvoice.retentionPct ?? 5}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const amt = (currentItemsSubtotal * pct) / 100;
                            setEditingInvoice({
                              ...editingInvoice,
                              retentionPct: pct,
                              retentionDeduction: amt,
                            });
                          }}
                          className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-rose-700 text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Rp"
                          value={editingInvoice.retentionDeduction ?? currentRetention}
                          onChange={(e) =>
                            setEditingInvoice({
                              ...editingInvoice,
                              retentionDeduction: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-rose-700"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-rose-600 font-semibold">
                      Potongan Retensi: <span className="font-bold">- {formatRupiah(currentRetention)}</span>
                    </p>
                  </div>

                  {/* PPh Final & Pengembalian DP */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Pengembalian DP (Rp)</label>
                    <input
                      type="number"
                      value={editingInvoice.dpDeduction || 0}
                      onChange={(e) =>
                        setEditingInvoice({
                          ...editingInvoice,
                          dpDeduction: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-slate-800"
                    />
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Pengembalian DP: <span className="font-bold">- {formatRupiah(currentDp)}</span>
                    </p>
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 font-medium shadow-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Gross Pekerjaan:</span>
                    <span className="font-bold">{formatRupiah(currentItemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Akumulasi PPN (Item Level):</span>
                    <span className="font-bold">+ {formatRupiah(currentTotalPpnAmount)}</span>
                  </div>
                  {currentTotalPph21Amount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Akumulasi Potongan PPh 21 (Item Level):</span>
                      <span className="font-bold">- {formatRupiah(currentTotalPph21Amount)}</span>
                    </div>
                  )}
                  {currentTotalCustomTaxAmount > 0 && (
                    <div className="flex justify-between text-indigo-700">
                      <span>Akumulasi Pajak Kustom (Item Level):</span>
                      <span className="font-bold">+ {formatRupiah(currentTotalCustomTaxAmount)}</span>
                    </div>
                  )}
                  {currentRetention > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Potongan Retensi ({currentRetentionPct}%):</span>
                      <span className="font-bold">- {formatRupiah(currentRetention)}</span>
                    </div>
                  )}
                  {currentPph > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Potongan PPh Final/Jasa ({currentPphPct}%):</span>
                      <span className="font-bold">- {formatRupiah(currentPph)}</span>
                    </div>
                  )}
                  {currentDp > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Potongan Pengembalian DP:</span>
                      <span className="font-bold">- {formatRupiah(currentDp)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-indigo-900">
                    <span>TOTAL TAGIHAN BERSIH (NET INVOICE):</span>
                    <span className="text-emerald-700 text-base">{formatRupiah(currentGrandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Status & Bank Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rekening Pembayaran Klien</label>
                  <input
                    type="text"
                    value={editingInvoice.bankAccountDetails || ''}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, bankAccountDetails: e.target.value })
                    }
                    placeholder="Nama bank & No. Rekening penerima"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Dokumen</label>
                  <select
                    value={editingInvoice.status || 'Draft'}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, status: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 bg-white"
                  >
                    <option value="Draft">Draft (Internal)</option>
                    <option value="Sent">Dikirim ke Klien (Sent)</option>
                    <option value="Paid">Lunas (Paid)</option>
                    <option value="Overdue">Jatuh Tempo (Overdue)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Syarat Pembayaran</label>
                <textarea
                  rows={2}
                  value={editingInvoice.notes || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  placeholder="Catatan tambahan untuk klien..."
                />
              </div>

              {/* Actions Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mark as Paid */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Pelunasan Tagihan Invoice</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfirmasi penerimaan pembayaran dari Klien
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Invoice:</span>
                <span className="font-bold text-slate-900">{payingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proyek:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {payingInvoice.projectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Klien:</span>
                <span className="font-semibold text-slate-800">{payingInvoice.clientName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1 font-black text-sm text-emerald-700">
                <span>Nilai Pelunasan:</span>
                <span>{formatRupiah(payingInvoice.totalAmount)}</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Menandai lunas invoice ini secara otomatis akan mencatat transaksi <strong>Cash In</strong> pada modul <strong>Finance & Cashflow</strong> sebesar {formatRupiah(payingInvoice.totalAmount)}.
              </p>
            </div>

            <form onSubmit={handleConfirmPaid} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pelunasan / Masuk *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Akun Kas / Bank Penerima *</label>
                <select
                  value={paymentForm.account}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, account: e.target.value as any })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 bg-white"
                >
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Kas Utama">Kas Utama</option>
                  <option value="Kas Proyek">Kas Proyek</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Referensi Transaksi / Transfer</label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-BCA-9881273 / Bukti Transfer"
                  value={paymentForm.paymentRefNo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentRefNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pelunasan via Transfer Bank BCA"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Lunas & Catat Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Printable Official Invoice View */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-4 sm:my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header Action Bar */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-black text-xs uppercase tracking-wider">
                  FAKTUR PENAGIHAN KLIEN
                </span>
                <span className="text-sm font-extrabold text-slate-800">| {viewingInvoice.invoiceNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleDownloadPdf(viewingInvoice)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh File PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintWindow(viewingInvoice)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="p-4 sm:p-8 bg-slate-100 flex justify-center">
              {/* Print Content Document */}
              <div
                id="printable-letter-area"
                className="w-full max-w-3xl bg-white p-6 sm:p-12 border border-slate-200 rounded-xl shadow-lg space-y-6 text-slate-900 font-['Roboto',sans-serif] leading-relaxed text-xs print:p-0 print:border-none print:shadow-none print:w-full"
              >
                {/* Header / Kop Surat */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-4">
                    {companyProfile?.logoUrl ? (
                      <img
                        src={companyProfile.logoUrl}
                        alt="Logo Perusahaan"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-indigo-950 text-white font-black text-xl flex items-center justify-center rounded-xl shrink-0 shadow-sm border border-amber-400">
                        {companyProfile?.shortName ? companyProfile.shortName.substring(0, 3).toUpperCase() : 'BX'}
                      </div>
                    )}
                    <div>
                      <h2 className="font-black text-lg text-slate-900 tracking-tight uppercase">
                        {companyProfile?.name || 'PT BUILDX PRO CONSTRUCT'}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-sm leading-relaxed">
                        {companyProfile?.address || 'Jl. Jendral Sudirman No. 45, Tower Utama Lt. 12, Jakarta'}
                        <br />
                        Telp: {companyProfile?.phone || '021-5549882'} | Email: {companyProfile?.email || 'finance@buildxpro.co.id'}
                        <br />
                        NPWP: {companyProfile?.npwp || '01.234.567.8-012.000'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase">INVOICE</h1>
                    <p className="text-sm font-extrabold text-indigo-700 mt-0.5">{viewingInvoice.invoiceNumber}</p>
                    <div className="mt-2 inline-block">
                      {viewingInvoice.status === 'Paid' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider">
                          LUNAS / PAID
                        </span>
                      )}
                      {viewingInvoice.status === 'Sent' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
                          MENUNGGU PEMBAYARAN
                        </span>
                      )}
                      {viewingInvoice.status === 'Overdue' && (
                        <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-black uppercase tracking-wider">
                          JATUH TEMPO
                        </span>
                      )}
                      {viewingInvoice.status === 'Draft' && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-black uppercase tracking-wider">
                          DRAFT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill To & Invoice Info */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Ditagihkan Kepada (Bill To):
                    </p>
                    <p className="font-extrabold text-sm text-slate-900">{viewingInvoice.clientName}</p>
                    <p className="text-slate-600 mt-0.5 font-medium">Proyek: {viewingInvoice.projectName}</p>
                    <p className="text-slate-500 mt-0.5">Tahap: <strong>{viewingInvoice.termName}</strong></p>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="flex justify-end gap-3">
                      <span className="text-slate-500">Tanggal Terbit:</span>
                      <span className="font-bold text-slate-800">{formatDate(viewingInvoice.issueDate)}</span>
                    </div>
                    <div className="flex justify-end gap-3">
                      <span className="text-slate-500">Jatuh Tempo:</span>
                      <span className="font-bold text-slate-800">{formatDate(viewingInvoice.dueDate)}</span>
                    </div>
                    {viewingInvoice.paymentDate && (
                      <div className="flex justify-end gap-3 text-emerald-700">
                        <span>Tanggal Pelunasan:</span>
                        <span className="font-bold">{formatDate(viewingInvoice.paymentDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 text-center w-8">No</th>
                        <th className="p-2.5">Deskripsi Pekerjaan / Layanan</th>
                        <th className="p-2.5 text-center w-20">Vol / Sat</th>
                        <th className="p-2.5 text-right w-28">Harga (Rp)</th>
                        <th className="p-2.5 text-right w-28">Subtotal (Rp)</th>
                        <th className="p-2.5 text-center w-24 bg-blue-50/50">PPN</th>
                        <th className="p-2.5 text-center w-24 bg-amber-50/50">PPh 21</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                        viewingInvoice.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="p-2.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
                            <td className="p-2.5 text-center font-bold text-slate-700">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-2.5 text-right font-medium text-slate-700">
                              {formatRupiah(item.unitPrice)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(item.subtotal)}
                            </td>
                            <td className="p-2.5 text-center bg-blue-50/20 text-blue-900 font-medium">
                              {item.ppnPct ? `${item.ppnPct}% (+${formatRupiah(item.ppnAmount || 0)})` : '0%'}
                            </td>
                            <td className="p-2.5 text-center bg-amber-50/20 text-amber-900 font-medium">
                              {item.pph21Pct ? `${item.pph21Pct}% (-${formatRupiah(item.pph21Amount || 0)})` : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            Tidak ada rincian item
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Calculations */}
                <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Petunjuk Pembayaran / Rekening</span>
                    </p>
                    <p className="text-slate-700 font-semibold bg-white p-2.5 rounded-lg border border-slate-200">
                      {viewingInvoice.bankAccountDetails || 'Bank BCA - 8830192831 a.n. PT BuildX Pro Construct'}
                    </p>
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                      * {viewingInvoice.notes || 'Mohon melampirkan bukti transfer saat melakukan pelunasan.'}
                    </p>
                  </div>

                  <div className="w-full md:w-80 space-y-2 text-xs font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Gross Pekerjaan:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(viewingInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span>Total PPN:</span>
                      <span className="font-bold">+ {formatRupiah(viewingInvoice.taxAmount)}</span>
                    </div>
                    {viewingInvoice.items?.some(i => i.pph21Amount && i.pph21Amount > 0) ? (
                      <div className="flex justify-between text-amber-700">
                        <span>Total Potongan PPh 21 (Item):</span>
                        <span className="font-bold">
                          - {formatRupiah(viewingInvoice.items.reduce((s, i) => s + (i.pph21Amount || 0), 0))}
                        </span>
                      </div>
                    ) : null}
                    {viewingInvoice.retentionDeduction ? (
                      <div className="flex justify-between text-rose-600">
                        <span>Potongan Retensi ({viewingInvoice.retentionPct ?? 5}%):</span>
                        <span className="font-bold">- {formatRupiah(viewingInvoice.retentionDeduction)}</span>
                      </div>
                    ) : null}
                    {viewingInvoice.pphAmount ? (
                      <div className="flex justify-between text-amber-700">
                        <span>Potongan PPh Final/23 ({viewingInvoice.pphPct ?? 0}%):</span>
                        <span className="font-bold">- {formatRupiah(viewingInvoice.pphAmount)}</span>
                      </div>
                    ) : null}
                    {viewingInvoice.dpDeduction ? (
                      <div className="flex justify-between text-slate-600">
                        <span>Pengembalian Uang Muka DP:</span>
                        <span className="font-bold">- {formatRupiah(viewingInvoice.dpDeduction)}</span>
                      </div>
                    ) : null}

                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-base text-slate-900">
                      <span>TOTAL TAGIHAN BERSIH:</span>
                      <span className="text-indigo-900">{formatRupiah(viewingInvoice.totalAmount)}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 italic text-right pt-1">
                      Terbilang: <strong className="text-slate-800 font-bold">{terbilangRupiah(viewingInvoice.totalAmount)}</strong>
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Diterima oleh Klien,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-8">
                      ( {viewingInvoice.clientName} )
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      {companyProfile?.city || 'Jakarta'}, {formatDate(viewingInvoice.issueDate)}
                    </p>
                    <p className="text-slate-500">Hormat Kami,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-8">
                      ( {companyProfile?.financeManager || 'Manager Keuangan'} )
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Action Bar */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Siap mencetak atau mengunduh invoice {viewingInvoice.invoiceNumber}?
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleDownloadPdf(viewingInvoice)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh File PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintWindow(viewingInvoice)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Invoice</h3>
                <p className="text-xs text-slate-500">Tindakan tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus invoice <strong>"{deletingId.no}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvoice(deletingId.id);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function renderPrintableInvoiceView(
  invoice: ProjectInvoice,
  companyProfile?: CompanyProfile,
  letterhead?: LetterheadSettings
): React.ReactNode {
  return (
    <div
      id="printable-letter-area"
      className="space-y-6 text-slate-900 bg-white p-8 sm:p-12 border border-slate-200 rounded-xl shadow-sm font-['Roboto',sans-serif] leading-relaxed text-xs print:p-0 print:border-none print:shadow-none"
    >
      {/* Header / Kop Surat */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          {companyProfile?.logoUrl ? (
            <img
              src={companyProfile.logoUrl}
              alt="Logo Perusahaan"
              className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 bg-indigo-950 text-white font-black text-xl flex items-center justify-center rounded-xl shrink-0 shadow-sm border border-amber-400">
              {companyProfile?.shortName ? companyProfile.shortName.substring(0, 3).toUpperCase() : 'BX'}
            </div>
          )}
          <div>
            <h2 className="font-black text-lg text-slate-900 tracking-tight uppercase">
              {companyProfile?.name || letterhead?.headerTitle || 'PT BUILDX PRO CONSTRUCT'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-sm leading-relaxed">
              {companyProfile?.address ||
                (letterhead?.addressLine1 ? `${letterhead.addressLine1} ${letterhead.addressLine2 || ''}` : 'Jl. Jendral Sudirman No. 45, Tower Utama Lt. 12, Jakarta')}
              <br />
              {companyProfile?.phone
                ? `Telp: ${companyProfile.phone} | Email: ${companyProfile.email}`
                : letterhead?.contactLine || 'Telp: 021-5549882 | Email: finance@buildxpro.co.id'}
              <br />
              NPWP: {companyProfile?.npwp || '01.234.567.8-012.000'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase">INVOICE</h1>
          <p className="text-sm font-extrabold text-indigo-700 mt-0.5">{invoice.invoiceNumber}</p>
          <div className="mt-2 inline-block">
            {invoice.status === 'Paid' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider">
                LUNAS / PAID
              </span>
            )}
            {invoice.status === 'Sent' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
                MENUNGGU PEMBAYARAN
              </span>
            )}
            {invoice.status === 'Overdue' && (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-black uppercase tracking-wider">
                JATUH TEMPO
              </span>
            )}
            {invoice.status === 'Draft' && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-black uppercase tracking-wider">
                DRAFT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Invoice Info */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Ditagihkan Kepada (Bill To):
          </p>
          <p className="font-extrabold text-sm text-slate-900">{invoice.clientName}</p>
          <p className="text-slate-600 mt-0.5 font-medium">Proyek: {invoice.projectName}</p>
          <p className="text-slate-500 mt-0.5">Tahap: <strong>{invoice.termName}</strong></p>
        </div>

        <div className="space-y-1 text-right">
          <div className="flex justify-end gap-3">
            <span className="text-slate-500">Tanggal Terbit:</span>
            <span className="font-bold text-slate-800">{formatDate(invoice.issueDate)}</span>
          </div>
          <div className="flex justify-end gap-3">
            <span className="text-slate-500">Jatuh Tempo:</span>
            <span className="font-bold text-slate-800">{formatDate(invoice.dueDate)}</span>
          </div>
          {invoice.paymentDate && (
            <div className="flex justify-end gap-3 text-emerald-700">
              <span>Tanggal Pelunasan:</span>
              <span className="font-bold">{formatDate(invoice.paymentDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Deskripsi Pekerjaan / Layanan</th>
              <th className="p-3 text-center">Volume</th>
              <th className="p-3 text-center">Satuan</th>
              <th className="p-3 text-right">Harga Satuan (Rp)</th>
              <th className="p-3 text-right">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="p-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                  <td className="p-3 text-center font-bold text-slate-700">{item.quantity}</td>
                  <td className="p-3 text-center text-slate-600">{item.unit}</td>
                  <td className="p-3 text-right font-medium text-slate-700">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400">
                  Tidak ada rincian item
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Calculations */}
      <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Petunjuk Pembayaran / Rekening</span>
          </p>
          <p className="text-slate-700 font-semibold bg-white p-2.5 rounded-lg border border-slate-200">
            {invoice.bankAccountDetails || 'Bank BCA - 8830192831 a.n. PT BuildX Pro Construct'}
          </p>
          <p className="text-[11px] text-slate-500 italic leading-relaxed">
            * {invoice.notes || 'Mohon melampirkan bukti transfer saat melakukan pelunasan.'}
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2 text-xs font-medium">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Pekerjaan:</span>
            <span className="font-bold text-slate-900">{formatRupiah(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>PPN ({invoice.taxPct}%):</span>
            <span className="font-bold text-slate-900">+ {formatRupiah(invoice.taxAmount)}</span>
          </div>
          {invoice.retentionDeduction ? (
            <div className="flex justify-between text-rose-600">
              <span>Potongan Retensi ({invoice.retentionPct ?? 5}%):</span>
              <span className="font-bold">- {formatRupiah(invoice.retentionDeduction)}</span>
            </div>
          ) : null}
          {invoice.pphAmount ? (
            <div className="flex justify-between text-amber-700">
              <span>Potongan PPh ({invoice.pphPct ?? 0}%):</span>
              <span className="font-bold">- {formatRupiah(invoice.pphAmount)}</span>
            </div>
          ) : null}
          {invoice.dpDeduction ? (
            <div className="flex justify-between text-slate-600">
              <span>Pengembalian DP:</span>
              <span className="font-bold">- {formatRupiah(invoice.dpDeduction)}</span>
            </div>
          ) : null}

          <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-base text-slate-900">
            <span>TOTAL TAGIHAN:</span>
            <span className="text-indigo-900">{formatRupiah(invoice.totalAmount)}</span>
          </div>

          <p className="text-[11px] text-slate-500 italic text-right pt-1">
            Terbilang: <strong className="text-slate-800 font-bold">{terbilangRupiah(invoice.totalAmount)}</strong>
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
        <div>
          <p className="text-slate-500">Diterima oleh Klien,</p>
          <div className="h-16" />
          <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-8">
            ( {invoice.clientName} )
          </p>
        </div>

        <div>
          <p className="text-slate-500">
            {companyProfile?.city || 'Jakarta'}, {formatDate(invoice.issueDate)}
          </p>
          <p className="text-slate-500">Hormat Kami,</p>
          <div className="h-16" />
          <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-8">
            ( {companyProfile?.financeManager || 'Manager Keuangan'} )
          </p>
        </div>
      </div>
    </div>
  );
}
