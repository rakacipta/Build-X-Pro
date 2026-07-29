import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
} from 'lucide-react';
import { CrmLead } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';

interface CrmModuleProps {
  leads: CrmLead[];
  onSaveLead: (lead: CrmLead) => void;
  onDeleteLead: (id: string) => void;
}

const STAGES = [
  'Lead In',
  'Contacted',
  'Quotation Sent',
  'Negotiation',
  'Deal Won',
  'Deal Lost',
];

export const CrmModule: React.FC<CrmModuleProps> = ({
  leads,
  onSaveLead,
  onDeleteLead,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts'>('pipeline');
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<CrmLead> | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.companyName.toLowerCase().includes(search.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchesStage = selectedStage === 'All' || l.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleOpenAddModal = () => {
    setEditingLead({
      id: 'lead-' + Date.now(),
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      type: 'Prospect',
      stage: 'Lead In',
      estimatedValue: 0,
      lastFollowUp: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead && editingLead.companyName) {
      onSaveLead(editingLead as CrmLead);
      setIsModalOpen(false);
      setEditingLead(null);
    }
  };

  return (
    <div id="crm-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN CRM & MANAJEMEN PIPELINE LEADS"
        subtitle="Kelola Prospek, Pelanggan, Vendor, Penawaran Harga & Status Pipeline Negosiasi"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">CRM & Manajemen Leads</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola prospek, pelanggan, vendor, penawaran harga, dan pipeline negosiasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'pipeline'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline Kanban
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'contacts'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Kontak
            </button>
          </div>

          <CetakPdfButton
            elementId="crm-module"
            filename="Laporan_CRM_Leads_Construx.pdf"
            title="Laporan CRM & Pipeline Leads"
            variant="emerald"
          />

          <button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Prospek Baru
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Perusahaan / Kontak..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Stage:</span>
          <button
            onClick={() => setSelectedStage('All')}
            className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap ${
              selectedStage === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          {STAGES.map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap ${
                selectedStage === stg
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline View */}
      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage);
            const totalVal = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);

            return (
              <div
                key={stage}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 flex flex-col min-w-[200px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <h3 className="font-bold text-xs text-slate-800">{stage}</h3>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-amber-600 mb-3">
                  {formatRupiah(totalVal)}
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {lead.type}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 mt-1">
                            {lead.companyName}
                          </h4>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingLead(lead);
                              setIsModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-amber-500 p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <p className="font-medium">{lead.contactPerson}</p>
                        <p className="text-slate-400 text-[10px]">{lead.phone}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-900">
                          {formatRupiah(lead.estimatedValue)}
                        </span>
                        <span className="text-slate-400">{lead.lastFollowUp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Contacts Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3.5">Perusahaan</th>
                  <th className="p-3.5">Kontak</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Stage Pipeline</th>
                  <th className="p-3.5">Estimasi Nilai</th>
                  <th className="p-3.5">Follow Up Terakhir</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">{lead.companyName}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{lead.contactPerson}</div>
                      <div className="text-[11px] text-slate-400">{lead.phone} • {lead.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {lead.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {lead.stage}
                      </span>
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {formatRupiah(lead.estimatedValue)}
                    </td>
                    <td className="p-3.5 text-slate-500">{lead.lastFollowUp}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                        className="text-amber-600 hover:text-amber-700 font-semibold text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="text-rose-600 hover:text-rose-700 font-semibold text-[11px]"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Lead */}
      {isModalOpen && editingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingLead.id ? 'Edit Data Prospek CRM' : 'Tambah Prospek Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editingLead.companyName || ''}
                  onChange={(e) =>
                    setEditingLead({ ...editingLead, companyName: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editingLead.contactPerson || ''}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, contactPerson: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={editingLead.phone || ''}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, phone: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingLead.type || 'Prospect'}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, type: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage Pipeline</label>
                  <select
                    value={editingLead.stage || 'Lead In'}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, stage: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                  >
                    {STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimasi Nilai Proyek (Rp)
                </label>
                <input
                  type="number"
                  value={editingLead.estimatedValue || 0}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      estimatedValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Follow Up</label>
                <textarea
                  rows={2}
                  value={editingLead.notes || ''}
                  onChange={(e) =>
                    setEditingLead({ ...editingLead, notes: e.target.value })
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
                  Simpan Prospek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
