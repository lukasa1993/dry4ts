# dry4ts

`dry4ts` finds normalized duplicate code in TypeScript projects with Tree-sitter tokens. It reports cross-file and non-overlapping same-file duplicates, extends matching windows to maximal blocks, and suppresses contained results.

```bash
pipx install git+https://github.com/lukasa1993/dry4ts.git
dry4ts --min-tokens 30 --fail
```

Exit status: `0` pass, `1` analysis error, `2` duplicates found when `--fail` is active.

## Development

```bash
python -m pip install -e . pytest
pytest -q
```
