import React from "react";

import matter from "gray-matter";
import assert from "node:assert/strict";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptsDirectory, "..");
const componentPath =
  process.env.MDX_RENDERER_PATH ||
  join(projectDirectory, "src/app/[locale]/blog/[slug]/MDXRenderer.tsx");

// Transpile and import the complete production component. Markdown parsing,
// GFM conversion and React rendering all use the project's real dependencies.
const componentSource = await readFile(componentPath, "utf8");
const compiled = ts.transpileModule(componentSource, {
  fileName: componentPath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const modulePath = join(
  scriptsDirectory,
  `.markdown-table-component-${process.pid}.mjs`,
);
await writeFile(modulePath, compiled.outputText);
after(async () => {
  await unlink(modulePath);
});
const { MDXRenderer } = await import(pathToFileURL(modulePath).href);

function render(content) {
  return renderToStaticMarkup(React.createElement(MDXRenderer, { content }));
}

function cells(row) {
  return [...row.matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(
    ([, tag, attributes, content]) => ({ tag, attributes, content }),
  );
}

for (const [locale, heading] of [
  ["en", "Port"],
  ["zh", "端口"],
]) {
  test(`${locale} published migration article retains right-aligned ports`, async () => {
    const article = await readFile(
      join(
        projectDirectory,
        "content/blog",
        locale,
        "2026-08-03-oracle-to-ivorysql-code-reduction/index.mdx",
      ),
      "utf8",
    );
    const html = render(matter(article).content);
    const tables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/g) || [];
    const portTable = tables.find((table) =>
      [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].some(([, row]) =>
        cells(row).some(
          (cell) => cell.tag === "th" && cell.content === heading,
        ),
      ),
    );
    assert.ok(portTable, "real article must contain its port table");
    const rows = [...portTable.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)];
    const header = cells(rows[0][1]);
    const portColumn = header.findIndex((cell) => cell.content === heading);
    assert.notEqual(portColumn, -1);
    for (const [, row] of rows) {
      const cell = cells(row)[portColumn];
      assert.ok(cell, "port column must survive rendering");
      assert.match(cell.attributes, /style="[^"]*text-align:right/);
    }
    assert.match(portTable, />55432<\/td>/);
  });
}

test("GFM left, center and right alignment reaches headers and body cells", () => {
  const html = render(
    "| Left | Center | Right |\n| :--- | :---: | ---: |\n| a | b | 42 |",
  );
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length, 2);
  for (const [, row] of rows) {
    const columns = cells(row);
    assert.equal(columns.length, 3);
    for (const [index, alignment] of ["left", "center", "right"].entries()) {
      assert.match(
        columns[index].attributes,
        new RegExp(`style="[^"]*text-align:${alignment}`),
      );
    }
  }
});

test("unaligned tables keep their contents and existing classes", () => {
  const html = render("| Name | Value |\n| --- | --- |\n| work_mem | 42 |");
  const renderedCells = cells(html);
  assert.equal(renderedCells.length, 4);
  assert.deepEqual(
    renderedCells.map((cell) => cell.content),
    ["Name", "Value", "work_mem", "42"],
  );
  for (const cell of renderedCells) {
    assert.match(cell.attributes, /class="[^"]*border-border/);
    assert.doesNotMatch(cell.attributes, /text-align:/);
  }
});

test("inline and fenced code retain the existing single pre wrapper", () => {
  const html = render("`inline`\n\n```sql\nSELECT 1;\n```\n");
  assert.match(html, /<p><code[^>]*>inline<\/code><\/p>/);
  assert.equal((html.match(/<pre\b/g) || []).length, 1);
  assert.match(html, /<code class="language-sql[^\"]*">SELECT 1;\n<\/code>/);
});
