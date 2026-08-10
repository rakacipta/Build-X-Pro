import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  X,
  History,
  User,
  Clock,
  Database,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Globe,
  Tag,
  Download,
} from 'lucide-react';
import { DeepAuditLog, ModuleType, UserRole } from '../../types';

interface DeepAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: DeepAuditLog[];
  onRecordLog?: (log: Omit<DeepAuditLog, 'id' | 'timestamp'>) => void;
}

export const DeepAuditLogModal: React.FC<DeepAuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onRecordLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<DeepAuditLog | null>(null);

  if (!isOpen) return null;

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.itemTitle && log.itemTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModule = selectedModule === 'All' || log.module === selectedModule;
    const matchesUser = selectedUser === 'All' || log.userName.includes(selectedUser);

    return matchesSearch && matchesModule && matchesUser;
  });

  const uniqueModules = Array.from(new Set(auditLogs.map((l) => String(l.module))));
  const uniqueUsers = Array.from(new Set(auditLogs.map((l) => String(l.userName))));

  const exportAuditLogs = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deep_Audit_Log_ERP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Deep System Audit Log & Field Change History
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pencatatan riwayat perubahan per-kolom secara mendalam (Siapa, Kapan, Kolom, Nilai Lama vs Baru, & Alasan Edit).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama staf, entitas, kolom, atau alasan edit..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Semua Modul ({uniqueModules.length})</option>
              {uniqueModules.map((m) => (
                <option key={String(m)} value={String(m)}>
                  Modul: {String(m).toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Semua Staf Pengubah</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={exportAuditLogs}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">Belum ada riwayat audit log yang sesuai filter.</p>
              <p className="text-xs text-slate-600">
                Setiap kali staf memperbarui data tender, invoice, atau jurnal, perubahan akan dicatat di sini.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedLog?.id === log.id
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {log.module}
                    </span>
                    <span className="text-xs font-bold text-white">{log.entityName}</span>
                    {log.itemTitle && (
                      <span className="text-xs text-slate-400 font-normal truncate max-w-xs">
                        ({log.itemTitle})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3 h-3 text-slate-500" />
                      <strong className="text-white">{log.userName}</strong> ({log.userRole})
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Field Change Diff */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-3 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      Kolom Yang Diubah
                    </span>
                    <span className="font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-1 rounded mt-1 inline-block w-fit">
                      {log.fieldName}
                    </span>
                  </div>

                  <div className="md:col-span-4 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex flex-col">
                    <span className="text-[10px] text-rose-400 uppercase tracking-wider font-mono font-bold">
                      Nilai Sebelum (Old):
                    </span>
                    <span className="text-slate-300 font-mono text-xs mt-0.5 line-through decoration-rose-500/70 truncate">
                      {log.oldValue || '(kosong)'}
                    </span>
                  </div>

                  <div className="md:col-span-5 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-900/50 flex flex-col">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-bold">
                      Nilai Sesudah (New):
                    </span>
                    <span className="text-emerald-300 font-mono text-xs font-bold mt-0.5 truncate">
                      {log.newValue}
                    </span>
                  </div>
                </div>

                {/* Reason & IP details when expanded */}
                {log.reason && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">Alasan Perubahan:</strong> {log.reason}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Audit log bersifat <strong>Immutable</strong> (tidak dapat dihapus manual) sesuai standar kepatuhan ISO 27001.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Total Log: {filteredLogs.length} dari {auditLogs.length}
          </span>
        </div>
      </div>
    </div>
  );
};
