import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getSession } from "@/lib/auth-helpers";

export async function Header({ lang }: { lang: Lang }) {
  const tr = t(lang);
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-sandal/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-kumkum text-white font-display">ॐ</span>
          <span className={`font-display text-xl font-semibold text-kumkum ${lang === "te" ? "lang-te" : ""}`}>
            {tr.appName}
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/temples" className="hidden sm:inline text-ink/80 hover:text-kumkum">
            {tr.temples}
          </Link>
          <LanguageToggle lang={lang} />
          {session?.user ? (
            <Link href="/dashboard" className="btn-ghost">
              {tr.dashboard}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              {tr.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
