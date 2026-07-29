import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  FileCheck2,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  Trash2,
  Edit2,
  Building,
  Printer,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { PurchaseOrder } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface PurchasingModuleProps {
  purchases: PurchaseOrder[];
  onSavePurchase: (po: PurchaseOrder) => void;
  onDeletePurchase: (id: string) => void;
}

export const PurchasingModule: React.FC<PurchasingModuleProps> = ({
  purchases,
  onSavePurchase,
  onDeletePurchase,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<Partial<PurchaseOrder> | null>(null);
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<PurchaseOrder | null>(null);

  const filteredPurchases = purchases.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingPo({
      id: 'po-' + Date.now(),
      poNumber: `PO/2026/08/00${purchases.length + 1}`,
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalAmount: 0,
      status: 'Pending Approval',
      items: [
        {
          materialName: 'Semen Tiga Roda PPC 50kg',
          qty: 500,
          unit: 'Sak',
          unitPrice: 62000,
          subtotal: 31000000,
        },
      ],
      requestedBy: 'Purchasing Team',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPo && editingPo.vendorName) {
      onSavePurchase(editingPo as PurchaseOrder);
      setIsModalOpen(false);
      setEditingPo(null);
    }
  };

  return (
    <div id="purchasing-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN REKAPITULASI PURCHASE ORDER (PO)"
        subtitle="Pengadaan Barang & Suplai Material Konstruksi, Rekap Pesanan Vendor & Jadwal Pengiriman"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Modul Purchasing & Pembelian</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Purchase Request (PR), Purchase Order (PO), Perbandingan Harga Vendor, Approval, & Penerimaan Barang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="purchasing-module"
            filename="Laporan_Purchase_Order_Construx.pdf"
            title="Laporan Rekapitulasi Purchase Order (PO)"
            variant="emerald"
          />
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Buat Purchase Order (PO) Baru
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari No PO / Nama Vendor..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* PO List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPurchases.map((po) => (
          <div
            key={po.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {po.poNumber}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{po.vendorName}</h3>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  po.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : po.status === 'Pending Approval'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {po.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-500 block">Rincian Barang PO:</span>
              {po.items.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.materialName}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.qty} {item.unit} @ {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatRupiah(item.subtotal || item.qty * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total PO:</span>
                <span className="font-black text-amber-600 text-base">
                  {formatRupiah(po.totalAmount)}
                </span>
              </div>

              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoForPrint(po)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Cetak PO
                </button>
                <button
                  onClick={() => onDeletePurchase(po.id)}
                  className="text-rose-600 font-bold hover:underline text-[11px]"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add PO */}
      {isModalOpen && editingPo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Buat Purchase Order Baru</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor PO</label>
                  <input
                    type="text"
                    required
                    value={editingPo.poNumber || ''}
                    onChange={(e) => setEditingPo({ ...editingPo, poNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Vendor / Supplier</label>
                  <input
                    type="text"
                    required
                    value={editingPo.vendorName || ''}
                    onChange={(e) => setEditingPo({ ...editingPo, vendorName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal PO</label>
                  <input
                    type="date"
                    required
                    value={editingPo.date || ''}
                    onChange={(e) => setEditingPo({ ...editingPo, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Nilai PO (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingPo.totalAmount || 0}
                    onChange={(e) =>
                      setEditingPo({
                        ...editingPo,
                        totalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
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
                  Kirim Pengajuan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Cetak PO Document Printable */}
      {selectedPoForPrint && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 text-slate-900 overflow-hidden">
            {/* Modal Header Actions (Sticky at Top) */}
            <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between gap-3 z-20 print:hidden shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Printer className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Pratinjau Resmi Purchase Order: {selectedPoForPrint.poNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dokumen siap cetak dan diunduh dalam format PDF resmi perusahaan.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoForPrint(null)}
                  className="px-3.5 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Tutup
                </button>
                <CetakPdfButton
                  elementId="po-printable-document"
                  filename={`Purchase_Order_${selectedPoForPrint.poNumber.replace(/[\/\s]/g, '_')}.pdf`}
                  title={`Purchase Order - ${selectedPoForPrint.poNumber}`}
                  variant="emerald"
                  label="Unduh / Cetak PO (PDF)"
                />
              </div>
            </div>

            {/* Scrollable Printable Document Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/50">
              <div id="po-printable-document" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 space-y-6 shadow-sm">
              {/* Top Gradient Stripe */}
              <div className="h-2 w-full bg-gradient-to-r from-blue-700 via-amber-500 to-emerald-600 rounded-t"></div>

              {/* Kop Surat Header */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-black flex items-center justify-center text-2xl rounded-2xl shadow-md border border-slate-700">
                      C
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">
                        PT GRAHA MULTI KONSTRUKSI
                      </h2>
                      <p className="text-xs font-bold text-amber-600">
                        CONSTRUX ERP — General Contractor & Trading Material
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gedung Graha Construction Fl. 12, Jl. Jend. Sudirman No. 88, Jakarta Selatan 12190
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Telp: (021) 555-8899 / 555-8890 | Email: purchasing@grahamulti.co.id | www.grahamulti.co.id
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg shadow-xs">
                      PURCHASE ORDER
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 mt-1.5 block">
                      NPWP: 01.234.567.8-012.000
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Document Number */}
              <div className="text-center bg-slate-50 py-3 px-4 rounded-xl border border-slate-200/80">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  SURAT PESANAN PEMBELIAN (PURCHASE ORDER)
                </h1>
                <p className="text-xs font-mono font-bold text-amber-700 mt-0.5">
                  NO. DOKUMEN: {selectedPoForPrint.poNumber}
                </p>
              </div>

              {/* Document Info Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                  <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    INFORMASI VENDOR / PEMASOK
                  </h4>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Nama Vendor:</span>
                    <strong className="text-slate-900 font-bold">{selectedPoForPrint.vendorName}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Kategori Suplai:</span>
                    <span className="font-semibold text-slate-800">Material & Alat Konstruksi</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Status Otorisasi:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                      {selectedPoForPrint.status}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                  <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    TANGGAL & PENGIRIMAN
                  </h4>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tanggal Terbit PO:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPoForPrint.date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Target Pengiriman:</span>
                    <span className="font-mono font-bold text-amber-700">{selectedPoForPrint.deliveryDate || '-'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Diminta Oleh:</span>
                    <span className="font-semibold text-slate-800">{selectedPoForPrint.requestedBy || 'Tim Purchasing'}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase mb-2 tracking-wider">
                  DAFTAR BARANG / MATERIAL YANG DIPESAN:
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-300">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5 text-center w-10 border-r border-slate-800">No</th>
                        <th className="p-2.5 border-r border-slate-800">Nama Barang / Spesifikasi Material</th>
                        <th className="p-2.5 text-center border-r border-slate-800">Volume</th>
                        <th className="p-2.5 text-center border-r border-slate-800">Satuan</th>
                        <th className="p-2.5 text-right border-r border-slate-800">Harga Satuan</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {selectedPoForPrint.items && selectedPoForPrint.items.length > 0 ? (
                        selectedPoForPrint.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2.5 text-center font-mono border-r border-slate-200 text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{item.materialName}</td>
                            <td className="p-2.5 text-center font-bold border-r border-slate-200">{item.qty}</td>
                            <td className="p-2.5 text-center border-r border-slate-200 text-slate-600">{item.unit}</td>
                            <td className="p-2.5 text-right font-mono border-r border-slate-200">{formatRupiah(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold font-mono text-slate-900">{formatRupiah(item.subtotal || item.qty * item.unitPrice)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                            Tidak ada rincian item barang.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                        <td colSpan={5} className="p-3 text-right uppercase text-slate-800 tracking-wider">
                          TOTAL NILAI PURCHASE ORDER:
                        </td>
                        <td className="p-3 text-right font-mono text-amber-700 text-sm font-extrabold bg-amber-50">
                          {formatRupiah(selectedPoForPrint.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                  SYARAT & KETENTUAN PEMESANAN:
                </p>
                <p>1. Nomor PO wajib dicantumkan pada Surat Jalan (Delivery Order) dan Faktur/Invoice Penagihan.</p>
                <p>2. Barang yang dikirim harus memenuhi standar kualifikasi & spesifikasi teknis proyek PT GMK.</p>
                <p>3. Pembayaran dilaksanakan sesuai termin yang telah disepakati antara PT GMK dan Pemasok.</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs border-t border-slate-200">
                <div className="space-y-12">
                  <p className="font-semibold text-slate-600">Dibuat Oleh,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">{selectedPoForPrint.requestedBy || 'Tim Purchasing'}</p>
                    <p className="text-[10px] text-slate-500">Staff Bagian Pengadaan</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <p className="font-semibold text-slate-600">Disetujui Oleh,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Budi Santoso, S.T.</p>
                    <p className="text-[10px] text-slate-500">Project Manager / Director</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <p className="font-semibold text-slate-600">Konfirmasi Vendor,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">{selectedPoForPrint.vendorName}</p>
                    <p className="text-[10px] text-slate-500">Perwakilan Supplier</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
