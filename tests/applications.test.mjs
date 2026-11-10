import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { call, createUser, deleteUser, login, pool } from "./helpers.mjs";

describe("applications", () => {
  let user, jar, other;
  before(async () => {
    user = await createUser({ password: "Testpass#2026", tag: "apps" });
    jar = await login(user);
  });
  after(async () => {
    await deleteUser(user?.id);
    await deleteUser(other?.id);
  });

  const add = (body, j = jar) =>
    call("/api/applications", { method: "POST", jar: j, body });
  const patch = (id, body, j = jar) =>
    call(`/api/applications/${id}`, { method: "PATCH", jar: j, body });

  test("requires a session", async () => {
    assert.equal((await call("/api/applications")).status, 401);
  });

  test("creates an application with whitespace trimmed", async () => {
    const r = await add({
      company: "  Acme Corp ",
      role: " Engineer ",
      status: "applied",
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.application.company, "Acme Corp");
    assert.equal(r.data.application.role, "Engineer");
  });

  test("rejects over-long fields with a message naming the field", async () => {
    let r = await add({
      company: "x".repeat(201),
      role: "Dev",
      status: "applied",
    });
    assert.equal(r.status, 400);
    assert.match(r.data.response, /^company:/);
    r = await add({
      company: "Ok",
      role: "Dev",
      status: "applied",
      notes: "n".repeat(5001),
    });
    assert.equal(r.status, 400);
    assert.match(r.data.response, /^notes:/);
  });

  test("rejects an unknown status", async () => {
    const r = await add({ company: "Ok", role: "Dev", status: "ghosted" });
    assert.equal(r.status, 400);
  });

  test("the same company and role in another case is a duplicate", async () => {
    const r = await add({
      company: "ACME CORP",
      role: "engineer",
      status: "applied",
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.duplicate, true);
  });

  test("10 identical saves at once create exactly 1 row and no errors", async () => {
    const all = await Promise.all(
      Array.from({ length: 10 }, () =>
        add({ company: "Globex", role: "SRE", status: "applied" }),
      ),
    );
    assert.equal(all.filter((x) => x.status === 201).length, 1);
    assert.equal(all.filter((x) => x.status >= 500).length, 0);
    const { rows } = await pool.query(
      "SELECT count(*)::int n FROM applications WHERE user_id = $1 AND lower(company) = 'globex' AND deleted_at IS NULL",
      [user.id],
    );
    assert.equal(rows[0].n, 1);
  });

  test("editing works, renaming into an existing application is a 409", async () => {
    const list = await call("/api/applications", { jar });
    const globex = list.data.applications.find((a) => a.company === "Globex");
    let r = await patch(globex.id, { status: "interviewing" });
    assert.equal(r.status, 200);
    r = await patch(globex.id, { company: "acme corp", role: "ENGINEER" });
    assert.equal(r.status, 409);
    r = await patch(globex.id, { role: "y".repeat(201) });
    assert.equal(r.status, 400);
    assert.match(r.data.response, /^role:/);
  });

  test("after deleting, the same application can be added again", async () => {
    const list = await call("/api/applications", { jar });
    const acme = list.data.applications.find((a) => a.company === "Acme Corp");
    assert.equal(
      (await call(`/api/applications/${acme.id}`, { method: "DELETE", jar }))
        .status,
      200,
    );
    const r = await add({
      company: "Acme Corp",
      role: "Engineer",
      status: "applied",
    });
    assert.equal(r.status, 201);
  });

  test("another user can't see, edit or delete these applications", async () => {
    other = await createUser({ password: "Testpass#2026", tag: "apps-other" });
    const otherJar = await login(other);
    const mine = (await call("/api/applications", { jar })).data.applications;
    const theirs = (await call("/api/applications", { jar: otherJar })).data
      .applications;
    assert.ok(mine.length > 0);
    assert.equal(theirs.length, 0);
    const target = mine[0];
    const p = await patch(target.id, { status: "rejected" }, otherJar);
    assert.ok([403, 404].includes(p.status), String(p.status));
    const d = await call(`/api/applications/${target.id}`, {
      method: "DELETE",
      jar: otherJar,
    });
    assert.ok([403, 404].includes(d.status), String(d.status));
    const { rows } = await pool.query(
      "SELECT status, deleted_at FROM applications WHERE id = $1",
      [target.id],
    );
    assert.notEqual(rows[0].status, "rejected");
    assert.equal(rows[0].deleted_at, null);
  });

  test("deleting the user removes their applications and sessions", async () => {
    const temp = await createUser({
      password: "Testpass#2026",
      tag: "cascade",
    });
    const tj = await login(temp);
    await add({ company: "Temp", role: "Temp", status: "applied" }, tj);
    await deleteUser(temp.id);
    const { rows } = await pool.query(
      "SELECT (SELECT count(*) FROM applications WHERE user_id = $1)::int + (SELECT count(*) FROM refresh_tokens WHERE user_id = $1)::int AS n",
      [temp.id],
    );
    assert.equal(rows[0].n, 0);
  });
});

describe("linking a resume to an application", () => {
  let user, jar, other, mine, theirs;
  before(async () => {
    user = await createUser({ password: "Testpass#2026", tag: "link" });
    other = await createUser({ password: "Testpass#2026", tag: "link-other" });
    jar = await login(user);
    // Rows only: linking doesn't touch storage.
    const add = (id) =>
      pool
        .query(
          "INSERT INTO resumes (user_id, file_name, file_path) VALUES ($1, 'cv.pdf', $2) RETURNING id",
          [id, `${id}/cv.pdf`],
        )
        .then((r) => r.rows[0].id);
    mine = await add(user.id);
    theirs = await add(other.id);
  });
  after(async () => {
    await deleteUser(user?.id);
    await deleteUser(other?.id);
  });

  test("an application can be created with, and switched to, the user's resume", async () => {
    const r = await call("/api/applications", {
      method: "POST",
      jar,
      body: {
        company: "Linked",
        role: "Dev",
        status: "applied",
        resume_id: mine,
      },
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.application.resume_id, mine);
    const id = r.data.application.id;
    const unlink = await call(`/api/applications/${id}`, {
      method: "PATCH",
      jar,
      body: { resume_id: null },
    });
    assert.equal(unlink.status, 200);
    assert.equal(unlink.data.application.resume_id, null);
  });

  test("another user's resume can't be linked", async () => {
    let r = await call("/api/applications", {
      method: "POST",
      jar,
      body: {
        company: "Sneaky",
        role: "Dev",
        status: "applied",
        resume_id: theirs,
      },
    });
    assert.equal(r.status, 400);
    assert.match(r.data.response, /^resume_id:/);
    const list = (await call("/api/applications", { jar })).data.applications;
    r = await call(`/api/applications/${list[0].id}`, {
      method: "PATCH",
      jar,
      body: { resume_id: theirs },
    });
    assert.equal(r.status, 400);
  });

  test("resume_id must be a positive whole number", async () => {
    const r = await call("/api/applications", {
      method: "POST",
      jar,
      body: { company: "Bad", role: "Dev", status: "applied", resume_id: "1" },
    });
    assert.equal(r.status, 400);
  });
});
