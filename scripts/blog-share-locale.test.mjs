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
const { JSDOM } = require(process.env.BLOG_SHARE_JSDOM_PATH || "jsdom");
const scratch = await mkdtemp(join(scriptsDirectory, ".blog-share-"));
const originalDirectory = process.cwd();
process.chdir(projectDirectory);

// Resolve the installed Next CJS default through the same exports used by
// the bundler. No Link, image, router, locale hook, or renderer is substituted.
for (const name of ["image", "link"]) {
  await writeFile(
    join(scratch, name + ".mjs"),
    'import {createRequire} from "node:module";\n' +
      "const value = createRequire(" +
      JSON.stringify(import.meta.url) +
      ')("next/' +
      name +
      '");\n' +
      "export default value.default ?? value;\n",
  );
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.conditions.includes("import") &&
      /^next\/(image|link)(\.js)?$/.test(specifier)
    ) {
      const name = specifier.split("/")[1].replace(/\.js$/, "");
      return {
        url: pathToFileURL(join(scratch, name + ".mjs")).href,
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
after(async () => {
  hooks.deregister();
  process.chdir(originalDirectory);
  await rm(scratch, { recursive: true, force: true });
});

// Transpile complete modules and only resolve their imports. The article
// producer, Markdown renderer and Next/next-intl components stay genuine.
const modules = [
  [
    "BlogPostContent.mjs",
    process.env.BLOG_POST_CONTENT_PATH ||
      join(
        projectDirectory,
        "src/app/[locale]/blog/[slug]/BlogPostContent.tsx",
      ),
  ],
  [
    "MDXRenderer.mjs",
    join(projectDirectory, "src/app/[locale]/blog/[slug]/MDXRenderer.tsx"),
  ],
  ["posts.mjs", join(projectDirectory, "src/lib/posts.ts")],
  ["navigation.mjs", join(projectDirectory, "src/i18n/navigation.ts")],
  ["routing.mjs", join(projectDirectory, "src/i18n/routing.ts")],
];
await writeFile(
  join(scratch, "authors.json"),
  await readFile(join(projectDirectory, "src/lib/authors.json")),
);
for (const [name, path] of modules) {
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
    emitted
      .replaceAll('"@/i18n/navigation"', '"./navigation.mjs"')
      .replaceAll('"./routing"', '"./routing.mjs"')
      .replaceAll('"./MDXRenderer"', '"./MDXRenderer.mjs"')
      .replaceAll(
        '"@/lib/authors.json"',
        '"./authors.json" with { type: "json" }',
      ),
  );
}

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { NextIntlClientProvider } = await import("next-intl");
const { BlogPostContent } = await import(
  pathToFileURL(join(scratch, "BlogPostContent.mjs")).href
);
const { getPostdata } = await import(
  pathToFileURL(join(scratch, "posts.mjs")).href
);
const slug = "oracle-to-ivorysql-code-reduction";
const origin = "https://www.ivorysql.org";

async function withArticle(locale, assertions) {
  const post = getPostdata(locale, slug);
  // Supported published producer output: localization belongs to navigation,
  // not a manually prefixed or invented article prop.
  assert.equal(post.path, "/blog/" + slug);
  assert.ok(post.content.length > 1000);
  const messages = JSON.parse(
    await readFile(
      join(projectDirectory, "messages", locale + ".json"),
      "utf8",
    ),
  );
  const html = renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      { locale, timeZone: "UTC", messages },
      React.createElement(BlogPostContent, {
        post,
        prevPost: null,
        nextPost: null,
        relatedPosts: [],
      }),
    ),
  );
  const dom = new JSDOM(html, {
    url: origin + (locale === "zh" ? "/zh" : "") + post.path,
  });
  try {
    await assertions(dom.window.document, post);
  } finally {
    dom.window.close();
  }
}

function share(document, label) {
  const anchor = document.querySelector('a[aria-label="' + label + '"]');
  assert.ok(anchor, "real share anchor must render");
  assert.equal(anchor.target, "_blank");
  assert.ok(anchor.rel.includes("noopener"));
  return new URL(anchor.href);
}

test("Chinese article X share retains the published Chinese route", async () => {
  await withArticle("zh", (document, post) => {
    const url = share(document, "Share on X");
    assert.equal(url.origin + url.pathname, "https://twitter.com/intent/tweet");
    assert.equal(url.searchParams.get("url"), origin + "/zh" + post.path);
    assert.equal(url.searchParams.get("text"), post.title);
  });
});

test("Chinese article LinkedIn share retains the published Chinese route", async () => {
  await withArticle("zh", (document, post) => {
    const url = share(document, "Share on LinkedIn");
    assert.equal(
      url.origin + url.pathname,
      "https://www.linkedin.com/shareArticle",
    );
    assert.equal(url.searchParams.get("url"), origin + "/zh" + post.path);
    assert.equal(url.searchParams.get("title"), post.title);
  });
});

test("English article X share keeps the unprefixed default route", async () => {
  await withArticle("en", (document, post) => {
    const url = share(document, "Share on X");
    assert.equal(url.searchParams.get("url"), origin + post.path);
    assert.equal(url.searchParams.get("text"), post.title);
  });
});

test("English article LinkedIn share keeps the unprefixed default route", async () => {
  await withArticle("en", (document, post) => {
    const url = share(document, "Share on LinkedIn");
    assert.equal(url.searchParams.get("url"), origin + post.path);
    assert.equal(url.searchParams.get("title"), post.title);
  });
});
