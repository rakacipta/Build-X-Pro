import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, RotateCcw, Trash2, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SignaturePickerProps {
  value?: string;
  onChange: (signatureUrl: string | undefined) => void;
  label?: string;
}

export const SignaturePicker: React.FC<SignaturePickerProps> = ({
  value,
  onChange,
  label = 'Tanda Tangan Digital (E-Signature)',
}) => {
  const [mode, setMode] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas context
  useEffect(() => {
    if (mode === 'DRAW' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a'; // slate-900
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    onChange(undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas gambar maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-blue-600" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('DRAW')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
              mode === 'DRAW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>Gambar</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('UPLOAD')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
              mode === 'UPLOAD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Mode Draw Canvas */}
      {mode === 'DRAW' && (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white p-1 overflow-hidden shadow-inner group">
            <canvas
              ref={canvasRef}
              width={380}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 cursor-crosshair touch-none bg-white rounded-lg"
            />
            {!hasDrawn && !value && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300">
                <PenTool className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[11px] font-medium">Goreskan tanda tangan di sini...</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 italic">
              *Tanda tangan akan tersimpan dan ditampilkan pada dokumen PDF.
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Bersihkan Canvas</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode Upload File */}
      {mode === 'UPLOAD' && (
        <div className="space-y-2">
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-1 transition" />
            <span className="font-bold text-slate-700 text-xs">Pilih Gambar Tanda Tangan / Stempel</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Format PNG, JPG, WebP (Transparan disarankan)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Signature Preview Thumbnail */}
      {value && (
        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-10 bg-white border border-blue-200 rounded-lg p-1 flex items-center justify-center">
              <img src={value} alt="Preview Signature" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-blue-900 text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tanda Tangan Digital Siap!
              </p>
              <p className="text-[10px] text-blue-700">Akan dicetak pada blok tanda tangan PDF.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
            title="Hapus Tanda Tangan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
