"use client";

import { useState } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [preview, setPreview]     = useState(currentImage ?? "");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP or GIF images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Upload failed");
      }

      setPreview(data.secure_url);
      onUpload(data.secure_url);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">
        Product image
        <span className="text-slate-500 font-normal ml-1">(optional)</span>
      </label>

      {/* Upload area */}
      <label className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
        uploading
          ? "border-indigo-500/50 bg-indigo-500/5"
          : "border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/60"
      }`}>
        {preview ? (
          // Show preview if image uploaded
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          // Show upload prompt
          <div className="flex flex-col items-center gap-2 text-center px-4">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Uploading...</p>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-slate-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-600">PNG, JPG, WEBP up to 5MB</p>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>

      {/* Change image button if already uploaded */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => { setPreview(""); onUpload(""); }}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors self-start"
        >
          Remove image
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
