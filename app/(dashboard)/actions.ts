"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireRole } from "@/lib/auth-helpers";
import { slugify, withSuffix } from "@/lib/slug";
import {
  createTemple,
  getTempleById,
  approveTemple,
  writeVersion,
  isEditingLocked,
} from "@/lib/queries/temples";
import {
  updateTemple,
  setCategories,
  setSecondaryDeities,
  setSignificances,
  setFacilities,
  setContacts,
  setTempleAdmins,
  isTempleAdmin,
  addTempleAdmin,
  addEvent,
  toggleEventPublic,
  deleteEvent,
  addVideo,
  toggleVideoPublic,
  deleteVideo,
  addTiming,
  deleteTiming,
  rejectTemple,
  type TempleUpdate,
} from "@/lib/queries/temple-admin";
import { createUser, findUserByEmail, getUserById, setPassword } from "@/lib/queries/users";
import { verifyPassword } from "@/lib/password";
import { createTempleAdminRequest, getAdminRequest, markAdminRequest } from "@/lib/queries/admin-requests";
import { recordManualPayment } from "@/lib/queries/subscriptions";
import { addFeatured, removeFeatured } from "@/lib/queries/home";
import { addArea, removeArea } from "@/lib/queries/areas";
import { addFacility, removeFacility } from "@/lib/queries/facilities";
import { addDeity, setDeityImage } from "@/lib/queries/lists";
import { createSuggestion, approveSuggestion, rejectSuggestion } from "@/lib/queries/suggestions";
import type { UserRole, SuggestionScope, SuggestionTarget, HomeSection } from "@/lib/types";

function s(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const str = typeof v === "string" ? v.trim() : "";
  return str === "" ? null : str;
}
function req(fd: FormData, k: string): string {
  const v = s(fd, k);
  if (!v) throw new Error(`Missing field: ${k}`);
  return v;
}

// ---------- Temples ----------
async function guardTempleEdit(templeId: string) {
  const user = await requireUser();
  const temple = await getTempleById(templeId);
  if (!temple) throw new Error("Temple not found");
  if (user.role === "temple_admin") {
    if (!(await isTempleAdmin(temple.id, user.id))) throw new Error("You are not assigned to this temple.");
    if (isEditingLocked(temple)) throw new Error("Editing is locked until the subscription is renewed.");
  }
  return { user, temple };
}

export async function createTempleAction(fd: FormData) {
  const user = await requireRole("super_admin", "temple_manager");
  const name_en = req(fd, "name_en");
  const temple = await createTemple({
    slug: withSuffix(slugify(name_en)),
    name_en,
    name_te: s(fd, "name_te"),
    primary_deity_id: s(fd, "primary_deity_id"),
    area_id: s(fd, "area_id"),
    district: s(fd, "district"),
    state: s(fd, "state") ?? "Telangana",
    primary_photo_url: s(fd, "primary_photo_url"),
    created_by: user.id,
  });
  await setSignificances(temple.id, fd.getAll("significance_ids").map(String));
  await setFacilities(temple.id, fd.getAll("facility_ids").map(String));
  revalidatePath("/dashboard/temples");
  redirect(`/dashboard/temples/${temple.id}/edit`);
}

export async function saveTempleAction(fd: FormData) {
  const id = req(fd, "id");
  const { user } = await guardTempleEdit(id);
  const update: TempleUpdate = {
    name_en: req(fd, "name_en"),
    name_te: s(fd, "name_te"),
    primary_deity_id: s(fd, "primary_deity_id"),
    area_id: s(fd, "area_id"),
    description_en: s(fd, "description_en"),
    description_te: s(fd, "description_te"),
    address_line_en: s(fd, "address_line_en"),
    address_line_te: s(fd, "address_line_te"),
    city: s(fd, "city"),
    district: s(fd, "district"),
    state: s(fd, "state") ?? "Telangana",
    pincode: s(fd, "pincode"),
    latitude: s(fd, "latitude"),
    longitude: s(fd, "longitude"),
    contact_phone: s(fd, "contact_phone"),
    contact_email: s(fd, "contact_email"),
    donation_upi_vpa: s(fd, "donation_upi_vpa"),
    donation_upi_name: s(fd, "donation_upi_name"),
    donation_qr_url: s(fd, "donation_qr_url"),
    primary_photo_url: s(fd, "primary_photo_url"),
  };
  await updateTemple(id, update);
  if (user.role === "super_admin") await setTempleAdmins(id, fd.getAll("temple_admin_ids").map(String));
  await setCategories(id, fd.getAll("category_ids").map(String));
  await setSecondaryDeities(id, fd.getAll("secondary_deity_ids").map(String));
  await setSignificances(id, fd.getAll("significance_ids").map(String));
  await setFacilities(id, fd.getAll("facility_ids").map(String));
  // Flexible labeled contacts (Dharmakarta, priest, office, ...)
  {
    const labels = fd.getAll("c_label").map(String);
    const names = fd.getAll("c_name").map(String);
    const phones = fd.getAll("c_phone").map(String);
    const contacts = labels
      .map((label_en, i) => ({
        label_en: label_en.trim(),
        label_te: null as string | null,
        person_name: (names[i] ?? "").trim() || null,
        phone: (phones[i] ?? "").trim(),
      }))
      .filter((c) => c.label_en && c.phone);
    await setContacts(id, contacts);
  }
  // Live edits append a snapshot to the version history (no approval needed).
  await writeVersion(id, "edit", user.id, false, false);
  revalidatePath(`/dashboard/temples/${id}/edit`);
}

