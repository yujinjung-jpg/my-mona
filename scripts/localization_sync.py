#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path


LOCALES = ("es", "pt_BR", "ko")
SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")
COMMIT_PATTERN = re.compile(r"[0-9a-f]{40}")


def is_source_path(source):
    if source.startswith("/") or "\\" in source:
        return False
    if any(part in {"", ".", ".."} for part in source.split("/")):
        return False
    if source in {"README.md", "docs/index.html", "docs/step.html"}:
        return True
    if not source.startswith("workshop/") or not source.endswith(".md"):
        return False
    relative = source[len("workshop/"):]
    return relative.split("/", 1)[0] not in LOCALES


def localized_path(root, source, locale):
    if locale not in LOCALES or not is_source_path(source):
        raise ValueError(f"Unsupported localization mapping: {source} ({locale})")
    if source == "README.md":
        return root / f"README.{locale}.md"
    if source.startswith("workshop/"):
        return root / "workshop" / locale / source[len("workshop/"):]
    return root / "docs" / locale / Path(source).name


def relative_localized_path(source, locale):
    return localized_path(Path("."), source, locale).as_posix()


def ensure_safe_path(root, path):
    root_path = Path(root).absolute()
    path = Path(path)
    candidate = path if path.is_absolute() else root_path / path
    try:
        relative = candidate.relative_to(root_path)
    except ValueError:
        raise SystemExit(f"Localization path escapes the repository: {candidate}")
    if any(part in {".", ".."} for part in relative.parts):
        raise SystemExit(f"Localization path is not canonical: {candidate}")
    root = root_path.resolve()
    candidate = root / relative
    current = candidate
    while current != root:
        if current.is_symlink():
            raise SystemExit(f"Localization path must not contain symlinks: {current}")
        current = current.parent
    if not candidate.resolve(strict=False).is_relative_to(root):
        raise SystemExit(f"Localization path escapes the repository: {candidate}")
    return candidate


def digest(path):
    data = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(data).hexdigest()


def validate_state(state, path):
    if not isinstance(state, dict) or state.get("version") != 1:
        raise SystemExit(f"Unsupported or malformed localization state: {path}")
    files = state.get("files")
    if not isinstance(files, dict):
        raise SystemExit(f"Malformed localization state files object: {path}")
    for source, entry in files.items():
        if not isinstance(source, str) or not isinstance(entry, dict):
            raise SystemExit(f"Malformed localization state entry in {path}")
        required = {"source_commit", "source_sha256", "localized_sha256"}
        if not required.issubset(entry):
            raise SystemExit(f"Incomplete localization state entry for {source} in {path}")
        if not SHA256_PATTERN.fullmatch(str(entry["source_sha256"])):
            raise SystemExit(f"Invalid source fingerprint for {source} in {path}")
        if not SHA256_PATTERN.fullmatch(str(entry["localized_sha256"])):
            raise SystemExit(f"Invalid localized fingerprint for {source} in {path}")
        source_commit = entry["source_commit"]
        if source_commit is not None and (
            not isinstance(source_commit, str) or not COMMIT_PATTERN.fullmatch(source_commit)
        ):
            raise SystemExit(f"Invalid source_commit for {source} in {path}")


def read_state(root, locale):
    path = root / "localizations" / locale / ".localization-state.json"
    ensure_safe_path(root, path)
    if not path.is_file():
        return {"version": 1, "files": {}}, path, False
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"Cannot read localization state {path}: {error}")
    validate_state(state, path)
    return state, path, True


def write_state(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)


def prune_empty_directories(root, source, locale, target):
    if source.startswith("workshop/"):
        stop = root / "workshop" / locale
    elif source.startswith("docs/"):
        stop = root / "docs" / locale
    else:
        return

    parent = target.parent
    while parent != stop and stop in parent.parents and parent.is_dir():
        try:
            parent.rmdir()
        except OSError:
            break
        parent = parent.parent


def deletion_manifest(root, deleted_sources):
    manifest = []
    for source in deleted_sources:
        if not is_source_path(source):
            raise SystemExit(f"Not a canonical localization source: {source}")
        source_path = ensure_safe_path(root, root / source)
        if source_path.exists():
            raise SystemExit(f"Refusing to delete localizations for an existing source: {source}")

        for locale in LOCALES:
            state, _, _ = read_state(root, locale)
            entry = state["files"].get(source)
            target = ensure_safe_path(root, localized_path(root, source, locale))
            if entry is None:
                if target.exists():
                    raise SystemExit(
                        f"Cannot safely delete {target}: no recorded localized fingerprint."
                    )
                continue
            if target.exists() and (
                not target.is_file() or digest(target) != entry["localized_sha256"]
            ):
                raise SystemExit(
                    f"Localized output changed since its baseline; refusing to delete {target}."
                )
            manifest.append(
                {
                    "source": source,
                    "locale": locale,
                    "path": relative_localized_path(source, locale),
                    "localized_sha256": entry["localized_sha256"],
                }
            )

    return manifest


