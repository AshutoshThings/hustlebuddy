// Pure-function tests: no server or database needed.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPayload,
  editPayload,
  matchesTimeFilter,
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

test("time filters use the timestamp, whatever the browser language", () => {
  const now = new Date("2026-11-16T12:00:00");
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  // The old filter parsed the display text; in Hindi that is "16 नव॰ 2026",
  // which doesn't parse, so every application passed every filter.
  assert.ok(Number.isNaN(Date.parse("16 नव॰ 2026")));
  assert.equal(matchesTimeFilter(daysAgo(3), "week", now), true);
  assert.equal(matchesTimeFilter(daysAgo(10), "week", now), false);
  assert.equal(matchesTimeFilter(daysAgo(10), "month", now), true);
  assert.equal(matchesTimeFilter(daysAgo(40), "month", now), false);
  assert.equal(matchesTimeFilter(daysAgo(400), "all", now), true);
});
