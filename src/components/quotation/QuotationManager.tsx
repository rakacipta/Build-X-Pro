import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  PlusCircle,
  Send,
  Eye,
  FileCheck,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Quotation, QuotationItem, CompanyProfile, LetterheadSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { SignaturePicker } from '../common/SignaturePicker';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface QuotationManagerProps {
  quotations: Quotation[];
  onSaveQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
}

export const QuotationManager: React.FC<QuotationManagerProps> = ({
  quotations,
  onSaveQuotation,
  onDeleteQuotation,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Partial<Quotation> | null>(null);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);

  const companyProfile = getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
  const letterheadSettings = getStoredData<LetterheadSettings>('letterhead_settings', INITIAL_LETTERHEAD);

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNo.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.companyName.toLowerCase().includes(search.toLowerCase()) ||
      q.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculation metrics
  const totalQuotationsVal = quotations.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const acceptedQuotationsVal = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((acc, curr) => acc + curr.grandTotal, 0);
  const pendingQuotationsCount = quotations.filter(
    (q) => q.status === 'Draft' || q.status === 'Sent'
  ).length;

  const handleOpenAddModal = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newNo = `SPH/BX/${year}/${month}-${randomNum}`;

    setEditingQuotation({
      id: 'quo-' + Date.now(),
      quotationNo: newNo,
      clientName: '',
      companyName: '',
      clientAddress: '',
      projectName: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Draft',
      taxPercent: 11,
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      notes: '1. Harga sudah termasuk PPN 11% & Jasa Pelaksanaan Pekerjaan.\n2. Jadwal Pembayaran Termijn: DP 20%, Progress 30%, 30%, 15%, Retensi 5%.\n3. Masa berlaku Surat Penawaran Harga ini adalah 30 hari kalender.',
      preparedBy: 'Deni Kurniawan, ST',
      approvedBy: 'Ir. Hendra Wijaya, MM',
      items: [
        {
          id: 'qitem-' + Date.now() + '-1',
          description: 'Pekerjaan Persiapan & Mobilisasi Alat',
          unit: 'Lump Sum',
          quantity: 1,
          unitPrice: 50000000,
          totalPrice: 50000000,
        },
      ],
    });
    setIsFormModalOpen(true);
  };

  const handleEdit = (q: Quotation) => {
    setEditingQuotation({ ...q });
    setIsFormModalOpen(true);
  };

  const handleAddItem = () => {
    if (!editingQuotation) return;
    const items = editingQuotation.items || [];
    const newItem: QuotationItem = {
      id: 'qitem-' + Date.now(),
      description: '',
      unit: 'm2',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setEditingQuotation({
      ...editingQuotation,
      items: [...items, newItem],
    });
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, value: any) => {
    if (!editingQuotation || !editingQuotation.items) return;
    const newItems = [...editingQuotation.items];
    const currentItem = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : currentItem.quantity;
      const price = field === 'unitPrice' ? Number(value) : currentItem.unitPrice;
      currentItem.totalPrice = qty * price;
    }

    newItems[index] = currentItem;

    // Recalculate Subtotal, Tax, Grand Total
    const subtotal = newItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    const taxPercent = editingQuotation.taxPercent ?? 11;
    const taxAmount = Math.round((subtotal * taxPercent) / 100);
    const grandTotal = subtotal + taxAmount;

    setEditingQuotation({
      ...editingQuotation,
      items: newItems,
      subtotal,
      taxAmount,
      grandTotal,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingQuotation || !editingQuotation.items) return;
    const newItems = editingQuotation.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    const taxPercent = editingQuotation.taxPercent ?? 11;
    const taxAmount = Math.round((subtotal * taxPercent) / 100);
    const grandTotal = subtotal + taxAmount;

    setEditingQuotation({
      ...editingQuotation,
      items: newItems,
      subtotal,
      taxAmount,
      grandTotal,
    });
  };

  const handleTaxChange = (taxPercent: number) => {
    if (!editingQuotation) return;
    const subtotal = editingQuotation.subtotal || 0;
    const taxAmount = Math.round((subtotal * taxPercent) / 100);
    const grandTotal = subtotal + taxAmount;

    setEditingQuotation({
      ...editingQuotation,
      taxPercent,
      taxAmount,
      grandTotal,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuotation && editingQuotation.quotationNo && editingQuotation.clientName) {
      onSaveQuotation(editingQuotation as Quotation);
      setIsFormModalOpen(false);
      setEditingQuotation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Penawaran (SPH)</p>
            <p className="text-lg font-bold text-slate-900">{formatRupiah(totalQuotationsVal)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{quotations.length} Dokumen Diterbitkan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Penawaran Disetujui (Deal)</p>
            <p className="text-lg font-bold text-emerald-700">{formatRupiah(acceptedQuotationsVal)}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {quotations.filter((q) => q.status === 'Accepted').length} Project Disetujui Klien
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Status Dalam Evaluasi</p>
            <p className="text-lg font-bold text-slate-900">{pendingQuotationsCount} Dokumen</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Draft & Menunggu Tanggapan Klien</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. SPH, Klien, Perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="All">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Dikirim / Evaluasi</option>
            <option value="Accepted">Disetujui (Accepted)</option>
            <option value="Declined">Ditolak (Declined)</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Surat Penawaran (SPH)</span>
        </button>
      </div>

      {/* Table List of Quotations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Daftar Surat Penawaran Harga (Quotation SPH)</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            {filteredQuotations.length} Record
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">No. SPH & Tanggal</th>
                <th className="p-3">Klien & Perusahaan</th>
                <th className="p-3">Lingkup Pekerjaan Proyek</th>
                <th className="p-3 text-right">Nilai Penawaran</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center print:hidden">Aksi & Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada data Surat Penawaran Harga (SPH). Klik tombol "Buat Surat Penawaran" di atas.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const getStatusBadge = (st: string) => {
                    switch (st) {
                      case 'Accepted':
                        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      case 'Sent':
                        return 'bg-blue-100 text-blue-800 border-blue-300';
                      case 'Declined':
                        return 'bg-rose-100 text-rose-800 border-rose-300';
                      default:
                        return 'bg-slate-100 text-slate-700 border-slate-300';
                    }
                  };

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-amber-700 font-mono">{q.quotationNo}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Tgl: {q.date}</span>
                          <span className="text-slate-300">•</span>
                          <span>s/d: {q.validUntil}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{q.companyName || q.clientName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>PIC: {q.clientName}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="line-clamp-2 font-medium text-slate-800">{q.projectName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{q.items?.length || 0} Item Pekerjaan</p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-extrabold text-slate-900 text-sm">{formatRupiah(q.grandTotal)}</div>
                        <div className="text-[10px] text-slate-400">
                          (Subtotal: {formatRupiah(q.subtotal)} + PPN {q.taxPercent}%)
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(
                            q.status
                          )}`}
                        >
                          {q.status === 'Accepted'
                            ? '✓ Disetujui'
                            : q.status === 'Sent'
                            ? 'Dikirim'
                            : q.status === 'Declined'
                            ? 'Ditolak'
                            : 'Draft'}
                        </span>
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedQuotationForPrint(q)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200"
                            title="Cetak PDF Surat Penawaran"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-200"
                            title="Edit Penawaran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteQuotation(q.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                            title="Hapus SPH"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL EDIT / BUAT QUOTATION */}
      {isFormModalOpen && editingQuotation && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:hidden">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Form Surat Penawaran Harga (Quotation / SPH)</h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Row 1: Document Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor SPH Penawaran</label>
                  <input
                    type="text"
                    required
                    value={editingQuotation.quotationNo || ''}
                    onChange={(e) => setEditingQuotation({ ...editingQuotation, quotationNo: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    required
                    value={editingQuotation.date || ''}
                    onChange={(e) => setEditingQuotation({ ...editingQuotation, date: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Masa Berlaku s/d</label>
                  <input
                    type="date"
                    required
                    value={editingQuotation.validUntil || ''}
                    onChange={(e) => setEditingQuotation({ ...editingQuotation, validUntil: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Row 2: Client & Project Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase text-amber-700">
                    Data Klien & Perusahaan
                  </h4>
                  <div>
                    <label className="font-semibold block mb-1">Nama Perusahaan Klien</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT Mega Konstruksi Utama"
                      value={editingQuotation.companyName || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, companyName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Nama PIC / Kepada Yth</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Irwan Setiawan"
                      value={editingQuotation.clientName || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, clientName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Alamat Klien</label>
                    <input
                      type="text"
                      placeholder="Jl. Sudirman No. 45, Jakarta"
                      value={editingQuotation.clientAddress || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, clientAddress: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase text-amber-700">
                    Detail Proyek & Status
                  </h4>
                  <div>
                    <label className="font-semibold block mb-1">Nama Pekerjaan / Proyek</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Pekerjaan Fit-Out & Interior Commercial Showroom..."
                      value={editingQuotation.projectName || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, projectName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Status Penawaran</label>
                    <select
                      value={editingQuotation.status || 'Draft'}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, status: e.target.value as any })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Dikirim / Evaluasi</option>
                      <option value="Accepted">Disetujui (Accepted)</option>
                      <option value="Declined">Ditolak (Declined)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Digital Signature & Otorisasi Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase text-blue-700">
                  Pengesahan & Tanda Tangan Digital (Export PDF)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Nama Penandatangan (Direksi / Otorisator)</label>
                    <input
                      type="text"
                      placeholder="Ir. Hendra Wijaya, MM"
                      value={editingQuotation.approvedBy || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, approvedBy: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      placeholder="Direktur Utama"
                      value={editingQuotation.signatoryTitle || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, signatoryTitle: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>
                <SignaturePicker
                  label="Upload / Gambar Tanda Tangan Digital Direksi"
                  value={editingQuotation.signatureUrl}
                  onChange={(url) => setEditingQuotation({ ...editingQuotation, signatureUrl: url })}
                />
              </div>

              {/* Row 3: Items Table Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Rincian Item Pekerjaan & Biaya (BOQ SPH)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Uraian Pekerjaan / Spesifikasi</th>
                        <th className="p-2 w-20">Satuan</th>
                        <th className="p-2 w-20 text-center">Qty</th>
                        <th className="p-2 w-32 text-right">Harga Satuan (Rp)</th>
                        <th className="p-2 w-32 text-right">Total (Rp)</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingQuotation.items?.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                              placeholder="Deskripsi uraian pekerjaan..."
                              className="w-full p-1.5 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                              placeholder="m2 / Titik / LS"
                              className="w-full p-1.5 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded text-right font-bold"
                            />
                          </td>
                          <td className="p-2 text-right font-extrabold text-slate-900">
                            {formatRupiah(item.totalPrice)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                  <div className="w-full sm:w-1/2 space-y-2">
                    <label className="font-bold text-slate-800 block">Syarat & Ketentuan Pembayaran</label>
                    <textarea
                      rows={3}
                      value={editingQuotation.notes || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, notes: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                    />
                  </div>

                  <div className="w-full sm:w-5/12 space-y-2 text-right font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Pekerjaan:</span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(editingQuotation.subtotal || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 gap-2">
                      <span className="flex items-center gap-1">
                        <span>PPN:</span>
                        <select
                          value={editingQuotation.taxPercent ?? 11}
                          onChange={(e) => handleTaxChange(Number(e.target.value))}
                          className="px-1 py-0.5 border border-slate-300 bg-white rounded font-bold text-xs"
                        >
                          <option value={11}>11%</option>
                          <option value={12}>12%</option>
                          <option value={0}>0% (Tanpa PPN)</option>
                        </select>
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(editingQuotation.taxAmount || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-extrabold text-amber-800 pt-2 border-t border-amber-300">
                      <span>GRAND TOTAL SPH:</span>
                      <span className="text-base">{formatRupiah(editingQuotation.grandTotal || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Simpan Surat Penawaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE QUOTATION MODAL */}
      {selectedQuotationForPrint && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[95vh]">
            {/* Toolbar Top */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">
                  Pratinjau Dokumen SPH: {selectedQuotationForPrint.quotationNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CetakPdfButton
                  elementId="quotation-printable-document"
                  filename={`Surat_Penawaran_Harga_${selectedQuotationForPrint.quotationNo.replace(/[/]/g, '_')}.pdf`}
                  title={`Surat Penawaran Harga - ${selectedQuotationForPrint.companyName}`}
                  variant="amber"
                />
                <button
                  onClick={() => setSelectedQuotationForPrint(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Document Printable View Container */}
            <div className="overflow-y-auto p-6 sm:p-10 bg-white" id="quotation-printable-document">
              {/* Kop Surat Header */}
              <PrintHeader
                title="SURAT PENAWARAN HARGA (QUOTATION)"
                subtitle={`Nomor SPH: ${selectedQuotationForPrint.quotationNo} | Tanggal: ${selectedQuotationForPrint.date}`}
              />

              {/* Document Reference Info & Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs text-slate-800">
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-amber-800 uppercase text-[10px] tracking-wider mb-1">
                    KEPADA YTH:
                  </p>
                  <p className="font-black text-slate-900 text-sm">{selectedQuotationForPrint.companyName || 'Perusahaan Klien'}</p>
                  <p className="font-semibold text-slate-700">Up. {selectedQuotationForPrint.clientName}</p>
                  <p className="text-slate-500">{selectedQuotationForPrint.clientAddress || 'Di Tempat'}</p>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1 text-right sm:text-left">
                  <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Nomor Dokumen:</span>
                    <span className="font-extrabold font-mono text-slate-900">{selectedQuotationForPrint.quotationNo}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Tanggal Penawaran:</span>
                    <span className="font-bold text-slate-900">{selectedQuotationForPrint.date}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Masa Berlaku s/d:</span>
                    <span className="font-bold text-amber-700">{selectedQuotationForPrint.validUntil}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Perihal:</span>
                    <span className="font-bold text-slate-900">Penawaran Harga Pekerjaan</span>
                  </div>
                </div>
              </div>

              {/* Subject / Opening Statement */}
              <div className="mb-4 text-xs text-slate-700 leading-relaxed">
                <p className="font-medium">Dengan hormat,</p>
                <p className="mt-1">
                  Sehubungan dengan rencana pelaksanaan pekerjaan{' '}
                  <strong className="text-slate-900">{selectedQuotationForPrint.projectName}</strong>, dengan ini kami mengajukan Surat Penawaran Harga (SPH) dengan rincian biaya sebagai berikut:
                </p>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 w-10 text-center">No.</th>
                      <th className="p-2.5">Uraian Pekerjaan & Spesifikasi</th>
                      <th className="p-2.5 w-16 text-center">Satuan</th>
                      <th className="p-2.5 w-16 text-center">Vol</th>
                      <th className="p-2.5 w-32 text-right">Harga Satuan</th>
                      <th className="p-2.5 w-36 text-right">Jumlah Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedQuotationForPrint.items?.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
                        <td className="p-2.5 text-center font-medium text-slate-700">{item.unit}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-800">{formatRupiah(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-extrabold text-slate-900 font-mono">
                          {formatRupiah(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-300 font-bold">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right uppercase text-slate-700">Subtotal Pekerjaan:</td>
                      <td className="p-2.5 text-right font-extrabold text-slate-900 font-mono">
                        {formatRupiah(selectedQuotationForPrint.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right uppercase text-slate-700">
                        PPN ({selectedQuotationForPrint.taxPercent}%):
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-slate-900 font-mono">
                        {formatRupiah(selectedQuotationForPrint.taxAmount)}
                      </td>
                    </tr>
                    <tr className="bg-amber-100/80 text-amber-900 text-sm">
                      <td colSpan={5} className="p-3 text-right uppercase font-black">
                        GRAND TOTAL PENAWARAN:
                      </td>
                      <td className="p-3 text-right font-black font-mono text-amber-900">
                        {formatRupiah(selectedQuotationForPrint.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terms & Notes Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900 uppercase text-[11px]">
                  Syarat & Ketentuan Pembayaran:
                </p>
                <div className="whitespace-pre-line text-slate-600 leading-relaxed pl-1 font-medium">
                  {selectedQuotationForPrint.notes || '1. Pembayaran dilakukan via transfer bank resmi perusahaan.\n2. Harga berlaku 30 hari kalender sejak diterbitkan.'}
                </div>
              </div>

              {/* Signatures Component */}
              <PrintSignature
                preparedBy={selectedQuotationForPrint.preparedBy || 'Deni Kurniawan, ST'}
                preparedTitle="Disiapkan Oleh (Estimator / Marketing)"
                directorName={selectedQuotationForPrint.approvedBy || companyProfile.directorName}
                directorTitle={selectedQuotationForPrint.signatoryTitle || companyProfile.directorTitle || 'Direktur Utama'}
                signatureUrl={selectedQuotationForPrint.signatureUrl}
                verifiedBy={companyProfile.financeManager}
                verifiedTitle="Disetujui Oleh Direksi"
                note={`Surat Penawaran Harga Sah & Resmi Diterbitkan Oleh ${companyProfile.name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
