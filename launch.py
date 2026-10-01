# coding: utf-8
"""Local-only launcher; uses a fixed origin so browser storage stays consistent."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import urllib.request
import webbrowser
import sys

ROOT = Path(__file__).resolve().parent
URL = 'http://127.0.0.1:8765/'
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def list_directory(self, path):
        self.send_error(404)
        return None

try:
    server = ThreadingHTTPServer(('127.0.0.1', 8765), partial(Handler, directory=str(ROOT)))
except OSError:
    try:
        with urllib.request.urlopen(URL, timeout=2) as r:
            existing = r.read(30000).decode('utf-8')
        if 'ねむりの食材手帳' not in existing:
            raise RuntimeError('別のアプリがこのアドレスを使用しています。')
        webbrowser.open(URL)
        print('すでに起動している食材手帳を開きました。')
        sys.exit(0)
    except Exception:
        print('起動できませんでした。ポート8765を使用しているアプリを確認してください。')
        input('Enterで閉じます。')
        sys.exit(1)
print('ねむりの食材手帳を起動しました。\n' + URL)
print('この画面を閉じるとアプリの配信を終了します。保存済みの記録はブラウザに残ります。')
webbrowser.open(URL)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
