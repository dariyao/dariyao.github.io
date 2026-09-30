#!/usr/bin/env python3
"""Serve only the portfolio docs folder on loopback, with development reloads."""
from functools import partial
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / "docs"
RELOAD = b"""<script data-local-preview>
(() => {
  let version;
  const key = 'portfolio-preview-scroll:' + location.pathname;
  const saved = sessionStorage.getItem(key);
  if (saved !== null) {
    sessionStorage.removeItem(key);
    addEventListener('load', () => setTimeout(() => scrollTo(0, +saved), 250), {once:true});
  }
  async function check() {
    try {
      const response = await fetch('/__preview_version', {cache:'no-store'});
      const next = await response.text();
      if (version !== undefined && next !== version) {
        sessionStorage.setItem(key, String(scrollY));
        location.reload();
        return;
      }
      version = next;
    } catch (_) {}
    setTimeout(check, 900);
  }
  check();
})();
</script>"""


def version():
    files = sorted(p for p in ROOT.rglob("*") if p.is_file())
    state = [(str(p.relative_to(ROOT)), p.stat().st_mtime_ns, p.stat().st_size) for p in files]
    return sha256(json.dumps(state).encode()).hexdigest().encode()


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/__preview_version":
            payload = version()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        target = (ROOT / path.lstrip("/")).resolve()
        if not target.is_relative_to(ROOT) or any(part.startswith(".") for part in Path(path).parts):
            self.send_error(404)
            return
        if target.is_dir():
            target /= "index.html"
        if target.suffix == ".html" and target.is_file():
            payload = target.read_bytes().replace(b"</body>", RELOAD + b"</body>")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def do_HEAD(self):
        path = unquote(urlsplit(self.path).path)
        target = (ROOT / path.lstrip("/")).resolve()
        if not target.is_relative_to(ROOT) or any(part.startswith(".") for part in Path(path).parts):
            self.send_error(404)
            return
        super().do_HEAD()

    def log_message(self, format, *args):
        if args and "__preview_version" in str(args[0]):
            return
        super().log_message(format, *args)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f"Portfolio V2: http://127.0.0.1:{args.port}/", flush=True)
    print(f"Serving only: {ROOT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
