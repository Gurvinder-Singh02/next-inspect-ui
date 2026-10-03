import assert from "node:assert/strict";
import { test } from "node:test";

import { nodeMatches, scoreNodes } from "./match.ts";

test("matches file and optional line", () => {
  assert.equal(
    nodeMatches(
      { name: "button", source: "components/ui/button.tsx:52" },
      { name: "button", file: "components/ui/button.tsx", line: 52 },
    ),
    true,
  );
  assert.equal(
    nodeMatches(
      { name: "Button", source: "app/(dev)/test/page.tsx:48" },
      { name: "Button", file: "app/(dev)/test/page.tsx" },
    ),
    true,
  );
  assert.equal(
    nodeMatches(
      { name: "Button", source: "app/(dev)/test/page.tsx:48" },
      { name: "Button", file: "app/(dev)/test/page.tsx", line: 99 },
    ),
    false,
  );
});

test("100% when both nodes match", () => {
  const report = scoreNodes(
    [
      { name: "Button", file: "app/(dev)/test/page.tsx" },
      { name: "button", file: "components/ui/button.tsx", line: 52 },
    ],
    [
      { name: "Button", source: "app/(dev)/test/page.tsx:48" },
      { name: "button", source: "components/ui/button.tsx:52" },
    ],
  );
  assert.equal(report.ok, true);
  assert.equal(report.rate, 100);
  assert.equal(report.expectedCount, 2);
  assert.equal(report.foundCount, 2);
});
