import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/auth-helpers";
import { LogoutButton } from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  temple_manager: "Temple Manager",
  temple_admin: "Temple Admin",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const r = user.role;
  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/dashboard", label: "Overview", show: true },
    { href: "/dashboard/temples", label: "Temples", show: true },
    { href: "/dashboard/home", label: "Home page", show: r === "super_admin" },
    { href: "/dashboard/areas", label: "Areas", show: r === "super_admin" },
    { href: "/dashboard/deities", label: "Deities", show: r === "super_admin" },
    { href: "/dashboard/facilities", label: "Facilities", show: r === "super_admin" },
    { href: "/dashboard/temples/new", label: "Add Temple", show: can.addTemple(r) },
    { href: "/dashboard/payments", label: "Payments", show: true },
    { href: "/dashboard/suggestions", label: "Suggestions", show: can.suggestFields(r) || can.reviewSuggestions(r) },
    { href: "/dashboard/approvals", label: "Approvals", show: can.approveTemples(r) },
    { href: "/dashboard/users", label: "Users", show: can.manageUsers(r) },
    { href: "/dashboard/account", label: "Account", show: true },
  ];
  return (
    <div className="container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <p className="mb-3 text-xs text-saffron">{ROLE_LABEL[r]}</p>
          <nav className="flex flex-col gap-1 text-sm">
            {links
              .filter((l) => l.show)
              .map((l) => (
                <Link key={l.href} href={l.href} className="rounded px-2 py-1.5 text-ink/80 hover:bg-sandal">
                  {l.label}
                </Link>
              ))}
            <div className="mt-2 border-t border-ink/10 pt-2">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </aside>
      <section>{children}</section>
    </div>
  );
}
