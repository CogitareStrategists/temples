"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function DonationQR({
  vpa,
  payeeName,
  imageUrl,
  label,
}: {
  vpa: string | null;
  payeeName: string | null;
  imageUrl: string | null;
  label: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const upiLink =
    vpa ? `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName ?? "")}&cu=INR` : null;

  useEffect(() => {
    if (imageUrl || !upiLink) return;
    QRCode.toDataURL(upiLink, { width: 220, margin: 1 }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [upiLink, imageUrl]);

  if (!vpa && !imageUrl) return null;
  const src = imageUrl ?? dataUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-44 w-44 rounded-lg border border-ink/10 bg-white p-2" />
      ) : (
        <div className="grid h-44 w-44 place-items-center rounded-lg border border-ink/10 text-xs text-muted">…</div>
      )}
      <p className="text-xs text-muted">{label}</p>
      {vpa && <p className="font-mono text-sm">{vpa}</p>}
      {upiLink && (
        <a href={upiLink} className="btn-saffron w-full">
          Pay via UPI app
        </a>
      )}
    </div>
  );
}
