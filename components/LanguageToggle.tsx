"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function set(next: Lang) {
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    start(() => router.refresh());
  }
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-ink/15 text-xs" aria-busy={pending}>
      <button
        onClick={() => set("en")}
        className={`px-3 py-1 ${lang === "en" ? "bg-kumkum text-white" : "bg-white/70 text-ink"}`}
      >
        EN
      </button>
      <button
        onClick={() => set("te")}
        className={`px-3 py-1 lang-te ${lang === "te" ? "bg-kumkum text-white" : "bg-white/70 text-ink"}`}
      >
        తెలుగు
      </button>
    </div>
  );
}
