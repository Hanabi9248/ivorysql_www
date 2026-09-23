import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Run the public loader with controlled GitHub responses. Compile the actual
// modules so these tests use the same selection path as the download page.
function loadModule(name, dependencies, globals = {}) {
  const source = readFileSync(
    new URL(`../src/lib/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (key) => dependencies[key],
    console,
    AbortSignal,
    process: { env: {} },
    ...globals,
  });
  return exports;
}

async function selectedPackage(names) {
  const assets = names.map((name, index) => ({
    name,
    size: 100 + index,
    browser_download_url: `https://example.invalid/${name}`,
  }));
  const releases = [
    {
      tag_name: "IvorySQL_5.4",
      draft: false,
      prerelease: false,
      published_at: "2026-06-16T00:00:00Z",
      assets,
    },
  ];
  const { getDbReleases } = loadModule(
    "db-releases",
    {
      "./db-packages": loadModule("db-packages", {}),
      "./db-releases.snapshot.json": {
        default: { releases: [], md5s: {} },
      },
    },
    { fetch: async () => ({ ok: true, json: async () => releases }) },
  );
  const result = await getDbReleases();
  assert.equal(result.length, 1);
  assert.equal(result[0].packages.length, 1);
  return result[0].packages[0];
}

for (const suffix of ["x86_64.rpm", "aarch64.rpm", "arm64.deb"]) {
  for (const reversed of [false, true]) {
    test(`newest build wins over git hash: ${suffix}, reversed=${reversed}`, async () => {
      const older = `IvorySQL-5.4-fffffff-20260615.${suffix}`;
      const newer = `IvorySQL-5.4-0000000-20260616.${suffix}`;
      const names = reversed ? [newer, older] : [older, newer];
      const selected = await selectedPackage(names);
      assert.equal(selected.filename, newer);
      assert.equal(selected.url, `https://example.invalid/${newer}`);
      assert.equal(selected.size, 100 + names.indexOf(newer));
    });
  }
}

test("same-day builds retain the deterministic filename tie-break", async () => {
  const smaller = "IvorySQL-5.4-0000000-20260616.x86_64.rpm";
  const greater = "IvorySQL-5.4-fffffff-20260616.x86_64.rpm";
  for (const names of [
    [smaller, greater],
    [greater, smaller],
  ]) {
    assert.equal((await selectedPackage(names)).filename, greater);
  }
});

test("unversioned filenames retain the existing comparison", async () => {
  const smaller = "IvorySQL-a.x86_64.rpm";
  const greater = "IvorySQL-z.x86_64.rpm";
  for (const names of [
    [smaller, greater],
    [greater, smaller],
  ]) {
    assert.equal((await selectedPackage(names)).filename, greater);
  }
});
