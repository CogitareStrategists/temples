"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password.");
    else router.push("/dashboard");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <h1 className="mb-4 font-display text-2xl font-semibold text-kumkum">Login</h1>
        {error && <p className="mb-3 rounded bg-kumkum/10 px-3 py-2 text-sm text-kumkum">{error}</p>}
        <label className="label">Email</label>
        <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="label">Password</label>
        <input
          className="input mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "Login"}
        </button>
      </form>
    </div>
  );
}
