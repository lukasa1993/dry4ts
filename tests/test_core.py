from pathlib import Path

from dry4ts.core import find_duplicates


def test_cross_file_duplicate_is_found(tmp_path: Path) -> None:
    first = tmp_path / ("a_" + 'sample.ts')
    second = tmp_path / ("b_" + 'sample.ts')
    first.write_text('export function choose(a: boolean, b: boolean): number {\n  if (a && b) { return 1; }\n  return 0;\n}\n', encoding="utf-8")
    second.write_text('export function decide(a: boolean, b: boolean): number {\n  if (a && b) { return 1; }\n  return 0;\n}\n', encoding="utf-8")
    duplicates = find_duplicates(tmp_path, min_tokens=8)
    assert duplicates


def test_non_overlapping_same_file_duplicate_is_found(tmp_path: Path) -> None:
    path = tmp_path / 'sample.ts'
    path.write_text('export function choose(a: boolean, b: boolean): number {\n  if (a && b) { return 1; }\n  return 0;\n}\n' + "\n" + 'export function decide(a: boolean, b: boolean): number {\n  if (a && b) { return 1; }\n  return 0;\n}\n', encoding="utf-8")
    duplicates = find_duplicates(tmp_path, min_tokens=8)
    assert any(item.locations[0].file == item.locations[1].file for item in duplicates)
