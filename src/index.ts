#!/usr/bin/env node
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { findDuplicates } from "./core.js";

const VERSION = "0.1.0";
function help(): void { console.log(`dry4ts ${VERSION}

Usage: dry4ts [options] [path-fragment ...]

Options:
  --root <path>          Project root
  --min-tokens <number>  Minimum normalized token count. Default: 40
  --max-groups <number>  Maximum groups to report. Default: 50
  --json                 Print JSON
  --fail                 Exit 2 when duplication is found
  --version              Print version
  --help                 Print help
`); }

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    root: { type: "string" }, "min-tokens": { type: "string" }, "max-groups": { type: "string" },
    json: { type: "boolean" }, fail: { type: "boolean" }, version: { type: "boolean" }, help: { type: "boolean" },
  }});
  if (values.help) { help(); process.exit(0); }
  if (values.version) { console.log(VERSION); process.exit(0); }
  const minTokens = Number(values["min-tokens"] ?? "40");
  const maxGroups = Number(values["max-groups"] ?? "50");
  const duplicates = findDuplicates(resolve(values.root ?? "."), minTokens, positionals, maxGroups);
  if (values.json) console.log(JSON.stringify(duplicates, null, 2));
  else if (duplicates.length === 0) console.log("No duplicated blocks found.");
  else {
    console.log("DRY Report\n==========");
    duplicates.forEach((duplicate, index) => {
      console.log(`\nGroup ${index + 1}: ${duplicate.tokenCount} normalized tokens`);
      duplicate.locations.forEach((location) => console.log(`  ${location.file}:${location.startLine}-${location.endLine}`));
    });
  }
  if (values.fail && duplicates.length > 0) process.exit(2);
} catch (error) {
  console.error(`dry4ts: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
