import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(
  process.env.DOWNLOAD_TEST_PROJECT || join(scriptDirectory, ".."),
);
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.DOWNLOAD_TEST_JSDOM_PATH || "jsdom");
const scratch = await mkdtemp(join(scriptDirectory, ".checksum-identity-"));
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://www.ivorysql.org/resources/download",
  pretendToBeVisual: true,
});
const originalGlobals = new Map();
for (const name of [
  "window",
  "self",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "Event",
]) {
  originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
originalGlobals.set(
  "IS_REACT_ACT_ENVIRONMENT",
  Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const writes = [];
let writeOutcome = () => Promise.resolve();
// JSDOM has no OS clipboard. Observe the real component's browser API request
// and control its completion only; no component, hook or product method is replaced.
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText(value) {
      writes.push(value);
      return writeOutcome(value);
    },
  },
});

const modules = [
  [
    "DatabaseDownload",
    process.env.DOWNLOAD_COMPONENT_PATH ||
      join(
        projectDirectory,
        "src/app/[locale]/resources/download/DatabaseDownload.tsx",
      ),
  ],
  [
    "CopyButton",
    join(
      projectDirectory,
      "src/app/[locale]/resources/download/CopyButton.tsx",
    ),
  ],
  ["db-packages", join(projectDirectory, "src/lib/db-packages.ts")],
  ["db-releases", join(projectDirectory, "src/lib/db-releases.ts")],
  ["utils", join(projectDirectory, "src/lib/utils.ts")],
];
for (const [name, path] of modules) {
  const source = await readFile(path, "utf8");
  let emitted = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  for (const [from, to] of [
    ['"@/lib/db-packages"', '"./db-packages.mjs"'],
    ['"@/lib/utils"', '"./utils.mjs"'],
    ['"./CopyButton"', '"./CopyButton.mjs"'],
    ['"./db-packages"', '"./db-packages.mjs"'],
    [
      'import rawSnapshot from "./db-releases.snapshot.json";',
      'import rawSnapshot from "./db-releases.snapshot.json" with { type: "json" };',
    ],
  ]) {
    emitted = emitted.replaceAll(from, to);
  }
  await writeFile(join(scratch, name + ".mjs"), emitted);
}
await writeFile(
  join(scratch, "db-releases.snapshot.json"),
  await readFile(join(projectDirectory, "src/lib/db-releases.snapshot.json")),
);

const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { NextIntlClientProvider } = await import("next-intl");
const { DatabaseDownload } = await import(
  pathToFileURL(join(scratch, "DatabaseDownload.mjs")).href
);
const { DB_ARCH_LABELS } = await import(
  pathToFileURL(join(scratch, "db-packages.mjs")).href
);
const { getDbReleases } = await import(
  pathToFileURL(join(scratch, "db-releases.mjs")).href
);

