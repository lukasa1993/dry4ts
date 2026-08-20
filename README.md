# dry4ts

`dry4ts` finds duplicated normalized token windows in TypeScript and TSX source. It uses the TypeScript scanner and ignores comments and whitespace.

## Install

```bash
npm install --global github:lukasa1993/dry4ts
```

## Run

```bash
dry4ts --min-tokens 40 --fail
```

Use positional path fragments to limit source discovery. Use `--json` for machine-readable results.

Identifiers, numbers, and strings are normalized. This finds structural duplication even when local variable names and literal values differ.

## Development

```bash
npm ci
npm test
```
