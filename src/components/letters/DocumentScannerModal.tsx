import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Sliders,
  Check,
  FileText,
  Upload,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Trash2,
  Eye,
  Sun,
  Contrast,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ScannedAttachment } from '../../types';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveScans: (scans: ScannedAttachment[]) => void;
  defaultCategory?: 'Kontrak' | 'Nota / Kwitansi' | 'Lampiran BAST' | 'Surat Jalan' | 'Lainnya';
  letterTitle?: string;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveScans,
  defaultCategory = 'Kontrak',
  letterTitle,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Captured pages batch
  const [capturedPages, setCapturedPages] = useState<
    {
      id: string;
      originalDataUrl: string;
      filteredDataUrl: string;
      rotation: number; // 0, 90, 180, 270
      brightness: number; // 100 default
      contrast: number; // 100 default
      filter: 'normal' | 'bw' | 'magic' | 'contrast';
      category: 'Kontrak' | 'Nota / Kwitansi' | 'Lampiran BAST' | 'Surat Jalan' | 'Lainnya';
      title: string;
      notes: string;
    }[]
  >([]);

  const [activePageIndex, setActivePageIndex] = useState<number | null>(null);
  const [docCategory, setDocCategory] = useState<
    'Kontrak' | 'Nota / Kwitansi' | 'Lampiran BAST' | 'Surat Jalan' | 'Lainnya'
  >(defaultCategory);
  const [docTitle, setDocTitle] = useState<string>(
    letterTitle ? `Scan Lampiran ${letterTitle}` : 'Scan Dokumen Fisik Kontrak / Nota'
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan opsi upload berkas/foto dokumen.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode]);

  if (!isOpen) return null;

  // Process image filter on canvas
  const applyFilterToCanvas = (
    imgSrc: string,
    filter: 'normal' | 'bw' | 'magic' | 'contrast',
    rotation: number,
    brightness: number,
    contrast: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        // Handle rotation dimension
        if (rotation % 180 === 90) {
          tempCanvas.width = img.height;
          tempCanvas.height = img.width;
        } else {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
        }

        ctx.save();
        ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Get Image Data for pixel processing if B&W or Magic
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

        // Brightness & Contrast factor
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Apply Brightness & Contrast
          r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128 + (brightness - 100)));
          g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128 + (brightness - 100)));
          b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128 + (brightness - 100)));

          if (filter === 'bw') {
            // High Contrast Black & White
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const bw = gray > 128 ? 255 : 0;
            data[i] = bw;
            data[i + 1] = bw;
            data[i + 2] = bw;
          } else if (filter === 'magic') {
            // Magic color: Boost document text contrast and flatten background
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            if (gray > 180) {
              // Whitening background paper
              data[i] = Math.min(255, r * 1.15);
              data[i + 1] = Math.min(255, g * 1.15);
              data[i + 2] = Math.min(255, b * 1.15);
            } else {
              // Sharpening ink text/stamps
              data[i] = Math.max(0, r * 0.85);
              data[i + 1] = Math.max(0, g * 0.85);
              data[i + 2] = Math.max(0, b * 0.85);
            }
          } else if (filter === 'contrast') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(tempCanvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = imgSrc;
    });
  };

  // Capture Photo from Camera
  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const filtered = await applyFilterToCanvas(rawDataUrl, 'magic', 0, 100, 110);

    const newPage = {
      id: 'SCAN-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      originalDataUrl: rawDataUrl,
      filteredDataUrl: filtered,
      rotation: 0,
      brightness: 100,
      contrast: 110,
      filter: 'magic' as const,
      category: docCategory,
      title: `${docTitle} (Hal ${capturedPages.length + 1})`,
      notes: '',
    };

    setCapturedPages((prev) => [...prev, newPage]);
    setActivePageIndex(capturedPages.length);
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (result) {
          const filtered = await applyFilterToCanvas(result, 'normal', 0, 100, 100);
          const newPage = {
            id: 'SCAN-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            originalDataUrl: result,
            filteredDataUrl: filtered,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            filter: 'normal' as const,
            category: docCategory,
            title: file.name.replace(/\.[^/.]+$/, ''),
            notes: `File upload (${Math.round(file.size / 1024)} KB)`,
          };
          setCapturedPages((prev) => [...prev, newPage]);
          setActivePageIndex((prev) => (prev === null ? 0 : prev));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Update Page Filter / Adjustments
  const handleUpdateActivePage = async (
    updates: Partial<(typeof capturedPages)[0]>
  ) => {
    if (activePageIndex === null || !capturedPages[activePageIndex]) return;
    const currentPage = capturedPages[activePageIndex];

    const updated = { ...currentPage, ...updates };
    const newFiltered = await applyFilterToCanvas(
      updated.originalDataUrl,
      updated.filter,
      updated.rotation,
      updated.brightness,
      updated.contrast
    );

    setCapturedPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...updated, filteredDataUrl: newFiltered } : p
      )
    );
  };

  // Delete page from batch
  const handleDeletePage = (index: number) => {
    setCapturedPages((prev) => prev.filter((_, i) => i !== index));
    if (activePageIndex === index) {
      setActivePageIndex(capturedPages.length > 1 ? 0 : null);
    } else if (activePageIndex !== null && activePageIndex > index) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  // Save All Scans to Host Component
  const handleFinalizeSave = () => {
    if (capturedPages.length === 0) return;

    const formattedScans: ScannedAttachment[] = capturedPages.map((p, index) => {
      // Calculate approximate size
      const approxKb = Math.round((p.filteredDataUrl.length * 3) / 4 / 1024);
      return {
        id: p.id,
        title: p.title || `${docTitle} - Halaman ${index + 1}`,
        category: p.category || docCategory,
        imageDataUrl: p.filteredDataUrl,
        scannedAt: new Date().toISOString(),
        fileSizeKb: approxKb,
        notes: p.notes || `Diproses via Camera Scanner (${p.filter.toUpperCase()})`,
        filterUsed: p.filter,
      };
    });

    onSaveScans(formattedScans);
    onClose();
  };

  const activePage = activePageIndex !== null ? capturedPages[activePageIndex] : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Scanner Dokumen Fisik Kamera
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  AI Enhancement
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pindai lampiran fisik SPK, kontrak, nota, kwitansi, atau BAST langsung melalui kamera.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveMode('camera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeMode === 'camera'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera Live</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeMode === 'upload'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left / Center Panel: Live Camera or Photo Viewer */}
          <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col items-center justify-center relative min-h-[380px] overflow-hidden">
            {activeMode === 'camera' ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {cameraError ? (
                  <div className="text-center max-w-md p-6 bg-slate-900 rounded-2xl border border-rose-500/30">
                    <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                    <p className="font-bold text-sm text-rose-300 mb-2">Gagal Mengakses Kamera</p>
                    <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveMode('upload')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Foto dari Galeri</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full max-w-xl aspect-[3/4] max-h-[480px] bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Overlay Frame Guidelines */}
                    <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-inner">
                      <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 bg-slate-950/70 px-2.5 py-1 rounded-md backdrop-blur-sm self-center">
                        <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Posisikan Dokumen / Nota di dalam Bingkai</span>
                      </div>
                      <div className="text-center text-[10px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                        A4 / Form Nota Kontrak Fisik
                      </div>
                    </div>

                    {/* Floating Controls inside video view */}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-20">
                      <button
                        type="button"
                        onClick={() =>
                          setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                        }
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 backdrop-blur-md transition"
                        title="Tukar Kamera Depan/Belakang"
                      >
                        <RefreshCw className="w-5 h-5 text-slate-300" />
                      </button>

                      <button
                        type="button"
                        onClick={handleCapture}
                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-white text-slate-950 flex items-center justify-center shadow-2xl transition active:scale-90"
                        title="Jepret Foto Dokumen"
                      >
                        <Camera className="w-8 h-8 text-slate-950" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 backdrop-blur-md transition"
                        title="Upload dari Berkas File"
                      >
                        <Upload className="w-5 h-5 text-slate-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* File Upload View */
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-900 transition">
                <Upload className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
                <h4 className="font-bold text-sm text-white mb-1">
                  Upload Foto Hasil Scan / Nota Fisik
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Pilih satu atau beberapa berkas foto dokumen (JPG, PNG, WEBP) untuk diproses ke dalam daftar lampiran.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File dari Komputer / HP</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Active Page Inspector & Controls */}
          <div className="lg:col-span-4 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between space-y-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Halaman Terscan ({capturedPages.length})
                </span>
                {capturedPages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPages([]);
                      setActivePageIndex(null);
                    }}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Reset Semua
                  </button>
                )}
              </div>

              {/* Document Category & Metadata Form */}
              <div className="space-y-3 text-xs mb-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Kategori Lampiran Fisik:
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e: any) => setDocCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="Kontrak">Kontrak / SPK Fisik</option>
                    <option value="Nota / Kwitansi">Nota / Kwitansi / Struk Pembelian</option>
                    <option value="Lampiran BAST">Lampiran BAST / Progress Site</option>
                    <option value="Surat Jalan">Surat Jalan / Pengiriman</option>
                    <option value="Lainnya">Dokumen / Lampiran Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Judul Dokumen:</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Thumbnail Strip of captured pages */}
              {capturedPages.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Pilih Halaman Untuk Penyesuaian:
                  </span>
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {capturedPages.map((page, index) => (
                      <div
                        key={page.id}
                        onClick={() => setActivePageIndex(index)}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition ${
                          activePageIndex === index
                            ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-95'
                            : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={page.filteredDataUrl}
                          alt={`Hal ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-slate-950/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Hal {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(index);
                          }}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full text-[8px]"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Filter and Adjustment Panel for active page */}
                  {activePage && (
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-3 text-xs mt-3">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Filter AI & Rotasi
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateActivePage({
                              rotation: (activePage.rotation + 90) % 360,
                            })
                          }
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold flex items-center gap-1 text-[11px]"
                        >
                          <RotateCw className="w-3 h-3" /> Putar 90°
                        </button>
                      </div>

                      {/* Filter Presets */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                          Preset Kontras Teks:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'magic', label: 'Magic Color' },
                            { id: 'bw', label: 'Dokumen B&W' },
                            { id: 'contrast', label: 'Grayscale' },
                            { id: 'normal', label: 'Original' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() =>
                                handleUpdateActivePage({ filter: f.id as any })
                              }
                              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition ${
                                activePage.filter === f.id
                                  ? 'bg-emerald-600 border-emerald-400 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Brightness / Contrast Sliders */}
                      <div className="space-y-2 pt-1 border-t border-slate-700/60">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-400" /> Kecerahan
                            </span>
                            <span>{activePage.brightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={activePage.brightness}
                            onChange={(e) =>
                              handleUpdateActivePage({
                                brightness: Number(e.target.value),
                              })
                            }
                            className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="flex items-center gap-1">
                              <Contrast className="w-3 h-3 text-blue-400" /> Kontras Teks
                            </span>
                            <span>{activePage.contrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={activePage.contrast}
                            onChange={(e) =>
                              handleUpdateActivePage({
                                contrast: Number(e.target.value),
                              })
                            }
                            className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Belum ada halaman dokumen yang dijepret.
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Klik tombol kamera di sebelah kiri untuk mulai memindai.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Footer Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={capturedPages.length === 0}
                onClick={handleFinalizeSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Lampirkan ({capturedPages.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
