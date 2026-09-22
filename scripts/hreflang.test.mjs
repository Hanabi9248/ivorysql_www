import assert from "node:assert/strict";
import test from "node:test";

import { buildAlternates } from "../src/lib/hreflang.ts";

test("translated homepages have self-referencing canonical URLs", () => {
  for (const [locale, canonical] of [
    ["en", "/"],
    ["zh", "/zh"],
  ]) {
    assert.deepEqual(buildAlternates("/", locale), {
      canonical,
      languages: { en: "/", zh: "/zh", "x-default": "/" },
    });
  }
});

test("translated articles retain the English default for both locales", () => {
  for (const locale of ["en", "zh"]) {
    const canonical = locale === "zh" ? "/zh/blog/example" : "/blog/example";
    assert.deepEqual(buildAlternates("/blog/example", locale, ["en", "zh"]), {
      canonical,
      languages: {
        en: "/blog/example",
        zh: "/zh/blog/example",
        "x-default": "/blog/example",
      },
    });
  }
});

test("Chinese-only articles do not advertise a missing English translation", () => {
  assert.deepEqual(buildAlternates("/news/example", "zh", ["zh"]), {
    canonical: "/zh/news/example",
    languages: { zh: "/zh/news/example", "x-default": "/zh/news/example" },
  });
});

test("English-only articles do not advertise a missing Chinese translation", () => {
  assert.deepEqual(buildAlternates("/news/example", "en", ["en"]), {
    canonical: "/news/example",
    languages: { en: "/news/example", "x-default": "/news/example" },
  });
});
