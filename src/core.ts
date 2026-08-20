import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

export interface SourceToken { value: string; line: number; }
export interface Location { file: string; startLine: number; endLine: number; }
export interface Duplicate { tokenCount: number; locations: Location[]; }

const EXCLUDED_DIRS = new Set([".git", ".next", "coverage", "dist", "build", "node_modules", "target", "vendor"]);

export function discoverFiles(root: string, filters: readonly string[] = []): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(join(directory, entry.name));
        continue;
      }
      if (!entry.isFile() || (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) || entry.name.endsWith(".d.ts")) continue;
      const file = join(directory, entry.name);
      const rel = relative(root, file).replaceAll("\\", "/");
      if (filters.length === 0 || filters.some((fragment) => rel.includes(fragment))) files.push(file);
    }
  };
  walk(root);
  return files.sort();
}

function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) if (text.charCodeAt(index) === 10) line += 1;
  return line;
}

export function tokenizeFile(path: string): SourceToken[] {
  const text = readFileSync(path, "utf8");
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, text);
  const tokens: SourceToken[] = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    const raw = text.slice(scanner.getTokenPos(), scanner.getTextPos());
    let value = raw;
    if (kind === ts.SyntaxKind.Identifier || kind === ts.SyntaxKind.PrivateIdentifier) value = "ID";
    else if (kind === ts.SyntaxKind.NumericLiteral || kind === ts.SyntaxKind.BigIntLiteral) value = "NUM";
    else if (kind === ts.SyntaxKind.StringLiteral || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) value = "STR";
    tokens.push({ value, line: lineAt(text, scanner.getTokenPos()) });
  }
  return tokens;
}

export function findDuplicates(root: string, minTokens = 40, filters: readonly string[] = [], maxGroups = 50): Duplicate[] {
  if (!Number.isInteger(minTokens) || minTokens < 4) throw new Error("minTokens must be an integer of at least 4");
  const groups = new Map<string, Location[]>();
  for (const file of discoverFiles(root, filters)) {
    const rel = relative(root, file).replaceAll("\\", "/");
    const tokens = tokenizeFile(file);
    for (let start = 0; start + minTokens <= tokens.length; start += 1) {
      const window = tokens.slice(start, start + minTokens);
      const digest = createHash("sha256").update(window.map((token) => token.value).join("\0")).digest("hex");
      const location = { file: rel, startLine: window[0].line, endLine: window[window.length - 1].line };
      const values = groups.get(digest) ?? [];
      values.push(location);
      groups.set(digest, values);
    }
  }
  const candidates: Duplicate[] = [];
  for (const locations of groups.values()) {
    const unique = [...new Map(locations.map((value) => [`${value.file}:${value.startLine}:${value.endLine}`, value])).values()];
    if (unique.length < 2) continue;
    if (unique.every((value) => value.file === unique[0].file)) {
      const sorted = [...unique].sort((a, b) => a.startLine - b.startLine);
      if (sorted.every((value, index) => index === 0 || value.startLine <= sorted[index - 1].endLine)) continue;
    }
    candidates.push({ tokenCount: minTokens, locations: unique });
  }
  candidates.sort((a, b) => b.locations.length - a.locations.length || a.locations[0].file.localeCompare(b.locations[0].file) || a.locations[0].startLine - b.locations[0].startLine);
  const selected: Duplicate[] = [];
  for (const candidate of candidates) {
    const first = candidate.locations[0];
    const second = candidate.locations[1];
    if (selected.some((old) => {
      const a = old.locations[0]; const b = old.locations[1];
      return a.file === first.file && b.file === second.file && Math.abs(a.startLine - first.startLine) <= 2 && Math.abs(b.startLine - second.startLine) <= 2;
    })) continue;
    selected.push(candidate);
    if (selected.length >= maxGroups) break;
  }
  return selected;
}
