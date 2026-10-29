import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { dirname, join, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptsDirectory, "..");
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.PARTNER_TEST_JSDOM_PATH || "jsdom");
const scratch = await mkdtemp(join(scriptsDirectory, ".partner-scroll-"));
const originalDirectory = process.cwd();
process.chdir(projectDirectory);

// Resolve Next's actual CJS export for direct ESM execution; never substitute
// an image component. This is the same bundler interop boundary as the site.
await writeFile(
  join(scratch, "next-image.mjs"),
  'import {createRequire} from "node:module";\n' +
    "const value = createRequire(" +
    JSON.stringify(import.meta.url) +
    ')("next/image");\nexport default value.default ?? value;\n',
);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.conditions.includes("import") &&
      /^next\/image(\.js)?$/.test(specifier)
    ) {
      return {
        url: pathToFileURL(join(scratch, "next-image.mjs")).href,
        shortCircuit: true,
      };
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("next/") &&
        !specifier.endsWith(".js")
      ) {
        return nextResolve(specifier + ".js", context);
      }
      throw error;
    }
  },
});
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://www.ivorysql.org/partners",
  pretendToBeVisual: true,
});
const globals = new Map();
for (const name of [
  "window",
  "self",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "Event",
]) {
  globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
const originalActEnvironment = Object.getOwnPropertyDescriptor(
  globalThis,
  "IS_REACT_ACT_ENVIRONMENT",
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const scrolls = [];
const originalScroll = Object.getOwnPropertyDescriptor(
  dom.window.HTMLElement.prototype,
  "scrollIntoView",
);
// JSDOM does not implement layout/scrolling. Observe only the browser API call
// and its genuinely mounted receiver, not pixel position or a fake React node.
Object.defineProperty(dom.window.HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value(options) {
    scrolls.push({ id: this.id, connected: this.isConnected, options });
  },
});
after(async () => {
  if (originalScroll) {
    Object.defineProperty(
      dom.window.HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  } else {
    delete dom.window.HTMLElement.prototype.scrollIntoView;
  }
  dom.window.close();
  for (const [name, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  if (originalActEnvironment) {
    Object.defineProperty(
      globalThis,
      "IS_REACT_ACT_ENVIRONMENT",
      originalActEnvironment,
    );
  } else {
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
  hooks.deregister();
  process.chdir(originalDirectory);
  await rm(scratch, { recursive: true, force: true });
});

const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { NextIntlClientProvider } = await import("next-intl");
const moduleInputs = [
  [
    "PartnersClient.mjs",
    process.env.PARTNERS_CLIENT_PATH ||
      join(projectDirectory, "src/app/[locale]/partners/PartnersClient.tsx"),
  ],
  ["partners.mjs", join(projectDirectory, "src/lib/partners.ts")],
];
for (const [name, path] of moduleInputs) {
  const source = await readFile(path, "utf8");
  const emitted = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  await writeFile(
    join(scratch, name),
    emitted.replaceAll('"@/lib/partners"', '"./partners.mjs"'),
  );
}
const { PartnersClient } = await import(
  pathToFileURL(join(scratch, "PartnersClient.mjs")).href
);
const { getAllPartnerCategories, APPLY_URL, APPLY_URL_ZH } = await import(
  pathToFileURL(join(scratch, "partners.mjs")).href
);

async function withPartners(locale, assertions) {
  const messages = JSON.parse(
    await readFile(
      join(projectDirectory, "messages", locale + ".json"),
      "utf8",
    ),
  );
  const ui = messages.PartnersUI;
  // This is the real PartnersPage producer: actual library data and published
  // labels/benefits/URLs, with no invented category or synthetic partner.
  const categories = getAllPartnerCategories().map((category) => ({
    ...category,
    label: ui.categories[category.id]?.label ?? category.id,
    description: ui.categories[category.id]?.description ?? "",
  }));
  assert.ok(categories.length > 1, "published categories must be selectable");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  scrolls.length = 0;
  try {
    await act(async () => {
      root.render(
        React.createElement(
          NextIntlClientProvider,
          { locale, timeZone: "UTC", messages },
          React.createElement(PartnersClient, {
            categories,
            benefits: ui.benefits,
            applyUrl: locale === "zh" ? APPLY_URL_ZH : APPLY_URL,
          }),
        ),
      );
    });
    const clickCategory = async (id) => {
      const category = categories.find((item) => item.id === id);
      assert.ok(category, "category must come from the real producer");
      const button = [...container.querySelectorAll("button")].find(
        (element) => element.textContent === category.label,
      );
      assert.ok(button, "real category navigation button must exist");
      await act(async () => button.click());
      assertCategory(id);
    };
    const assertCategory = (id) => {
      const category = categories.find((item) => item.id === id);
      const section = container.querySelector("section#" + id);
      assert.ok(section, "selected section must really be mounted");
      assert.equal(section.querySelector("h2").textContent, category.label);
      assert.deepEqual(
        [...section.querySelectorAll("a")].map((a) => a.href),
        category.partners.map(
          (partner) => new URL(partner.url, dom.window.location.href).href,
        ),
      );
      for (const other of categories.filter((item) => item.id !== id)) {
        assert.equal(container.querySelector("section#" + other.id), null);
      }
    };
    await assertions({ categories, clickCategory, assertCategory });
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

function assertScrollIds(ids) {
  assert.deepEqual(
    scrolls.map((call) => call.id),
    ids,
  );
  for (const call of scrolls) {
    assert.equal(call.connected, true, "scroll receiver must be committed DOM");
    assert.deepEqual(call.options, { behavior: "smooth", block: "start" });
  }
}

test("English category switch scrolls the newly mounted community section", async () => {
  await withPartners("en", async ({ clickCategory }) => {
    await clickCategory("community");
    assertScrollIds(["community"]);
  });
});

test("Chinese category switch scrolls the published academic section", async () => {
  await withPartners("zh", async ({ clickCategory }) => {
    await clickCategory("academic");
    assertScrollIds(["academic"]);
  });
});

test("consecutive real category clicks each target the selected section", async () => {
  await withPartners("en", async ({ clickCategory }) => {
    await clickCategory("community");
    await clickCategory("solutions");
    assertScrollIds(["community", "solutions"]);
  });
});

test("initial render retains the first published category without auto-scrolling", async () => {
  await withPartners("en", async ({ categories, assertCategory }) => {
    assertCategory(categories[0].id);
    assertScrollIds([]);
  });
});

test("clicking the already selected category keeps the existing scroll behavior", async () => {
  await withPartners("en", async ({ categories, clickCategory }) => {
    await clickCategory(categories[0].id);
    assertScrollIds([categories[0].id]);
  });
});
