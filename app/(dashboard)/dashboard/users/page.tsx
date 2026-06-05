import { requireRole } from "@/lib/auth-helpers";
import { listUsers } from "@/lib/queries/users";
import { createUserAction, resetPasswordAction } from "@/app/(dashboard)/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole("super_admin");
  const users = await listUsers();
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold text-kumkum">Users</h1>

      <form action={createUserAction} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-display text-xl text-kumkum sm:col-span-2">Create a user</h2>
        <div><label className="label">Full name *</label><input className="input" name="full_name" required /></div>
        <div><label className="label">Email *</label><input className="input" name="email" type="email" required /></div>
        <div><label className="label">Phone</label><input className="input" name="phone" /></div>
        <div>
          <label className="label">Role *</label>
          <select className="input" name="role" required defaultValue="temple_admin">
            <option value="temple_admin">Temple Admin</option>
            <option value="temple_manager">Temple Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Temporary password *</label><input className="input" name="password" type="text" required /></div>
        <button className="btn-primary sm:col-span-2">Create user</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sandal text-muted">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reset password</th></tr>
          </thead>
          <tbody className="divide-y divide-ink/5 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium">{u.full_name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role.replace("_", " ")}</td>
                <td className="px-4 py-2">{u.status}</td>
                <td className="px-4 py-2">
                  <form action={resetPasswordAction} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={u.id} />
                    <input className="input h-8 w-36 py-1 text-xs" name="password" type="text" placeholder="New password" required minLength={8} />
                    <button className="text-saffron hover:underline">Reset</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
