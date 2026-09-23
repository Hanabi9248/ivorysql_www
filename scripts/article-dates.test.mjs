import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";

import { getNewsItem, getSortedNews } from "../src/lib/news.ts";
import { getPostdata, getSortedPosts } from "../src/lib/posts.ts";

const originalCwd = process.cwd();
const originalTimezone = process.env.TZ;
const root = mkdtempSync(join(tmpdir(), "ivorysql-article-dates-"));

after(() => {
  process.chdir(originalCwd);
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
  rmSync(root, { recursive: true, force: true });
});

for (const locale of ["en", "zh"]) {
  for (const [section, directory, slug, date] of [
    ["blog", "2022-1-28-arrived", "arrived", null],
    ["blog", "2026-09-16-post", "post", "2026-09-16"],
    ["news", "2026-09-18-release", "release", "2026-09-18"],
  ]) {
    const directoryPath = join(root, "content", section, locale, directory);
    mkdirSync(directoryPath, { recursive: true });
    writeFileSync(
      join(directoryPath, "index.mdx"),
      `---\nslug: ${slug}\ntitle: Example\n${date ? `date: "${date}"\n` : ""}---\nArticle body.\n`,
    );
  }
}
process.chdir(root);

for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Shanghai"]) {
  for (const locale of ["en", "zh"]) {
    for (const [kind, slug, date, expected] of [
      ["blog", "arrived", "2022-01-28", locale === "en" ? "Jan 28, 2022" : "2022年1月28日"],
      ["blog", "post", "2026-09-16", locale === "en" ? "Sep 16, 2026" : "2026年9月16日"],
      ["news", "release", "2026-09-18", locale === "en" ? "Sep 18, 2026" : "2026年9月18日"],
    ]) {
      test(`${kind}/${slug}: ${locale} dates in ${timezone}`, () => {
        process.env.TZ = timezone;
        const detail = kind === "blog" ? getPostdata(locale, slug) : getNewsItem(locale, slug);
        const items = kind === "blog" ? getSortedPosts(locale) : getSortedNews(locale);
        const summary = items.find((item) => item.slug === slug);
        assert.equal(detail.date, date);
        assert.equal(detail.formattedDate, expected);
        assert.equal(summary.date, date);
        assert.equal(summary.formattedDate, expected);
      });
    }
  }
}