// ---------- Events / Videos / Timings ----------
export async function addEventAction(fd: FormData) {
  const templeId = req(fd, "temple_id");
  const { user } = await guardTempleEdit(templeId);
  await addEvent(
    templeId,
    {
      title_en: req(fd, "title_en"),
      title_te: s(fd, "title_te"),
      description_en: s(fd, "description_en"),
      description_te: s(fd, "description_te"),
      starts_at: s(fd, "starts_at"),
      is_public: fd.get("is_public") === "on",
    },
    user.id
  );
  revalidatePath(`/dashboard/temples/${templeId}/edit`);
}
export async function toggleEventPublicAction(fd: FormData) {
  await guardTempleEdit(req(fd, "temple_id"));
  await toggleEventPublic(req(fd, "id"));
  revalidatePath(`/dashboard/temples/${req(fd, "temple_id")}/edit`);
}
export async function deleteEventAction(fd: FormData) {
  await guardTempleEdit(req(fd, "temple_id"));
  await deleteEvent(req(fd, "id"));
  revalidatePath(`/dashboard/temples/${req(fd, "temple_id")}/edit`);
}

export async function addVideoAction(fd: FormData) {
  const templeId = req(fd, "temple_id");
  const { user } = await guardTempleEdit(templeId);
  await addVideo(
    templeId,
    {
      title_en: req(fd, "title_en"),
      title_te: s(fd, "title_te"),
      video_url: req(fd, "video_url"),
      is_public: fd.get("is_public") === "on",
    },
    user.id
  );
  revalidatePath(`/dashboard/temples/${templeId}/edit`);
}
export async function toggleVideoPublicAction(fd: FormData) {
  await guardTempleEdit(req(fd, "temple_id"));
  await toggleVideoPublic(req(fd, "id"));
  revalidatePath(`/dashboard/temples/${req(fd, "temple_id")}/edit`);
}
export async function deleteVideoAction(fd: FormData) {
  await guardTempleEdit(req(fd, "temple_id"));
  await deleteVideo(req(fd, "id"));
  revalidatePath(`/dashboard/temples/${req(fd, "temple_id")}/edit`);
}

export async function addTimingAction(fd: FormData) {
  const templeId = req(fd, "temple_id");
  await guardTempleEdit(templeId);
  await addTiming(templeId, {
    day_of_week: Number(req(fd, "day_of_week")),
    session_order: Number(s(fd, "session_order") ?? "1"),
    session_label_en: s(fd, "session_label_en"),
    open_time: req(fd, "open_time"),
    close_time: req(fd, "close_time"),
  });
  revalidatePath(`/dashboard/temples/${templeId}/edit`);
}
export async function deleteTimingAction(fd: FormData) {
  await guardTempleEdit(req(fd, "temple_id"));
  await deleteTiming(req(fd, "id"));
  revalidatePath(`/dashboard/temples/${req(fd, "temple_id")}/edit`);
}

// ---------- Super Admin: users & approvals ----------
export async function createUserAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await createUser({
    email: req(fd, "email"),
    password: req(fd, "password"),
    full_name: req(fd, "full_name"),
    phone: s(fd, "phone"),
    role: req(fd, "role") as UserRole,
    created_by: admin.id,
  });
  revalidatePath("/dashboard/users");
}

export async function approveTempleAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await approveTemple(req(fd, "id"), admin.id);
  revalidatePath("/dashboard/approvals");
}
export async function rejectTempleAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await rejectTemple(req(fd, "id"), admin.id);
  revalidatePath("/dashboard/approvals");
}

// ---------- Suggestions ----------
export async function createSuggestionAction(fd: FormData) {
  const user = await requireRole("super_admin", "temple_manager", "temple_admin");
  const target = req(fd, "target") as SuggestionTarget;
  const district = s(fd, "district");
  await createSuggestion({
    suggested_by: user.id,
    scope: (s(fd, "scope") as SuggestionScope) ?? "global",
    temple_id: s(fd, "temple_id"),
    target,
    label_en: s(fd, "label_en"),
    label_te: s(fd, "label_te"),
    payload: target === "area" && district ? { district } : null,
    rationale: s(fd, "rationale"),
  });
  revalidatePath("/dashboard/suggestions");
}
export async function approveSuggestionAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await approveSuggestion(req(fd, "id"), admin.id, s(fd, "note") ?? undefined);
  revalidatePath("/dashboard/suggestions");
}
export async function rejectSuggestionAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await rejectSuggestion(req(fd, "id"), admin.id, s(fd, "note") ?? undefined);
  revalidatePath("/dashboard/suggestions");
}

