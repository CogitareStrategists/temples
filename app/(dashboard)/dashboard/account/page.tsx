import { requireUser } from "@/lib/auth-helpers";
import { getUserById } from "@/lib/queries/users";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  temple_manager: "Temple Manager",
  temple_admin: "Temple Admin",
};

export default async function AccountPage() {
  const session = await requireUser();
  const me = await getUserById(session.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Account</h1>
        <p className="text-sm text-muted">
          {me?.full_name} · {me?.email} · {ROLE_LABEL[session.role] ?? session.role}
        </p>
      </div>
      <div>
        <h2 className="mb-3 font-display text-xl text-kumkum">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
