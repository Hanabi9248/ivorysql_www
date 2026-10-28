import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { dirname, join, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const nextInteropDirectory = await mkdtemp(
  join(dirname(fileURLToPath(import.meta.url)), ".events-next-interop-"),
);
for (const name of ["image", "link"]) {
  await writeFile(
    join(nextInteropDirectory, name + ".mjs"),
    'import {createRequire} from "node:module";\n' +
      "const value = createRequire(" +
      JSON.stringify(import.meta.url) +
      ')("next/' +
      name +
      '");\n' +
      "export default value.default ?? value;\n",
  );
}
after(async () => {
  await rm(nextInteropDirectory, { recursive: true, force: true });
});

// Next's bundler resolves its extensionless public subpaths. Node's direct
// ESM runner needs the same resolution to the installed, unchanged modules.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.conditions.includes("import") &&
      /^next\/(image|link)(\.js)?$/.test(specifier)
    ) {
      const name = specifier.split("/")[1].replace(/\.js$/, "");
      return {
        url: pathToFileURL(join(nextInteropDirectory, name + ".mjs")).href,
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

const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.EVENTS_TEST_JSDOM_PATH || "jsdom");
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptsDirectory, "..");
const originalDirectory = process.cwd();
process.chdir(projectDirectory);
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/community/events",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "self",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "Event",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Browser globals precede ReactDOM initialization so its real input-event
// support is detected in the same way as a client render.
const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { NextIntlClientProvider } = await import("next-intl");
const compiledDirectory = await mkdtemp(
  join(scriptsDirectory, ".events-search-"),
);
after(async () => {
  dom.window.close();
  process.chdir(originalDirectory);
  await rm(compiledDirectory, { recursive: true, force: true });
});

// These are complete production modules, not copied implementations. Rewrite
// only import resolution for their temporary emitted ES modules; all Next,
// next-intl, React, class utilities and gray-matter dependencies stay real.
const modules = [
  [
    "EventsClient.mjs",
    process.env.EVENTS_CLIENT_PATH ||
      join(
        projectDirectory,
        "src/app/[locale]/community/events/EventsClient.tsx",
      ),
  ],
  ["navigation.mjs", join(projectDirectory, "src/i18n/navigation.ts")],
  ["routing.mjs", join(projectDirectory, "src/i18n/routing.ts")],
  ["utils.mjs", join(projectDirectory, "src/lib/utils.ts")],
  ["event-status.mjs", join(projectDirectory, "src/lib/event-status.ts")],
  ["events.mjs", join(projectDirectory, "src/lib/events.ts")],
];
for (const [name, sourcePath] of modules) {
  const source = await readFile(sourcePath, "utf8");
  const emitted = ts.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  await writeFile(
    join(compiledDirectory, name),
    emitted
      .replaceAll('"@/i18n/navigation"', '"./navigation.mjs"')
      .replaceAll('"@/lib/utils"', '"./utils.mjs"')
      .replaceAll('"@/lib/event-status"', '"./event-status.mjs"')
      .replaceAll('"./routing"', '"./routing.mjs"')
      .replaceAll('"next/image"', '"next/image.js"'),
  );
}
const { EventsClient } = await import(
  pathToFileURL(join(compiledDirectory, "EventsClient.mjs")).href
);
const { getSortedEvents } = await import(
  pathToFileURL(join(compiledDirectory, "events.mjs")).href
);
const messages = JSON.parse(
  await readFile(join(projectDirectory, "messages/en.json"), "utf8"),
);
const allEvents = getSortedEvents("en");
// Match the actual EventsPage caller: pass all published events.

const article = allEvents.find((post) => post.slug === "event-202618");
assert.ok(article, "current published campus event must be in the timeline");

async function withEvents(assertions) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(
        React.createElement(
          NextIntlClientProvider,
          { locale: "en", timeZone: "UTC", messages },
          React.createElement(EventsClient, { allEvents }),
        ),
      );
    });
    const input = container.querySelector('input[type="search"]');
    assert.ok(input, "real search control must be rendered");
    const setValue = Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      "value",
    ).set;
    const search = async (query) => {
      await act(async () => {
        setValue.call(input, query);
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      assert.equal(
        input.value,
        query,
        "typed query must reach the real control",
      );
    };
    const titles = () =>
      [...container.querySelectorAll("h4")].map(
        (heading) => heading.textContent,
      );
    await assertions({ container, search, titles });
  } catch (error) {
    console.error("EVENTS_RENDER_DIAGNOSTIC", error, error.errors);
    throw error;
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

for (const [edge, query] of [
  ["leading", `  ${article.title}`],
  ["trailing", `${article.title}  `],
]) {
  test(`${edge} whitespace preserves the current exact-title search result`, async () => {
    await withEvents(async ({ search, titles }) => {
      await search(query);
      assert.deepEqual(titles(), [article.title]);
    });
  });
}

test("exact title and lowercase queries still find the published article", async () => {
  await withEvents(async ({ search, titles }) => {
    await search(article.title);
    assert.deepEqual(titles(), [article.title]);
    await search(article.title.toLowerCase());
    assert.deepEqual(titles(), [article.title]);
  });
});

test("whitespace-only input continues to leave the grid unfiltered", async () => {
  await withEvents(async ({ search, titles }) => {
    await search("   ");
    assert.deepEqual(
      titles(),
      allEvents.map((post) => post.title),
    );
  });
});

test("category selection still filters the actual published article list", async () => {
  await withEvents(async ({ container, titles }) => {
    const category = [...container.querySelectorAll("button")].find((button) =>
      button.textContent.trim().startsWith(article.eventType + " "),
    );
    assert.ok(category, "article category must have a real filter button");
    await act(async () => category.click());
    assert.deepEqual(
      titles(),
      allEvents
        .filter((post) => post.eventType === article.eventType)
        .map((post) => post.title),
    );
  });
});

test("padded published location finds the same real event cards", async () => {
  await withEvents(async ({ search, titles }) => {
    await search(`  ${article.location}  `);
    assert.deepEqual(
      titles(),
      allEvents
        .filter((event) =>
          [event.title, event.description, event.location].some((value) =>
            value.toLowerCase().includes(article.location.toLowerCase()),
          ),
        )
        .map((event) => event.title),
    );
  });
});
