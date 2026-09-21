import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check } from "lucide-react";
import { compressImage } from "../utils/imageUpload";

interface ImageUploadPickerProps {
  label: string;
  value: string;
  onChange: (imageUrl: string) => void;
  required?: boolean;
  helpText?: string;
  previewAspect?: "video" | "square" | "landscape" | "auto";
}

export function ImageUploadPicker({
  label,
  value,
  onChange,
  required = false,
  helpText,
  previewAspect = "video",
}: ImageUploadPickerProps) {
  const isDataUrl = value?.startsWith("data:");
  const [sourceMode, setSourceMode] = useState<"upload" | "url">(
    isDataUrl || !value ? "upload" : "url",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    setError("");
    setIsProcessing(true);
    try {
      const res = await compressImage(file, 1400, 0.85);
      onChange(res.dataUrl);
      setFileName(res.name);
      setFileSizeKb(res.sizeKb);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to read image";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange("");
    setFileName("");
    setFileSizeKb(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const aspectClass =
    previewAspect === "square"
      ? "aspect-square"
      : previewAspect === "landscape"
      ? "aspect-[16/10]"
      : previewAspect === "video"
      ? "aspect-video"
      : "max-h-48";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#4b5953]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center rounded-lg bg-[#f0f2ee] p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSourceMode("upload")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
              sourceMode === "upload"
                ? "bg-white text-[#24312e] shadow-xs"
                : "text-[#7a8882] hover:text-[#24312e]"
            }`}
          >
            <Upload size={12} />
            <span>Upload Device</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode("url")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
              sourceMode === "url"
                ? "bg-white text-[#24312e] shadow-xs"
                : "text-[#7a8882] hover:text-[#24312e]"
            }`}
          >
            <LinkIcon size={12} />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {sourceMode === "upload" ? (
        <div className="space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
              value
                ? "border-emerald-500/40 bg-emerald-50/20"
                : "border-[#d8deda] bg-[#fafbfa] hover:border-[#315a3d] hover:bg-[#f3f6f4]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {isProcessing ? (
              <div className="py-4 text-xs font-semibold text-[#5a6b64]">
                Optimizing image for fast loading...
              </div>
            ) : value ? (
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Check size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#24312e] truncate max-w-[200px]">
                      {fileName || "Image from device"}
                    </p>
                    {fileSizeKb && (
                      <p className="text-[10px] text-[#7a8882]">{fileSizeKb} KB · Web-optimized</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="rounded-lg p-1 text-[#87968f] hover:bg-red-50 hover:text-red-600 transition"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1ee] text-[#4b5953]">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-bold text-[#24312e]">
                  Click or drag image from computer
                </p>
                <p className="text-[10px] text-[#7a8882]">
                  PNG, JPG, WebP supported (auto-resized & optimized)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or CDN link"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#315a3d]"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#87968f] hover:text-red-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600">{error}</p>
      )}

      {/* Visual Preview */}
      {value && (
        <div className="relative overflow-hidden rounded-xl border border-[#dfe1dc] bg-[#1a2522]">
          <div className={`relative ${aspectClass} max-h-40 sm:max-h-44 w-full overflow-hidden`}>
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover object-center"
              onError={() => setError("Image failed to load. Check the file or URL.")}
            />
          </div>
          <div className="flex items-center justify-between bg-[#121c18] px-3 py-1.5 text-[10px] text-[#cfe0d7]">
            <span className="flex items-center gap-1">
              <ImageIcon size={12} className="text-[#f4bc83]" />
              <span>Preview</span>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="font-bold text-red-400 hover:text-red-300"
            >
              Change Image
            </button>
          </div>
        </div>
      )}

      {helpText && !error && (
        <p className="text-[11px] text-[#7a8882]">{helpText}</p>
      )}
    </div>
  );
}
