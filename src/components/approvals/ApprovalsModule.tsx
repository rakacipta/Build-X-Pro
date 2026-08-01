import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Printer,
  BellRing,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { ExternalNotificationModal } from '../common/ExternalNotificationModal';
import { PoAlertPayload } from '../../services/externalNotificationService';
import { ApprovalRequest, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface ApprovalsModuleProps {
  approvals: ApprovalRequest[];
  currentRole: UserRole;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onSendReminder?: (reqNo: string, title: string, amount: number) => void;
}

export const ApprovalsModule: React.FC<ApprovalsModuleProps> = ({
  approvals,
  currentRole,
  onApprove,
  onReject,
  onSendReminder,
}) => {
  const [activeFilter, setActiveFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [selectedApp, setSelectedApp] = useState<ApprovalRequest | null>(null);
  const [notes, setNotes] = useState('');

  // External Notification State
  const [selectedPoForNotif, setSelectedPoForNotif] = useState<PoAlertPayload | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const handleOpenNotifModal = (app: ApprovalRequest) => {
    setSelectedPoForNotif({
      poNumber: app.reqNo,
      vendorName: app.title.replace(/^Pengajuan PO|^PO /i, '').trim() || 'Vendor Pengadaan',
      totalAmount: app.amount,
      requestedBy: app.requestedBy,
      date: app.requestDate,
      notes: app.notes,
    });
    setIsNotifModalOpen(true);
  };

  const filtered = approvals.filter(
    (a) => activeFilter === 'All' || a.status === activeFilter
  );

  return (
    <div id="approvals-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN REKAPITULASI WORKFLOW APPROVAL MULTI-LEVEL"
        subtitle="Riwayat Persetujuan Pengajuan PO, Anggaran Proyek, Voucher Kas & Payroll"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Workflow Approval Multi-Level
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inbox persetujuan pengajuan PO, Anggaran Proyek, Voucher Kas, VO, Tender, & Payroll oleh Direktur/PM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="approvals-module"
            filename="Laporan_Approval_Workflow_Build_X_Pro.pdf"
            title="Laporan Workflow Approval Multi-Level"
            variant="emerald"
          />

          <div className="flex items-center gap-2">
            {['Pending', 'Approved', 'Rejected', 'All'].map((st) => (
              <button
                key={st}
                onClick={() => setActiveFilter(st as any)}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                  activeFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'All' ? 'Semua' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {app.reqNo}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    app.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : app.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {app.type}
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-1">{app.title}</h3>

              <div className="mt-3 bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Diajukan Oleh:</span>
                  <strong className="text-slate-800">{app.requestedBy}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tanggal Pengajuan:</span>
                  <strong>{app.requestDate}</strong>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200">
                  <span>Nominal Pengajuan:</span>
                  <span className="text-amber-600">{formatRupiah(app.amount)}</span>
                </div>
              </div>
            </div>

            {app.status === 'Pending' ? (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  Review & Tanggapi →
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenNotifModal(app)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition shadow-sm"
                    title="Kirim pesan ringkasan persetujuan ke WhatsApp / Email Direksi"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                    <span>WA / Email</span>
                  </button>
                  {onSendReminder ? (
                    <button
                      type="button"
                      onClick={() => onSendReminder(app.reqNo, app.title, app.amount)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                      title="Kirim push alert di aplikasi"
                    >
                      <BellRing className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                      <span>Push Alert</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Disetujui/Ditolak oleh: <strong className="text-slate-800">{app.approver || currentRole}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      <PrintSignature note="Laporan Pengesahan Otorisasi, Verifikasi & Persetujuan Direksi" />

      {/* Review & Approve Modal */}
      {selectedApp && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApp(null);
          }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4 cursor-default">
            <h3 className="font-bold text-lg text-slate-900">Review Pengajuan Approval</h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border">
              <p>Nomor Pengajuan: <strong className="font-mono text-amber-600">{selectedApp.reqNo}</strong></p>
              <p>Judul: <strong>{selectedApp.title}</strong></p>
              <p>Nominal: <strong className="text-amber-700 text-sm">{formatRupiah(selectedApp.amount)}</strong></p>
              <p>Pengaju: <strong>{selectedApp.requestedBy}</strong></p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan / Catatan Persetujuan</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan alasan / instruksi lanjutan..."
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  onReject(selectedApp.id, notes);
                  setSelectedApp(null);
                  setNotes('');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove(selectedApp.id, notes);
                  setSelectedApp(null);
                  setNotes('');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
              >
                Setujui (Approve)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External WhatsApp / Email Notification Modal */}
      <ExternalNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        poPayload={selectedPoForNotif}
      />
    </div>
  );
};
