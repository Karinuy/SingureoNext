#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys


OLD_DOMAIN = "r2.limulu.moe"
NEW_DOMAIN = "res.sin0.cc"


def replace_in_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if OLD_DOMAIN not in text:
        return False
    updated = text.replace(OLD_DOMAIN, NEW_DOMAIN)
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    content_dir = root / "src" / "content"
    if not content_dir.exists():
        print(f"未找到目录: {content_dir}")
        return 1

    patterns = ["**/*.md", "**/*.mdx"]
    changed = []

    for pattern in patterns:
        for path in content_dir.glob(pattern):
            if path.is_file() and replace_in_file(path):
                changed.append(path)

    print(f"完成。替换域名: {OLD_DOMAIN} -> {NEW_DOMAIN}")
    print(f"更新文件数: {len(changed)}")
    if changed:
        for path in changed:
            print(f"- {path.relative_to(root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
