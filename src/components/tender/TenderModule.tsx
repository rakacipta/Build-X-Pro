import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Trophy,
  XCircle,
  Clock,
  FileSpreadsheet,
  Upload,
  Calendar,
  Building,
  DollarSign,
  Download,
  Trash2,
  Edit2,
  Printer,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { Tender, Quotation } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { QuotationManager } from '../quotation/QuotationManager';

interface TenderModuleProps {
  tenders: Tender[];
  onSaveTender: (tender: Tender) => void;
  onDeleteTender: (id: string) => void;
  quotations?: Quotation[];
  onSaveQuotation?: (q: Quotation) => void;
  onDeleteQuotation?: (id: string) => void;
}

export const TenderModule: React.FC<TenderModuleProps> = ({
  tenders,
  onSaveTender,
  onDeleteTender,
  quotations = [],
  onSaveQuotation = () => {},
  onDeleteQuotation = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'tenders' | 'quotations'>('tenders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Partial<Tender> | null>(null);

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.agency.toLowerCase().includes(search.toLowerCase()) ||
      t.tenderNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingTender({
      id: 'tnd-' + Date.now(),
      tenderNo: `TND/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      agency: '',
      budgetEstimate: 0,
      boqTotal: 0,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      notes: '',
      category: 'Gedung',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTender && editingTender.title) {
      onSaveTender(editingTender as Tender);
      setIsModalOpen(false);
      setEditingTender(null);
    }
  };

  return (
    <div id="tender-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN TENDER & DOKUMEN PENAWARAN LELANG"
        subtitle="Rekapitulasi Tender, Pendaftaran Lelang, Nilai HPS & Status Evaluasi Kualifikasi"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Modul Manajemen Tender</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendaftaran lelang, penyusunan BOQ, dokumen kualifikasi, RFI, dan pengawasan status pemenang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('tenders')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'tenders'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Tender Lelang
            </button>
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'quotations'
                  ? 'bg-white text-amber-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Penawaran (Quotation)</span>
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                {quotations.length}
              </span>
            </button>
          </div>

          <CetakPdfButton
            elementId="tender-module"
            filename="Laporan_Manajemen_Tender_Build_X_Pro.pdf"
            title="Laporan Tender & Dokumen Penawaran Lelang"
            variant="emerald"
          />
          {activeTab === 'tenders' && (
            <button
              onClick={handleOpenAddModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
            >
              <Plus className="w-4 h-4" /> Input Tender Baru
            </button>
          )}
        </div>
      </div>

      {activeTab === 'quotations' ? (
        <QuotationManager
          quotations={quotations}
          onSaveQuotation={onSaveQuotation}
          onDeleteQuotation={onDeleteQuotation}
        />
      ) : (
        <>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Berkas Tender</span>
          <p className="text-xl font-black text-slate-900 mt-1">{tenders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Tender Dimenangkan</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {tenders.filter((t) => t.status === 'Winner').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Proses Penawaran</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {tenders.filter((t) => t.status === 'Submitted' || t.status === 'Draft').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Nilai Lelang</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatRupiah(tenders.reduce((acc, t) => acc + t.budgetEstimate, 0))}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nomor Tender, Judul, atau Instansi..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Draft', 'Submitted', 'Winner', 'Loser'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tender List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenders.map((tender) => {
          let statusBadgeClass = 'bg-slate-100 text-slate-700';
          if (tender.status === 'Winner') statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          if (tender.status === 'Submitted') statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
          if (tender.status === 'Loser') statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';

          return (
            <div
              key={tender.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {tender.tenderNo}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}
                  >
                    {tender.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{tender.title}</h3>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {tender.agency}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">Pagu Anggaran</span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(tender.budgetEstimate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Nilai BOQ Penawaran</span>
                    <span className="font-bold text-amber-600">
                      {formatRupiah(tender.boqTotal || tender.budgetEstimate * 0.9)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Deadline Submission: <span className="font-bold text-slate-800">{tender.submissionDate}</span>
                  </div>
                  {tender.notes && <p className="italic text-slate-500 line-clamp-2">"{tender.notes}"</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTender(tender);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Data Tender"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTender(tender.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="Hapus Berkas Tender"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => alert(`Membuka berkas dokumen BOQ & Spesifikasi untuk ${tender.tenderNo}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Berkas BOQ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Tender */}
      {isModalOpen && editingTender && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingTender.id ? 'Edit Berkas Tender' : 'Input Pendaftaran Tender Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Tender / Kode LPSE</label>
                <input
                  type="text"
                  required
                  value={editingTender.tenderNo || ''}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, tenderNo: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Pekerjaan Lelang</label>
                <input
                  type="text"
                  required
                  value={editingTender.title || ''}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, title: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instansi / Panitia Pengadaan</label>
                <input
                  type="text"
                  required
                  value={editingTender.agency || ''}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, agency: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pagu Anggaran HPS (Rp)</label>
                  <input
                    type="number"
                    value={editingTender.budgetEstimate || 0}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender,
                        budgetEstimate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai Penawaran BOQ (Rp)</label>
                  <input
                    type="number"
                    value={editingTender.boqTotal || 0}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender,
                        boqTotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Akhir Upload</label>
                  <input
                    type="date"
                    value={editingTender.submissionDate || ''}
                    onChange={(e) =>
                      setEditingTender({ ...editingTender, submissionDate: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Lelang</label>
                  <select
                    value={editingTender.status || 'Draft'}
                    onChange={(e) =>
                      setEditingTender({ ...editingTender, status: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Winner">Winner (Pemenang)</option>
                    <option value="Loser">Loser (Gugur)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Dokumen / RFI</label>
                <textarea
                  rows={2}
                  value={editingTender.notes || ''}
                  onChange={(e) =>
                    setEditingTender({ ...editingTender, notes: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Simpan Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
