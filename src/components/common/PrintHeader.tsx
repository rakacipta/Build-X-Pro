import React from 'react';
import { CompanyProfile } from '../../types';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  docNumber?: string;
  companyProfile?: CompanyProfile;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle = 'Sistem Informasi Manajemen Konstruksi & Trading (Construx ERP)',
  docNumber,
  companyProfile,
}) => {
  const companyName = companyProfile?.name || 'PT GRAHA MULTI KONSTRUKSI';
  const logoUrl = companyProfile?.logoUrl;
  const address = companyProfile?.address || 'Jl. Raya Utama Konstruksi No. 88, Sudirman Center, Jakarta';
  const contact = `${companyProfile?.phone || '021-5558899'} | ${companyProfile?.email || 'info@grahamulti.co.id'}`;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 relative">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600 rounded-t mb-4"></div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Perusahaan"
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center font-black text-xl rounded">
              GMK
            </div>
          )}
          <div>
            <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">
              {companyName}
            </h1>
            <p className="text-[11px] text-slate-600 leading-tight">{address}</p>
            <p className="text-[10px] text-slate-500">{contact}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="font-extrabold text-blue-900 uppercase tracking-wide text-sm">
            {title}
          </div>
          {docNumber && (
            <div className="font-mono text-slate-700 font-bold">
              No: {docNumber}
            </div>
          )}
          <div className="text-[10px] text-slate-500 mt-1">
            Dicetak Tanggal: {currentDate}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-500 italic text-center border-t border-slate-200 pt-1">
        {subtitle}
      </div>
    </div>
  );
};
