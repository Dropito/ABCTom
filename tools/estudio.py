#!/usr/bin/env python3
"""Estúdio de gravação no Mac.

Serve o app em http://localhost:3003/?estudio e recebe as gravações do navegador,
convertendo cada uma para AAC (audio/<id>.m4a) com o afconvert do macOS e mantendo
audio/index.json atualizado. Depois é só publicar (git push) para as vozes irem ao iPad.

Uso:  python3 tools/estudio.py
"""
import json
import os
import re
import subprocess
import tempfile
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'audio')
INDEX = os.path.join(AUDIO, 'index.json')
PORT = 3003
ID_RE = re.compile(r'^[A-Za-z0-9_]{2,40}$')


def load_index():
    try:
        with open(INDEX) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_index(idx):
    os.makedirs(AUDIO, exist_ok=True)
    with open(INDEX, 'w') as f:
        json.dump(dict(sorted(idx.items())), f, indent=1, ensure_ascii=False)
        f.write('\n')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith('/api/ping'):
            return self._json(200, {'ok': True})
        return super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        clip = (parse_qs(url.query).get('id') or [''])[0]
        if not ID_RE.match(clip):
            return self._json(400, {'error': 'id inválido'})
        idx = load_index()
        if url.path == '/api/delete':
            idx.pop(clip, None)
            try:
                os.remove(os.path.join(AUDIO, clip + '.m4a'))
            except FileNotFoundError:
                pass
            save_index(idx)
            return self._json(200, {'ok': True})
        if url.path == '/api/raw':
            # Cópia bruta (sem corte) só para diagnóstico; fica fora do git.
            size = int(self.headers.get('Content-Length', 0))
            raw_dir = os.path.join(AUDIO, '_raw')
            os.makedirs(raw_dir, exist_ok=True)
            ext = 'webm' if 'webm' in (self.headers.get('Content-Type') or '') else 'm4a'
            with open(os.path.join(raw_dir, f'{clip}.{ext}'), 'wb') as f:
                f.write(self.rfile.read(size))
            return self._json(200, {'ok': True})
        if url.path != '/api/save':
            return self._json(404, {'error': 'rota desconhecida'})
        size = int(self.headers.get('Content-Length', 0))
        if not 44 < size < 5_000_000:
            return self._json(400, {'error': 'tamanho inválido'})
        data = self.rfile.read(size)
        os.makedirs(AUDIO, exist_ok=True)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp.write(data)
        out = os.path.join(AUDIO, clip + '.m4a')
        try:
            subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', tmp.name, out],
                           check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            return self._json(500, {'error': e.stderr.decode(errors='ignore')})
        finally:
            os.unlink(tmp.name)
        idx[clip] = int(time.time())
        save_index(idx)
        print(f'  gravado {clip}.m4a ({os.path.getsize(out) // 1024} KB) — total {len(idx)}')
        return self._json(200, {'ok': True, 'v': idx[clip]})


if __name__ == '__main__':
    print(f'Estúdio: abra http://localhost:{PORT}/?estudio no Safari ou Chrome do Mac')
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
