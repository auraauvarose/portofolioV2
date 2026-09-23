import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/deploy.yml"),
  "utf8",
);

test("production build defaults analytics to enabled when the Actions variable is absent", () => {
  assert.match(
    workflow,
    /NEXT_PUBLIC_ANALYTICS_ENABLED:\s*\$\{\{\s*vars\.NEXT_PUBLIC_ANALYTICS_ENABLED\s*\|\|\s*'true'\s*\}\}/,
  );
});
