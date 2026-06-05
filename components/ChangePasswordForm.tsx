"use client";
import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "@/app/(dashboard)/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Change password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(changePasswordAction, {} as { error?: string; success?: boolean });
  return (
    <form action={action} className="card max-w-md space-y-3 p-6" key={state?.success ? "done" : "form"}>
      <div>
        <label className="label">Current password</label>
        <input className="input" type="password" name="current" required autoComplete="current-password" />
      </div>
      <div>
        <label className="label">New password (min 8 characters)</label>
        <input className="input" type="password" name="new" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input className="input" type="password" name="confirm" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-sm text-kumkum">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">✓ Password changed. Use it next time you sign in.</p>}
      <Submit />
    </form>
  );
}
