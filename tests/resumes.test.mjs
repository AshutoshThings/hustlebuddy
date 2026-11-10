// Resume uploads go to Supabase Storage, so these only run when pointed at a
// real (non-production) project: set TEST_STORAGE=1 with
// NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { call, createUser, deleteUser, login, pool } from "./helpers.mjs";

const enabled = process.env.TEST_STORAGE === "1";

describe(
  "resumes",
  { skip: !enabled && "set TEST_STORAGE=1 to run storage tests" },
  () => {
    let user, jar, bucket;
    before(async () => {
      bucket = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: { persistSession: false },
        },
      ).storage.from("resumes");
      user = await createUser({ password: "Testpass#2026", tag: "resume" });
      jar = await login(user);
    });
    after(async () => {
      if (!user) return;
      const { data } = await bucket.list(String(user.id));
      if (data?.length)
        await bucket.remove(data.map((f) => `${user.id}/${f.name}`));
      await deleteUser(user.id);
    });

    const upload = (blob, name) => {
      const form = new FormData();
      form.append("file", blob, name);
      form.append("role_targeted", "Test");
      return call("/api/resumes", { method: "POST", form, jar });
    };
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
    );
    let resume;

    test("a PDF uploads and comes back with a signed URL, no storage path", async () => {
      const r = await upload(
        new Blob([pdf], { type: "application/pdf" }),
        "My Résumé (final).pdf",
      );
      assert.equal(r.status, 201, r.data?.response);
      resume = r.data.resume;
      assert.match(resume.url, /token=/);
      assert.equal("file_path" in resume, false);
      // No made-up sample data until real text extraction exists.
      assert.deepEqual(resume.extracted_keywords, []);
      assert.equal(resume.parsed_text, null);
      assert.equal((await fetch(resume.url)).status, 200);
    });

    test("the stored path is private and sanitized", async () => {
      const { rows } = await pool.query(
        "SELECT file_path FROM resumes WHERE id = $1",
        [resume.id],
      );
      const path = rows[0].file_path;
      assert.match(path, /^\d+\/[0-9a-f-]+-My_Re_sume_final_\.pdf$/);
      const pub = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${path}`,
      );
      assert.ok(pub.status >= 400, String(pub.status));
    });

    test("non-PDFs and files over 3 MB are rejected", async () => {
      assert.equal(
        (await upload(new Blob(["<script>"], { type: "text/html" }), "x.html"))
          .status,
        400,
      );
      assert.equal(
        (
          await upload(
            new Blob([Buffer.alloc(3 * 1024 * 1024 + 1)], {
              type: "application/pdf",
            }),
            "big.pdf",
          )
        ).status,
        400,
      );
    });

    test("the list returns signed URLs", async () => {
      const r = await call("/api/resumes", { jar });
      assert.equal(r.status, 200);
      assert.ok(r.data.resumes.every((x) => x.url && !("file_path" in x)));
    });

    test("delete removes the file from storage", async () => {
      assert.equal(
        (await call(`/api/resumes/${resume.id}`, { method: "DELETE", jar }))
          .status,
        200,
      );
      const { data } = await bucket.list(String(user.id));
      assert.equal((data || []).length, 0);
    });
  },
);
