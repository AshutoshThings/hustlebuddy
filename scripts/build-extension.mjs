import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("extension");
const OUT = path.resolve("dist/extension");

function fail(message) {
  console.error(`build-extension: ${message}`);
  process.exit(1);
}

const raw = process.env.EXTENSION_APP_ORIGIN;
if (!raw) fail("set EXTENSION_APP_ORIGIN, e.g. https://yourdomain.com");

let url;
try {
  url = new URL(raw);
} catch {
  fail(`EXTENSION_APP_ORIGIN is not a valid URL: ${raw}`);
}
const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
if (url.protocol !== "https:" && !isLocal) {
  fail(
    "a non-local origin must use https, since the extension sends login tokens to it",
  );
}
const origin = url.origin; // drops any trailing slash or path

const version = process.env.EXTENSION_VERSION;
if (version && !/^\d+(\.\d+){0,3}$/.test(version)) {
  fail(
    `version "${version}" isn't valid for Chrome (1 to 4 dot-separated numbers, e.g. 1.2.0)`,
  );
}

if (!fs.existsSync(SRC)) fail(`${SRC} not found`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, {
  recursive: true,
  filter: (file) => !path.basename(file).startsWith("."), // skips .DS_Store, .env, etc.
});

const manifestPath = path.join(OUT, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.host_permissions = [`${origin}/*`];

// Only the app relay points at your site. The job-site script keeps its own matches.
const relay = manifest.content_scripts?.find((c) =>
  c.js?.includes("app-relay.js"),
);
if (!relay) fail("manifest.json has no content script for app-relay.js");
relay.matches = [`${origin}/*`];

if (version) manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

fs.writeFileSync(
  path.join(OUT, "config.js"),
  `const APP_ORIGIN = ${JSON.stringify(origin)};\n`,
);

console.log(
  `Built dist/extension for ${origin}${version ? ` (v${version})` : ""}`,
);
