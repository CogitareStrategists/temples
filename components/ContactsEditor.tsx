"use client";
import { useState } from "react";

type Row = { label_en: string; person_name: string; phone: string };

const SUGGESTED = ["Dharmakarta", "Executive Officer", "Chief Priest", "Archaka", "Temple Office", "Helpdesk"];

export function ContactsEditor({
  initial,
}: {
  initial: { label_en: string; person_name: string | null; phone: string }[];
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.length
      ? initial.map((c) => ({ label_en: c.label_en, person_name: c.person_name ?? "", phone: c.phone }))
      : []
  );

  function update(i: number, key: keyof Row, val: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  }
  function add() {
    setRows((r) => [...r, { label_en: "", person_name: "", phone: "" }]);
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  return (
    <div className="sm:col-span-2">
      <label className="label">Contacts (Dharmakarta, priest, temple office…)</label>
      <datalist id="contact-roles">
        {SUGGESTED.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {rows.length === 0 && <p className="mb-2 text-sm text-muted">No contacts added yet.</p>}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,1fr,auto]">
            <input
              className="input"
              list="contact-roles"
              placeholder="Role (e.g. Dharmakarta)"
              name="c_label"
              value={row.label_en}
              onChange={(e) => update(i, "label_en", e.target.value)}
            />
            <input
              className="input"
              placeholder="Name (optional)"
              name="c_name"
              value={row.person_name}
              onChange={(e) => update(i, "person_name", e.target.value)}
            />
            <input
              className="input"
              placeholder="Phone"
              name="c_phone"
              value={row.phone}
              onChange={(e) => update(i, "phone", e.target.value)}
            />
            <button type="button" className="btn-ghost" onClick={() => remove(i)} aria-label="Remove">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn-ghost mt-2" onClick={add}>
        + Add contact
      </button>
      <p className="mt-1 text-xs text-muted">These appear publicly on the temple page. Empty rows are ignored.</p>
    </div>
  );
}
