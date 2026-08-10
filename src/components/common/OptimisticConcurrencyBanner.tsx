import React from 'react';
import { AlertTriangle, Lock, User, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ActiveDocumentLock, UserRole } from '../../types';

interface OptimisticConcurrencyBannerProps {
  activeLock?: ActiveDocumentLock | null;
  currentEmail?: string;
  isVersionConflict?: boolean;
  onRefreshData?: () => void;
  onOverrideLock?: () => void;
}

export const OptimisticConcurrencyBanner: React.FC<OptimisticConcurrencyBannerProps> = ({
  activeLock,
  currentEmail,
  isVersionConflict = false,
  onRefreshData,
  onOverrideLock,
}) => {
  if (!activeLock && !isVersionConflict) return null;

  const isLockedByOther =
    activeLock && currentEmail && activeLock.lockedByEmail.toLowerCase() !== currentEmail.toLowerCase();

  if (isVersionConflict) {
    return (
      <div className="p-4 bg-amber-950/80 border border-amber-500/80 text-amber-100 rounded-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Peringatan Konflik Edit Serentak (Optimistic Concurrency)
            </h4>
            <p className="text-xs text-amber-200/90">
              Dokumen ini telah diperbarui oleh staf lain di background saat Anda membuka layar ini. Muat ulang data terbaru sebelum menyimpan agar perubahan staf lain tidak tertimpa.
            </p>
          </div>
        </div>

        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang Data Terbaru</span>
          </button>
        )}
      </div>
    );
  }

  if (isLockedByOther && activeLock) {
    return (
      <div className="p-3.5 bg-rose-950/70 border border-rose-500/60 text-rose-100 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-rose-200 flex items-center gap-1.5">
              <span>Dokumen Sedang Disunting Oleh Staf Lain</span>
              <span className="bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-mono">
                LOCKED
              </span>
            </p>
            <p className="text-rose-300/80">
              <strong className="text-white">{activeLock.lockedByName}</strong> ({activeLock.lockedByRole}) sedang menyunting item ini sejak {new Date(activeLock.lockedAt).toLocaleTimeString('id-ID')}.
            </p>
          </div>
        </div>

        {onOverrideLock && (
          <button
            type="button"
            onClick={onOverrideLock}
            className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 border border-rose-700 text-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <span>Minta Buka Kunci</span>
          </button>
        )}
      </div>
    );
  }

  return null;
};
