import { t, type Lang } from "@/lib/i18n";

export function Footer({ lang }: { lang: Lang }) {
  const tr = t(lang);
  return (
    <footer className="border-t border-ink/10 bg-sandal/60">
      <div className="container-page flex flex-col gap-1 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className={lang === "te" ? "lang-te" : ""}>
          {tr.appName} · {tr.tagline}
        </span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
