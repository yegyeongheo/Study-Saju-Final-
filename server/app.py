"""WSGI JSON API and optional local static preview. Never generates reports."""
import argparse
import json
import mimetypes
import os
from pathlib import Path
import subprocess
import sys
from threading import BoundedSemaphore
from urllib.parse import urlsplit
from wsgiref.simple_server import WSGIRequestHandler, make_server
from .security import ApiGuard

ROOT = Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / "core-engine.lock.json").read_text(encoding="utf-8"))
MAX_BODY_BYTES = 32768


class TransportError(Exception):
    def __init__(self, status, code):
        self.status, self.code = status, code


class CoreEngine:
    def __init__(self, core_root=None):
        self.root = Path(core_root or os.environ.get("SAJU_CORE_ROOT", ROOT.parent / "Saju-Core-Engine")).resolve()
        expected = os.environ.get("SAJU_EXPECTED_SOURCE_SHA256", LOCK["sourceManifestSha256"])
        if expected != LOCK["sourceManifestSha256"]:
            raise RuntimeError("SAJU_EXPECTED_SOURCE_SHA256 differs from core-engine.lock.json")
        self.env = {**os.environ, "SAJU_CORE_ROOT": str(self.root), "SAJU_EXPECTED_SOURCE_SHA256": expected}
        self.env.pop('SAJU_API_TOKEN', None)
        self.slots = BoundedSemaphore(2)
        self.identity = self._run(verify=True)
        if self.identity["buildId"] != LOCK["buildId"]:
            raise RuntimeError("Core build differs from core-engine.lock.json")

    def _run(self, request=None, verify=False):
        command = [sys.executable, "-B", str(ROOT / "server/engine_worker.py")]
        if verify:
            command.append("--verify")
        try:
            process = subprocess.run(command, input=json.dumps(request, allow_nan=False),
                                     capture_output=True, text=True, encoding="utf-8",
                                     env=self.env, timeout=25, cwd=ROOT)
            if process.returncode:
                # Do not send paths, stderr or birth input to the client/logs.
                raise TransportError("503 Service Unavailable", "CORE_UNAVAILABLE")
            return json.loads(process.stdout)
        except subprocess.TimeoutExpired:
            raise TransportError("504 Gateway Timeout", "CORE_TIMEOUT") from None
        except (OSError, ValueError):
            raise TransportError("503 Service Unavailable", "CORE_UNAVAILABLE") from None

    def analyze(self, request):
        if not self.slots.acquire(blocking=False):
            raise TransportError("503 Service Unavailable", "CORE_BUSY")
        try:
            return self._run(request)
        finally:
            self.slots.release()


def create_app(engine=None, *, serve_static=False):
    # Only the explicit loopback preview bypasses server authentication.
    guard = None if serve_static else ApiGuard(os.environ.get('SAJU_API_TOKEN'))
    engine = engine or CoreEngine()
    dist = (ROOT / "dist").resolve()

    def application(environ, start_response):
        def respond(status, value, content_type="application/json; charset=utf-8", extra=()):
            body = value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
            headers = [("Content-Type", content_type), ("Content-Length", str(len(body))),
                       ("Cache-Control", "no-store"), ("X-Content-Type-Options", "nosniff"), *extra]
            start_response(status, headers)
            return [body]

        path, method = environ.get("PATH_INFO", ""), environ["REQUEST_METHOD"]
        try:
            if path == "/api/saju/v1/health" and method == "GET":
                return respond("200 OK", {"status": "ok", **({"engine": engine.identity} if serve_static else {})})
            if path == "/api/saju/v1/analyze":
                if method != "POST":
                    return respond("405 Method Not Allowed", {"error": {"code": "METHOD_NOT_ALLOWED"}}, extra=[("Allow", "POST")])
                if guard:
                    failure = guard.check(environ)
                    if failure:
                        status, code = failure
                        return respond(status, {"status":"error", "error":{"code":code}},
                                       extra=[("Retry-After", "60")] if code == 'RATE_LIMITED' else [])
                # Same-origin browser transport, without public cross-origin CORS.
                origin = environ.get("HTTP_ORIGIN")
                if origin:
                    try:
                        parsed = urlsplit(origin)
                    except ValueError:
                        raise TransportError("403 Forbidden", "ORIGIN_NOT_ALLOWED") from None
                    if parsed.scheme != environ["wsgi.url_scheme"] or parsed.netloc != environ.get("HTTP_HOST"):
                        raise TransportError("403 Forbidden", "ORIGIN_NOT_ALLOWED")
                if environ.get("CONTENT_TYPE", "").split(";")[0].strip().lower() != "application/json":
                    raise TransportError("415 Unsupported Media Type", "JSON_REQUIRED")
                try:
                    length = int(environ.get("CONTENT_LENGTH") or "0")
                except ValueError:
                    raise TransportError("400 Bad Request", "INVALID_JSON") from None
                if length > MAX_BODY_BYTES:
                    raise TransportError("413 Content Too Large", "REQUEST_TOO_LARGE")
                if length <= 0:
                    raise TransportError("400 Bad Request", "INVALID_JSON")
                try:
                    def invalid_constant(value):
                        raise ValueError(value)
                    request = json.loads(environ["wsgi.input"].read(length), parse_constant=invalid_constant)
                    pending = [(request, 0)]
                    while pending:
                        value, depth = pending.pop()
                        if depth > 32:
                            raise ValueError("JSON nesting limit exceeded")
                        if isinstance(value, dict):
                            pending.extend((item, depth + 1) for item in value.values())
                        elif isinstance(value, list):
                            pending.extend((item, depth + 1) for item in value)
                    # Reject overflows such as 1e999, lone surrogates and excessive nesting.
                    json.dumps(request, ensure_ascii=False, allow_nan=False).encode("utf-8")
                except (ValueError, UnicodeError, RecursionError):
                    raise TransportError("400 Bad Request", "INVALID_JSON") from None
                result = engine.analyze(request)
                status = "200 OK"
                if result["status"] == "error":
                    code = result["error"]["code"]
                    status = ("503 Service Unavailable" if code == "MODEL_CONFIG_MISMATCH" else
                              "500 Internal Server Error" if code == "INTERNAL_ERROR" else "422 Unprocessable Entity")
                # Return the entire engine response, including partial results/evidence.
                return respond(status, result, extra=[("X-Saju-Build-ID", engine.identity["buildId"])])
            if serve_static and method == "GET" and not path.startswith("/api/"):
                target = (dist / (path.lstrip("/") or "index.html")).resolve()
                if target.is_relative_to(dist) and target.is_file():
                    mime = "text/javascript" if target.suffix == ".js" else mimetypes.guess_type(target.name)[0] or "application/octet-stream"
                    return respond("200 OK", target.read_bytes(), mime)
            return respond("404 Not Found", {"error": {"code": "NOT_FOUND"}})
        except TransportError as error:
            return respond(error.status, {"status": "error", "error": {"code": error.code}})
    return application


class QuietHandler(WSGIRequestHandler):
    def log_message(self, format, *args):
        pass  # Never log request paths/query strings containing user data.


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    app = create_app(serve_static=True)
    with make_server("127.0.0.1", args.port, app, handler_class=QuietHandler) as server:
        print(f"Local preview: http://127.0.0.1:{args.port}/start.html", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
