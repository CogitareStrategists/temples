"use client";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";

export function ShareEvent({
  eventId,
  title,
  templeName,
  dateText,
  lang,
}: {
  eventId: string;
  title: string;
  templeName: string;
  dateText?: string;
  lang: Lang;
}) {
  const [copied, setCopied] = useState(false);
  const L = lang === "te"
    ? { share: "షేర్ చేయండి", copy: "లింక్ కాపీ", copied: "కాపీ అయింది" }
    : { share: "Share", copy: "Copy link", copied: "Copied" };

  function parts() {
    const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    const url = `${base}#event-${eventId}`;
    const text = `🪔 ${title} — ${templeName}${dateText ? `, ${dateText}` : ""}`;
    return { url, text };
  }

  function native() {
    const { url, text } = parts();
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      copy();
    }
  }
  function copy() {
    const { url } = parts();
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  function openShare(kind: "wa" | "fb" | "x") {
    const { url, text } = parts();
    const e = encodeURIComponent;
    const href =
      kind === "wa"
        ? `https://wa.me/?text=${e(`${text} ${url}`)}`
        : kind === "fb"
          ? `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`
          : `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const chip = "rounded-full border border-ink/15 px-2.5 py-1 hover:border-saffron hover:bg-white";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/70">
      <button type="button" onClick={native} className={`${chip} font-medium text-saffron`}>↗ {L.share}</button>
      <button type="button" onClick={() => openShare("wa")} className={chip}>WhatsApp</button>
      <button type="button" onClick={() => openShare("fb")} className={chip}>Facebook</button>
      <button type="button" onClick={() => openShare("x")} className={chip}>X</button>
      <button type="button" onClick={copy} className={chip}>{copied ? L.copied : L.copy}</button>
    </div>
  );
}
