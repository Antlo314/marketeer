"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, AlertCircle } from "lucide-react";

interface ImageUploadFieldProps {
  value: string; // The current base64 or source URL
  onChange: (imageValue: string) => void;
  label?: string;
  id?: string;
}

export default function ImageUploadField({ value, onChange, label, id = "image-uploader" }: ImageUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear the selected image
  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setErrorStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process selected file is helper
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("Format not supported. Please select an image file.");
      return;
    }

    // Limit image size to 5MB to ensure safe storage within typical database/state boundaries
    if (file.size > 5 * 1024 * 1024) {
      setErrorStatus("Image is too large. Please select an image under 5MB.");
      return;
    }

    setErrorStatus(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        onChange(e.target.result);
      } else {
        setErrorStatus("Failed to read the selected file.");
      }
    };
    reader.onerror = () => {
      setErrorStatus("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  // Event handlers for drag & drop
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Standard selector input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isPlaceholderUrl = (url: string) => {
    return !url || url.includes("placeholder") || url.includes("picsum.photos/seed/placeholder");
  };

  return (
    <div className="space-y-2 w-full" id={`uploader-container-${id}`}>
      {label && (
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
          {label}
        </label>
      )}

      {/* Upload canvas dropzone container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative w-full rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-300 min-h-[190px] flex flex-col items-center justify-center p-4 bg-slate-900/40 ${
          dragActive
            ? "border-teal-400 bg-teal-500/5 shadow-lg shadow-teal-500/5"
            : value && !isPlaceholderUrl(value)
            ? "border-slate-800 hover:border-slate-700 bg-slate-900"
            : "border-slate-800 hover:border-teal-500/50 hover:bg-slate-900/60"
        }`}
        id={`dropzone-${id}`}
      >
        {/* Real hidden file Input */}
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {value && !isPlaceholderUrl(value) ? (
          /* Live Image Preview Mode */
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3 p-1 relative group">
            <div className="relative w-full aspect-video sm:aspect-square max-h-[160px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
              <Image
                src={value}
                alt="Selected Preview"
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-contain"
                referrerPolicy="no-referrer"
                unoptimized // Use unoptimized for base64 data URIs to avoid rendering issues with static builds/optimizations
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/10">
                Local Device Loaded
              </span>
              <button
                type="button"
                onClick={handleClearImage}
                className="p-1 px-1.5 bg-slate-800 hover:bg-rose-550/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/20 rounded font-mono text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Prompt State to guide selection */
          <div className="text-center space-y-3 pointer-events-none py-4">
            <div className="h-10 w-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-400 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">
                Drag & drop product image here
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                or click to browse your devices
              </p>
            </div>
            <p className="text-[9px] text-slate-550 font-mono">
              Supports JPEG, PNG, WEBP (Max 5MB)
            </p>
          </div>
        )}

        {/* Highlight drag active border ring details */}
        {dragActive && (
          <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
            <span className="text-xs font-bold font-mono text-teal-400 uppercase tracking-widest bg-slate-950 border border-teal-500/20 px-3 py-1.5 rounded-lg shadow-lg">
              Drop file here
            </span>
          </div>
        )}
      </div>

      {errorStatus && (
        <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}
    </div>
  );
}
