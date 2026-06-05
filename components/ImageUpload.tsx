"use client";
import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

// Reusable image picker: uploads straight to Vercel Blob and stores the
// resulting URL in a hidden input so the surrounding <form> submits it.
export function ImageUpload({
  name,
  label,
  defaultUrl,
}: {
  name: string;
  label: string;
  defaultUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    setPct(0);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: (p) => setPct(Math.round(p.percentage)),
      });
      setUrl(blob.url);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      {/* carries the uploaded URL into the form submit */}
      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-20 w-20 rounded-lg border border-ink/10 object-cover" />
          <button type="button" className="text-sm text-kumkum hover:underline" onClick={() => setUrl("")}>
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPick}
        disabled={busy}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sandal file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-turmeric/30"
      />
      {busy && <p className="mt-1 text-xs text-saffron">Uploading… {pct}%</p>}
      {err && <p className="mt-1 text-xs text-kumkum">{err}</p>}
    </div>
  );
}
