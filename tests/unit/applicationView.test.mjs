// Pure-function tests: no server or database needed.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPayload,
  editPayload,
  toApplication,
} from "../../app/lib/applicationView.ts";

const row = {
  id: 7,
  company: "Acme",
  role: "Backend Intern",
  status: "applied",
  source: "LinkedIn",
  notes: "Referred by Priya",
  applied_at: "2026-11-10T09:30:00.000Z",
};
const app = toApplication(row);
const formOf = (a) => ({
  company: a.company,
  role: a.role,
  status: a.status,
  source: a.source ?? "",
  notes: a.notes ?? "",
});

test("toApplication keeps source, notes and the raw timestamp", () => {
  assert.equal(app.id, "7");
  assert.equal(app.source, "LinkedIn");
  assert.equal(app.notes, "Referred by Priya");
  assert.equal(app.appliedAt, "2026-11-10T09:30:00.000Z");
  assert.ok(app.date.length > 0);
});

test("editing only the status sends only the status", () => {
  const payload = editPayload(app, { ...formOf(app), status: "interviewing" });
  assert.deepEqual(payload, { status: "interviewing" });
});

test("an untouched form sends nothing", () => {
  assert.deepEqual(editPayload(app, formOf(app)), {});
});

test("clearing a field sends it empty on purpose", () => {
  assert.deepEqual(editPayload(app, { ...formOf(app), source: "  " }), {
    source: "",
  });
});

test("rows without source or notes edit cleanly", () => {
  const bare = toApplication({ ...row, source: null, notes: null });
  assert.deepEqual(editPayload(bare, { ...formOf(bare), notes: "Call HR" }), {
    notes: "Call HR",
  });
});

test("create leaves blank optional fields out and trims", () => {
  assert.deepEqual(
    createPayload({
      company: " Acme ",
      role: "Dev",
      status: "applied",
      source: "",
      notes: "",
    }),
    { company: "Acme", role: "Dev", status: "applied" },
  );
});
