import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Save,
  FileCheck2,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Star,
  Camera,
  Trash2,
  PenTool,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CustomForm,
  CustomFormField,
  FormSubmission,
  Project,
  SystemUser,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface FormFillModalProps {
  form: CustomForm;
  projects: Project[];
  currentUser?: SystemUser | null;
  onClose: () => void;
  onSubmit: (submission: FormSubmission) => void;
}

export const FormFillModal: React.FC<FormFillModalProps> = ({
  form,
  projects,
  currentUser,
  onClose,
  onSubmit,
}) => {
  // Selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    form.projectId || (projects.length > 0 ? projects[0].id : '')
  );
  const [locationName, setLocationName] = useState<string>('');

  // Values dictionary: fieldId -> value
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    form.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        initial[f.id] = f.defaultValue;
      } else if (f.type === 'date') {
        initial[f.id] = new Date().toISOString().split('T')[0];
      } else if (f.type === 'condition' && f.options && f.options.length > 0) {
        initial[f.id] = f.options[0];
      } else if (f.type === 'rating') {
        initial[f.id] = 5;
      }
    });
    return initial;
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photos state
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { id: string; caption?: string; dataUrl: string; timestamp: string }[]
  >([]);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Signature Pad state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [signerName, setSignerName] = useState<string>(
    currentUser?.name || 'Pelapor Lapangan'
  );
  const [signerRole, setSignerRole] = useState<string>(
    currentUser?.role || 'Staff Pelaksana'
  );

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Field value change handler
  const handleFieldChange = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Handle Photo upload simulation or file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto = {
        id: `pho-${Date.now()}`,
        caption: photoCaption.trim() || file.name,
        dataUrl,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setUploadedPhotos((prev) => [...prev, newPhoto]);
      setPhotoCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleAddSamplePhoto = () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    ];
    const picked = sampleUrls[uploadedPhotos.length % sampleUrls.length];
    const newPhoto = {
      id: `pho-${Date.now()}`,
      caption: photoCaption.trim() || `Dokumentasi Lapangan #${uploadedPhotos.length + 1}`,
      dataUrl: picked,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setUploadedPhotos((prev) => [...prev, newPhoto]);
    setPhotoCaption('');
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Validate and submit
  const handleSave = (isDraft: boolean = false) => {
    const newErrors: Record<string, string> = {};

    if (!isDraft) {
      form.fields.forEach((field) => {
        if (field.type === 'heading') return;
        if (field.required) {
          const val = values[field.id];
          if (val === undefined || val === null || val === '') {
            newErrors[field.id] = `Bidang '${field.label}' wajib diisi`;
          }
        }
      });

      if (form.requirePhoto && uploadedPhotos.length === 0) {
        newErrors['photos'] = 'Wajib menyertakan minimal 1 foto dokumentasi lapangan';
      }

      if (form.requireSignature && !hasSignature) {
        newErrors['signature'] = 'Tanda tangan digital pelapor wajib dibubuhkan';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to first error
      return;
    }

    // Get Signature dataUrl if available
    let signatureDataUrl: string | undefined = undefined;
    if (hasSignature && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now
      .toTimeString()
      .slice(0, 5)}`;

    const submissionNumber = `SUB/${now.getFullYear()}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${String(Math.floor(100 + Math.random() * 900))}`;

    const newSubmission: FormSubmission = {
      id: `sub-${Date.now()}`,
      submissionNumber,
      formId: form.id,
      formCode: form.code,
      formTitle: form.title,
      formCategory: form.category,
      projectId: selectedProjectId || undefined,
      projectName: selectedProject?.name,
      location: locationName.trim() || selectedProject?.location || undefined,
      submittedBy: signerName || currentUser?.name || 'Pelapor Lapangan',
      submittedByRole: signerRole || currentUser?.role || 'Staff Lapangan',
      submittedByEmail: currentUser?.email,
      submittedAt: formattedDate,
      values,
      signatures: signatureDataUrl
        ? [
            {
              role: signerRole,
              name: signerName,
              title: signerRole,
              signatureDataUrl,
              signedAt: formattedDate,
            },
          ]
        : [],
      photos: uploadedPhotos,
      status: isDraft ? 'Draft' : 'Submitted',
    };

    onSubmit(newSubmission);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  {form.code}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {form.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {form.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Form Description & Project Assignment Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            {form.description && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {form.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Pilih Proyek Terkait
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Formulir Umum (Non-Proyek) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Area / Lokasi Spesifik Lapangan
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Contoh: Lantai 8 Zona Barat / Abutment 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mohon lengkapi isian formulir:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {Object.values(errors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Dynamic Fields Container */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            {form.fields.map((field) => {
              // 1. Heading / Section Divider
              if (field.type === 'heading') {
                return (
                  <div
                    key={field.id}
                    className="pt-4 pb-1 border-b border-slate-200 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {field.label}
                    </h3>
                  </div>
                );
              }

              const hasError = !!errors[field.id];

              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      {field.label}
                      {field.required && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </label>
                    {field.unit && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                        Satuan: {field.unit}
                      </span>
                    )}
                  </div>

                  {field.helpText && (
                    <p className="text-[11px] text-slate-500">{field.helpText}</p>
                  )}

                  {/* Input Types */}
                  {/* Short Text */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={values[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Ketik isian teks...'}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium border ${
                        hasError
                          ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                          : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      value={values[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Tuliskan rincian...'}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium border ${
                        hasError
                          ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                          : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    />
                  )}

                  {/* Number */}
                  {field.type === 'number' && (
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={values[field.id] !== undefined ? values[field.id] : ''}
                        onChange={(e) =>
                          handleFieldChange(
                            field.id,
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder={field.placeholder || '0'}
                        className={`w-full px-3.5 py-2 rounded-lg text-xs font-mono font-medium border ${
                          hasError
                            ? 'border-rose-400 bg-rose-50/50'
                            : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      />
                      {field.unit && (
                        <div className="absolute right-3 top-2 text-xs text-slate-400 font-semibold pointer-events-none">
                          {field.unit}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Currency (Rupiah) */}
                  {field.type === 'currency' && (
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={values[field.id] !== undefined ? values[field.id] : ''}
                          onChange={(e) =>
                            handleFieldChange(
                              field.id,
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder={field.placeholder || '0'}
                          className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-xs font-mono font-bold text-indigo-900 border ${
                            hasError
                              ? 'border-rose-400 bg-rose-50/50'
                              : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      {values[field.id] > 0 && (
                        <p className="text-[11px] font-semibold text-indigo-600">
                          Terbilang: {formatRupiah(values[field.id])}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  {field.type === 'date' && (
                    <div className="relative">
                      <input
                        type="date"
                        value={values[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium border ${
                          hasError
                            ? 'border-rose-400 bg-rose-50/50'
                            : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Time */}
                  {field.type === 'time' && (
                    <input
                      type="time"
                      value={values[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium border ${
                        hasError
                          ? 'border-rose-400 bg-rose-50/50'
                          : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    />
                  )}

                  {/* Select Dropdown */}
                  {field.type === 'select' && (
                    <select
                      value={values[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium border ${
                        hasError
                          ? 'border-rose-400 bg-rose-50/50'
                          : 'border-slate-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    >
                      <option value="">-- Pilih Opsi --</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Condition Buttons / Inspection state */}
                  {field.type === 'condition' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(field.options || ['Baik', 'Cukup', 'Rusak']).map((opt) => {
                        const isSelected = values[field.id] === opt;
                        const isPositive =
                          opt.toLowerCase().includes('pass') ||
                          opt.toLowerCase().includes('lengkap') ||
                          opt.toLowerCase().includes('aman') ||
                          opt.toLowerCase().includes('patuh') ||
                          opt.toLowerCase().includes('baik') ||
                          opt.toLowerCase().includes('sesuai');
                        const isNegative =
                          opt.toLowerCase().includes('fail') ||
                          opt.toLowerCase().includes('rusak') ||
                          opt.toLowerCase().includes('kritis') ||
                          opt.toLowerCase().includes('bahaya') ||
                          opt.toLowerCase().includes('tolak');

                        let activeClass = 'bg-indigo-600 text-white border-indigo-600';
                        if (isPositive) {
                          activeClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
                        } else if (isNegative) {
                          activeClass = 'bg-rose-600 text-white border-rose-600 shadow-sm';
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleFieldChange(field.id, opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                              isSelected
                                ? activeClass
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && '✓ '} {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Star Rating */}
                  {field.type === 'rating' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleFieldChange(field.id, star)}
                          className={`p-1.5 rounded-lg transition ${
                            (values[field.id] || 0) >= star
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-300 hover:text-slate-400'
                          }`}
                        >
                          <Star
                            className="w-5 h-5 fill-current"
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {values[field.id] || 0} dari 5 Bintang
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Photos & Evidence Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Foto Dokumentasi & Bukti Lapangan
                </h3>
                {form.requirePhoto && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                    Wajib
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {uploadedPhotos.length} Foto Terlampir
              </span>
            </div>

            {/* Photo Uploader Action */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Tulis keterangan foto (contoh: Pengecoran balok zona 2)"
                className="w-full sm:flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm flex-1 sm:flex-none"
                >
                  <Camera className="w-3.5 h-3.5" /> Pilih Foto
                </button>
                <button
                  type="button"
                  onClick={handleAddSamplePhoto}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  title="Gunakan foto simulasi proyek"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Contoh
                </button>
              </div>
            </div>

            {/* Photo Preview Grid */}
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || 'Foto Lapangan'}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-white text-[11px]">
                      <p className="font-semibold text-slate-800 truncate">
                        {photo.caption || 'Dokumentasi'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Pukul {photo.timestamp}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md shadow-md opacity-90 hover:opacity-100 transition"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Digital Signature Pad */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tanda Tangan Digital & Otorisasi
                </h3>
                {form.requireSignature && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                    Wajib
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Bersihkan TTD
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Penandatangan
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Nama Lengkap Penandatangan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jabatan / Role
                  </label>
                  <input
                    type="text"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    placeholder="Contoh: Site Manager / Supervisor K3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                  <span className="font-bold">Ketentuan Otorisasi:</span> Dengan
                  membubuhkan tanda tangan digital di kanvas, Anda menyatakan bahwa
                  seluruh informasi dan temuan yang dilaporkan adalah benar sesuai
                  kondisi lapangan.
                </div>
              </div>

              {/* Canvas Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Goreskan Tanda Tangan di Sini:
                </label>
                <div
                  className={`border-2 rounded-xl overflow-hidden bg-slate-50 relative ${
                    errors['signature']
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-dashed border-slate-300'
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                      Goreskan tanda tangan menggunakan mouse atau layar sentuh
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Formulir akan tercatat resmi dalam sistem audit trail Build X Pro.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Draf
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Kirim Formulir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
