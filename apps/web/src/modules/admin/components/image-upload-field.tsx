"use client";

import { useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";

import { useTranslation } from "@/modules/i18n/use-translation";

type ImageUploadFieldProps = {
  label: string;
  pathPrefix: string;
  onUploaded: (url: string) => void;
  buttonLabel?: string;
};

export function ImageUploadField({ label, pathPrefix, onUploaded, buttonLabel }: ImageUploadFieldProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const effectiveButtonLabel = buttonLabel || t("admin.image_upload.button_default");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setProgress(0);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
      const finalPath = `${pathPrefix}/${Date.now()}-${sanitizedName}`;
      const arrayBuffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      const response = await adminFetch("/api/admin/storage/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64,
          fileName: sanitizedName,
          contentType: file.type,
          path: finalPath,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? t("admin.image_upload.error_upload"));
      }

      onUploaded(json.data.url as string);
      setProgress(null);
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error ? uploadError.message : t("admin.image_upload.error_generic"),
      );
      setProgress(null);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700">
          {effectiveButtonLabel}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
        {progress !== null && (
          <span className="text-xs text-slate-500">{t("admin.image_upload.uploading")} {progress}%</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0xffff;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