// Enter the real documented offline producer path. No fake release response,
// hand-built DbRelease objects, private-transform export, or copied parsing logic.
const originalFetch = globalThis.fetch;
const networkRequests = [];
let releases;
try {
  globalThis.fetch = async (url) => {
    networkRequests.push(String(url));
    throw new TypeError("Offline boundary for committed release snapshot");
  };
  releases = await getDbReleases();
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(networkRequests, [
  "https://api.github.com/repos/IvorySQL/IvorySQL/releases?per_page=100",
]);
assert.ok(releases.length > 0, "actual snapshot producer must supply releases");

after(async () => {
  // Let existing product feedback timers finish after all roots unmount.
  // This is bounded real time, not a fake clock or a timing assertion.
  await new Promise((resolveTimer) => setTimeout(resolveTimer, 2100));
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    delete navigator.clipboard;
  }
  dom.window.close();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  await rm(scratch, { recursive: true, force: true });
});

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolveValue, rejectValue) => {
    resolvePromise = resolveValue;
    rejectPromise = rejectValue;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

async function withDownload(locale, assertions) {
  const messages = JSON.parse(
    await readFile(
      join(projectDirectory, "messages", locale + ".json"),
      "utf8",
    ),
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  writes.length = 0;
  writeOutcome = () => Promise.resolve();
  try {
    await act(async () => {
      root.render(
        React.createElement(
          NextIntlClientProvider,
          {
            locale,
            timeZone: "UTC",
            messages,
          },
          React.createElement(DatabaseDownload, { releases }),
        ),
      );
    });
    const copyButton = () => {
      const button = container.querySelector("button[title]");
      assert.ok(button, "real selected-package CopyButton must be rendered");
      return button;
    };
    const displayedMd5 = () => {
      const code = container.querySelector("code");
      assert.ok(code, "real selected package must have an MD5");
      return code.textContent;
    };
    const currentPackage = () => {
      const url = container.querySelector(
        'a[href*="/releases/download/"]',
      )?.href;
      const item = releases
        .flatMap((release) => release.packages)
        .find((candidate) => candidate.url === url);
      assert.ok(
        item,
        "download href must belong to the actual snapshot producer",
      );
      assert.equal(displayedMd5(), item.md5);
      return item;
    };
    const clickArch = async (arch) => {
      const button = [...container.querySelectorAll("button")].find(
        (item) => item.textContent === DB_ARCH_LABELS[arch],
      );
      assert.ok(button, "architecture must come from the actual release");
      await act(async () => button.click());
      assert.equal(button.getAttribute("aria-pressed"), "true");
    };
    const copy = async () => {
      await act(async () => copyButton().click());
    };
    const assertIdle = () => {
      assert.ok(
        copyButton().querySelector(".lucide-clipboard-copy"),
        "new MD5 must not inherit another checksum's feedback",
      );
      assert.equal(
        copyButton().getAttribute("aria-label"),
        messages.DownloadUI.copyChecksum,
      );
    };
    const assertCopied = () => {
      assert.ok(copyButton().querySelector(".lucide-check"));
    };
    await assertions({
      copyButton,
      displayedMd5,
      currentPackage,
      clickArch,
      copy,
      assertIdle,
      assertCopied,
    });
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

test("completed copy feedback belongs to the original architecture checksum", async () => {
  await withDownload("en", async (view) => {
    const original = view.currentPackage();
    await view.copy();
    view.assertCopied();
    assert.deepEqual(writes, [original.md5]);
    await view.clickArch("arm64");
    const next = view.currentPackage();
    assert.notEqual(next.md5, original.md5, "use distinct actual checksums");
    assert.deepEqual(
      writes,
      [original.md5],
      "selection never copies implicitly",
    );
    view.assertIdle();
  });
});

test("late clipboard success cannot mark the new architecture checksum copied", async () => {
  await withDownload("en", async (view) => {
    const pending = deferred();
    writeOutcome = () => pending.promise;
    const original = view.currentPackage();
    await view.copy();
    await view.clickArch("arm64");
    assert.notEqual(view.currentPackage().md5, original.md5);
    await act(async () => pending.resolve());
    assert.deepEqual(writes, [original.md5]);
    view.assertIdle();
  });
});

test("late clipboard rejection cannot label the new Chinese selection failed", async () => {
  await withDownload("zh", async (view) => {
    const pending = deferred();
    writeOutcome = () => pending.promise;
    const original = view.currentPackage();
    await view.copy();
    await view.clickArch("arm64");
    assert.notEqual(view.currentPackage().md5, original.md5);
    await act(async () =>
      pending.reject(new Error("Old clipboard write failed")),
    );
    assert.deepEqual(writes, [original.md5]);
    view.assertIdle();
  });
});

test("copying the newly selected real checksum still uses its exact value", async () => {
  await withDownload("en", async (view) => {
    await view.clickArch("arm64");
    view.assertIdle();
    const selected = view.currentPackage();
    await view.copy();
    assert.deepEqual(writes, [selected.md5]);
    view.assertCopied();
  });
});

test("reselecting the same checksum preserves its completed feedback", async () => {
  await withDownload("en", async (view) => {
    const original = view.currentPackage();
    await view.copy();
    view.assertCopied();
    const sameButton = view.copyButton();
    await view.clickArch(original.arch);
    assert.equal(view.copyButton(), sameButton);
    view.assertCopied();
    assert.deepEqual(writes, [original.md5]);
  });
});
