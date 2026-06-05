import { query, queryOne } from "@/lib/db";
import type { FieldSuggestionRow, SuggestionScope, SuggestionTarget } from "@/lib/types";
import { addDeity } from "@/lib/queries/lists";
import { addArea } from "@/lib/queries/areas";

export async function listSuggestions(status?: string): Promise<FieldSuggestionRow[]> {
  if (status) {
    return query<FieldSuggestionRow>`select * from field_suggestions where status = ${status} order by created_at desc`;
  }
  return query<FieldSuggestionRow>`select * from field_suggestions order by created_at desc`;
}

export interface NewSuggestionInput {
  suggested_by: string;
  scope: SuggestionScope;
  temple_id?: string | null;
  target: SuggestionTarget;
  label_en?: string | null;
  label_te?: string | null;
  payload?: Record<string, unknown> | null;
  rationale?: string | null;
}

export async function createSuggestion(input: NewSuggestionInput): Promise<FieldSuggestionRow> {
  const row = await queryOne<FieldSuggestionRow>`
    insert into field_suggestions (suggested_by, scope, temple_id, target, label_en, label_te, payload, rationale)
    values (${input.suggested_by}, ${input.scope}, ${input.temple_id ?? null}, ${input.target},
            ${input.label_en ?? null}, ${input.label_te ?? null},
            ${input.payload ? JSON.stringify(input.payload) : null}::jsonb, ${input.rationale ?? null})
    returning *`;
  if (!row) throw new Error("Failed to create suggestion");
  return row;
}

/** Approve a suggestion. For deity/area 'add' suggestions, apply the change. */
export async function approveSuggestion(id: string, reviewerId: string, note?: string): Promise<void> {
  const s = await queryOne<FieldSuggestionRow>`select * from field_suggestions where id = ${id} limit 1`;
  if (!s) throw new Error("Suggestion not found");
  if (s.target === "deity" && s.scope === "global" && s.label_en) {
    await addDeity(s.label_en, s.label_te ?? null, reviewerId);
  }
  if (s.target === "area" && s.label_en) {
    const district = (s.payload?.district as string | undefined) ?? null;
    if (district) await addArea(district, s.label_en, s.label_te ?? null, reviewerId);
  }
  // (category adds and field_modifications can be applied here as the model grows)
  await queryOne`
    update field_suggestions
    set status = 'approved', reviewed_by = ${reviewerId}, reviewed_at = now(), review_note = ${note ?? null}
    where id = ${id}`;
}

export async function rejectSuggestion(id: string, reviewerId: string, note?: string): Promise<void> {
  await queryOne`
    update field_suggestions
    set status = 'rejected', reviewed_by = ${reviewerId}, reviewed_at = now(), review_note = ${note ?? null}
    where id = ${id}`;
}
