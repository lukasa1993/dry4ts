import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findDuplicates, tokenizeFile } from "../dist/core.js";

test("normalizes identifiers and literals", () => {
  const root = mkdtempSync(join(tmpdir(), "dry4ts-"));
  try {
    const file = join(root, "sample.ts");
    writeFileSync(file, "const answer = 42;\n");
    assert.deepEqual(tokenizeFile(file).map((token) => token.value), ["const", "ID", "=", "NUM", ";"]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("finds duplicated normalized token blocks", () => {
  const root = mkdtempSync(join(tmpdir(), "dry4ts-"));
  try {
    writeFileSync(join(root, "a.ts"), "export function a(x: number) { if (x > 0) return x + 1; return 0; }\n");
    writeFileSync(join(root, "b.ts"), "export function b(y: number) { if (y > 2) return y + 3; return 4; }\n");
    assert.ok(findDuplicates(root, 12).length > 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
