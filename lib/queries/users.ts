import { query, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { UserRow, UserRole } from "@/lib/types";

export async function listUsers(): Promise<UserRow[]> {
  return query<UserRow>`select * from users order by created_at desc`;
}

export interface NewUserInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  created_by: string;
}

export async function createUser(input: NewUserInput): Promise<UserRow> {
  const hash = await hashPassword(input.password);
  const row = await queryOne<UserRow>`
    insert into users (email, password_hash, full_name, phone, role, status, created_by)
    values (${input.email.toLowerCase()}, ${hash}, ${input.full_name}, ${input.phone ?? null},
            ${input.role}, 'active', ${input.created_by})
    returning *`;
  if (!row) throw new Error("Failed to create user");
  return row;
}

export async function listTempleAdmins(): Promise<UserRow[]> {
  return query<UserRow>`
    select * from users where role = 'temple_admin' and status = 'active' order by full_name`;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>`select * from users where email = ${email.toLowerCase()} limit 1`;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>`select * from users where id = ${id} limit 1`;
}

export async function setPassword(userId: string, plain: string): Promise<void> {
  const hash = await hashPassword(plain);
  await queryOne`update users set password_hash = ${hash} where id = ${userId}`;
}
