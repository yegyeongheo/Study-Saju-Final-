"""Isolated invocation of the original public API; no calculation rules here."""
import json
import os
from pathlib import Path
import sys


def main():
    sys.dont_write_bytecode = True
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    root = Path(os.environ["SAJU_CORE_ROOT"]).resolve()
    sys.path.insert(0, str(root / "src"))
    from saju_core.integrity import verify_source
    identity = verify_source(expected_sha256=os.environ["SAJU_EXPECTED_SOURCE_SHA256"])
    from saju_core import api
    if "--verify" in sys.argv:
        api.verify_bundle()
        result = identity
    else:
        result = api.analyze(json.load(sys.stdin))
    json.dump(result, sys.stdout, ensure_ascii=False, allow_nan=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
