import React, { useRef } from 'react';
import { X, Printer, Tag, Download, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FixedAsset } from '../../types';

interface AssetQrTagPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: FixedAsset[];
  selectedAsset?: FixedAsset | null;
}

export const AssetQrTagPrintModal: React.FC<AssetQrTagPrintModalProps> = ({
  isOpen,
  onClose,
  assets,
  selectedAsset,
}) => {
  if (!isOpen) return null;

  const targetAssets = selectedAsset ? [selectedAsset] : assets;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]">
        {/* Header - Screen Only */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              <Tag className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cetak Label QR Tag Aktiva Tetap</h2>
              <p className="text-xs text-slate-400">
                {selectedAsset
                  ? `Label stiker tunggal untuk ${selectedAsset.assetCode}`
                  : `Label stiker batch untuk ${targetAssets.length} unit aset`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              Cetak ke Printer
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto bg-slate-100 print:bg-white print:p-0 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {targetAssets.map((asset) => {
              const qrPayload = JSON.stringify({
                code: asset.assetCode,
                name: asset.name,
                cat: asset.category,
                pic: asset.personInCharge,
                loc: asset.projectName || asset.locationType,
                cal: asset.nextCalibrationDate || 'N/A',
              });

              return (
                <div
                  key={asset.id}
                  className="bg-white border-2 border-dashed border-slate-400 rounded-xl p-4 flex gap-4 items-center shadow-xs break-inside-avoid print:border-black print:rounded-none print:shadow-none"
                  style={{ minHeight: '135px' }}
                >
                  <div className="p-2 bg-white rounded-lg border border-slate-300 shrink-0 flex items-center justify-center">
                    <QRCodeSVG
                      value={qrPayload}
                      size={86}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                      <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                        BUILD X PRO ASSET TAG
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        PT. RAKA CIPTA SERAYA
                      </span>
                    </div>

                    <div className="text-sm font-black font-mono tracking-tight text-slate-900">
                      {asset.assetCode}
                    </div>

                    <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                      {asset.name}
                    </div>

                    <div className="text-[10px] text-slate-600 flex justify-between pt-0.5">
                      <span>Kat: <strong>{asset.category}</strong></span>
                      {asset.serialNumber && (
                        <span>SN: <strong className="font-mono">{asset.serialNumber}</strong></span>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-500 flex justify-between border-t border-slate-200 pt-1">
                      <span className="truncate max-w-[130px]">
                        Lok: {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}
                      </span>
                      <span>PIC: {asset.personInCharge}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info - screen only */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden shrink-0">
          <span>
            💡 Tips: Gunakan kertas stiker label sintetis / vinyl tahan air (waterproof) untuk alat proyek lapangan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
