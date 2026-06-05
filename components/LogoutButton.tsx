"use client";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost w-full justify-start">
      Logout
    </button>
  );
}