def apply_deletion_manifest(root, manifest):
    if not isinstance(manifest, list):
        raise SystemExit("Malformed localized deletion manifest.")

    operations = []
    seen = set()
    states = {}
    state_paths = {}
    for item in manifest:
        if not isinstance(item, dict):
            raise SystemExit("Malformed localized deletion manifest entry.")
        source = item.get("source")
        locale = item.get("locale")
        if not isinstance(source, str) or not is_source_path(source):
            raise SystemExit(f"Unsupported source in localized deletion manifest: {source}")
        if not isinstance(locale, str) or locale not in LOCALES:
            raise SystemExit(f"Unsupported locale in localized deletion manifest: {locale}")
        expected_path = relative_localized_path(source, locale)
        if item.get("path") != expected_path:
            raise SystemExit(f"Localized deletion path does not match source mapping: {item}")
        source_path = ensure_safe_path(root, root / source)
        if source_path.exists():
            raise SystemExit(f"Refusing to delete localization while source still exists: {source}")
        key = (source, locale)
        if key in seen:
            raise SystemExit(f"Duplicate localized deletion entry: {source} ({locale})")
        seen.add(key)

        state, state_path, _ = read_state(root, locale)
        entry = state["files"].get(source)
        if entry is None or entry["localized_sha256"] != item.get("localized_sha256"):
            raise SystemExit(f"Localization baseline changed for deleted source {source} ({locale}).")
        target = ensure_safe_path(root, localized_path(root, source, locale))
        if target.exists() and (
            not target.is_file() or digest(target) != item["localized_sha256"]
        ):
            raise SystemExit(
                f"Localized output changed since its baseline; refusing to delete {target}."
            )
        states[locale] = state
        state_paths[locale] = state_path
        operations.append((source, locale, target))

    for source, locale, target in operations:
        if target.is_file():
            target.unlink()
        states[locale]["files"].pop(source, None)
        prune_empty_directories(root, source, locale, target)

    for locale, state in states.items():
        write_state(state_paths[locale], state)


def finalize(root, sources, deleted_sources, snapshot_path, output_path):
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    if set(snapshot) != set(sources):
        raise SystemExit("Source baseline snapshot does not match the selected source list.")

    manifest = deletion_manifest(root, deleted_sources)
    apply_deletion_manifest(root, manifest)

    states = {}
    state_paths = {}
    for locale in LOCALES:
        state, state_path, _ = read_state(root, locale)
        states[locale] = state
        state_paths[locale] = state_path

    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    for source in sources:
        captured = snapshot[source]
        source_path = root / source
        if not source_path.is_file() or digest(source_path) != captured.get("source_sha256"):
            raise SystemExit(f"Source changed during localization; review again: {source}")
        source_commit = captured.get("source_commit")
        if source_commit is not None:
            if source_commit != head:
                raise SystemExit(f"Unexpected source commit candidate for {source}.")
            committed = subprocess.run(
                ["git", "show", f"{source_commit}:{source}"],
                cwd=root,
                check=False,
                capture_output=True,
            )
            if committed.returncode != 0 or hashlib.sha256(
                committed.stdout.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
            ).hexdigest() != captured["source_sha256"]:
                raise SystemExit(f"Committed source does not match captured baseline: {source}")

        for locale in LOCALES:
            target = ensure_safe_path(root, localized_path(root, source, locale))
            if not target.is_file():
                raise SystemExit(f"Missing or unsafe localized output: {target}")
            states[locale]["files"][source] = {
                "source_commit": source_commit,
                "source_sha256": captured["source_sha256"],
                "localized_sha256": digest(target),
            }

    if sources:
        for locale, state in states.items():
            write_state(state_paths[locale], state)

    with open(output_path, "a", encoding="utf-8") as output:
        output.write(
            "deletion_manifest_json="
            + json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
            + "\n"
        )


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    finalize_parser = subparsers.add_parser("finalize")
    finalize_parser.add_argument("--root", type=Path, default=Path.cwd())
    finalize_parser.add_argument("--sources-json", required=True)
    finalize_parser.add_argument("--deleted-sources-json", required=True)
    finalize_parser.add_argument("--snapshot", type=Path, required=True)
    finalize_parser.add_argument("--github-output", type=Path, required=True)

    delete_parser = subparsers.add_parser("apply-deletions")
    delete_parser.add_argument("--root", type=Path, default=Path.cwd())
    delete_parser.add_argument("--manifest-json", required=True)

    args = parser.parse_args()
    root = args.root.resolve()
    if args.command == "finalize":
        sources = json.loads(args.sources_json)
        deleted_sources = json.loads(args.deleted_sources_json)
        if not isinstance(sources, list) or not isinstance(deleted_sources, list):
            raise SystemExit("Malformed localization source lists.")
        finalize(
            root,
            sources,
            deleted_sources,
            args.snapshot,
            args.github_output,
        )
    elif args.command == "apply-deletions":
        manifest = json.loads(args.manifest_json)
        apply_deletion_manifest(root, manifest)


if __name__ == "__main__":
    main()