// ---------- Super Admin: home page curation ----------
export async function addHomeFeaturedAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await addFeatured(req(fd, "section") as HomeSection, req(fd, "temple_id"), admin.id);
  revalidatePath("/dashboard/home");
  revalidatePath("/");
}
export async function removeHomeFeaturedAction(fd: FormData) {
  await requireRole("super_admin");
  await removeFeatured(req(fd, "id"));
  revalidatePath("/dashboard/home");
  revalidatePath("/");
}

// ---------- Super Admin: areas (second-level location) ----------
export async function addAreaAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await addArea(req(fd, "district"), req(fd, "name_en"), s(fd, "name_te"), admin.id);
  revalidatePath("/dashboard/areas");
}
export async function removeAreaAction(fd: FormData) {
  await requireRole("super_admin");
  await removeArea(req(fd, "id"));
  revalidatePath("/dashboard/areas");
}

// ---------- Super Admin: facilities ----------
export async function addFacilityAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await addFacility(req(fd, "label_en"), s(fd, "label_te"), admin.id);
  revalidatePath("/dashboard/facilities");
}
export async function removeFacilityAction(fd: FormData) {
  await requireRole("super_admin");
  await removeFacility(req(fd, "id"));
  revalidatePath("/dashboard/facilities");
}

// ---------- Super Admin: deities (and their images) ----------
export async function addDeityAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await addDeity(req(fd, "label_en"), s(fd, "label_te"), admin.id);
  revalidatePath("/dashboard/deities");
}
export async function setDeityImageAction(fd: FormData) {
  await requireRole("super_admin");
  await setDeityImage(req(fd, "id"), s(fd, "image_url"));
  revalidatePath("/dashboard/deities");
  revalidatePath("/");
}

// ---------- Temple admins: manager proposes, super admin approves ----------
export async function proposeTempleAdminAction(fd: FormData) {
  const user = await requireRole("temple_manager", "super_admin");
  const templeId = req(fd, "temple_id");
  await createTempleAdminRequest(
    templeId,
    { full_name: req(fd, "full_name"), email: req(fd, "email"), phone: s(fd, "phone") },
    user.id
  );
  revalidatePath(`/dashboard/temples/${templeId}/edit`);
  revalidatePath("/dashboard/approvals");
}

export async function approveTempleAdminRequestAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  const reqId = req(fd, "id");
  const request = await getAdminRequest(reqId);
  if (!request || request.status !== "pending") return;
  const password = s(fd, "password");
  const existing = await findUserByEmail(request.email);
  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    if (!password) throw new Error("Set a password for the new admin account.");
    const created = await createUser({
      email: request.email,
      password,
      full_name: request.full_name,
      phone: request.phone,
      role: "temple_admin",
      created_by: admin.id,
    });
    userId = created.id;
  }
  await addTempleAdmin(request.temple_id, userId);
  await markAdminRequest(reqId, "approved", admin.id);
  revalidatePath("/dashboard/approvals");
  revalidatePath(`/dashboard/temples/${request.temple_id}/edit`);
}

export async function rejectTempleAdminRequestAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  await markAdminRequest(req(fd, "id"), "rejected", admin.id);
  revalidatePath("/dashboard/approvals");
}

// ---------- Self-service: change own password (all roles) ----------
type PwState = { error?: string; success?: boolean };
export async function changePasswordAction(_prev: PwState, fd: FormData): Promise<PwState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("new") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New password and confirmation do not match." };
  const dbUser = await getUserById(user.id);
  if (!dbUser) return { error: "Account not found." };
  if (!(await verifyPassword(current, dbUser.password_hash))) {
    return { error: "Your current password is incorrect." };
  }
  await setPassword(user.id, next);
  return { success: true };
}

// ---------- Super Admin: reset another user's password ----------
export async function resetPasswordAction(fd: FormData) {
  await requireRole("super_admin");
  const userId = req(fd, "user_id");
  const password = req(fd, "password");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  await setPassword(userId, password);
  revalidatePath("/dashboard/users");
}

// ---------- Super Admin: record an offline / manual payment ----------
export async function recordOfflinePaymentAction(fd: FormData) {
  const admin = await requireRole("super_admin");
  const templeId = req(fd, "temple_id");
  const planId = req(fd, "plan_id");
  const method = req(fd, "method");
  const amtRaw = s(fd, "amount");
  const amount = amtRaw ? Number(amtRaw) : null;
  const paidAt = s(fd, "paid_at");
  await recordManualPayment(templeId, planId, amount, method, paidAt, admin.id);
  revalidatePath(`/dashboard/temples/${templeId}/edit`);
  revalidatePath("/dashboard/payments");
}
