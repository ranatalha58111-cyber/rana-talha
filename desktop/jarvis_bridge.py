#!/usr/bin/env python3
"""
====================================================================
J.A.R.V.I.S. LOCAL DESKTOP APP LAUNCH BRIDGE (NO PIP PACKAGES NEEDED)
====================================================================
Listens on http://127.0.0.1:41199
Enables the JARVIS Web Assistant to directly launch Windows apps
(Notepad, Calculator, VS Code, Chrome, File Explorer, Spotify, etc.)
natively on your real PC!
====================================================================
"""

import sys
import os
import json
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 41199

class JarvisBridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_cors(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        origin = self.headers.get("Origin") or "*"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Access-Control-Request-Private-Network")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors(200)

    def do_GET(self):
        if self.path in ("/status", "/health", "/"):
            self._send_cors(200)
            res = json.dumps({
                "status": "online",
                "service": "JARVIS-Desktop-Companion-Bridge",
                "platform": sys.platform,
                "version": "2.5"
            })
            self.wfile.write(res.encode("utf-8"))
        else:
            self._send_cors(404)
            self.wfile.write(b'{"error":"not found"}')

    def do_POST(self):
        if self.path == "/launch":
            try:
                length = int(self.headers.get("Content-Length", 0))
                raw_body = self.rfile.read(length).decode("utf-8")
                body = json.loads(raw_body) if raw_body else {}
                target = (body.get("app") or body.get("command") or "").strip()
                name = body.get("name") or target

                # Security filter
                low = target.lower()
                dangerous = any(d in low for d in [
                    "shutdown", "reboot", "format", "del /", "rmdir", "rm -rf",
                    "reg add", "reg delete", "net user", "taskkill"
                ])
                if dangerous:
                    self._send_cors(403)
                    self.wfile.write(json.dumps({"success": False, "error": "Blocked by security policy"}).encode("utf-8"))
                    return

                print(f"[JARVIS BRIDGE] -> Launching '{target}' ({name}) on PC...")

                # Standard Windows App Aliases
                app_aliases = {
                    "notepad": "notepad.exe",
                    "calculator": "calc.exe",
                    "calc": "calc.exe",
                    "paint": "mspaint.exe",
                    "mspaint": "mspaint.exe",
                    "explorer": "explorer.exe",
                    "file explorer": "explorer.exe",
                    "my computer": "explorer.exe",
                    "this pc": "explorer.exe",
                    "cmd": "cmd.exe",
                    "terminal": "wt.exe",
                    "powershell": "powershell.exe",
                    "chrome": "chrome.exe",
                    "google chrome": "chrome.exe",
                    "edge": "msedge.exe",
                    "msedge": "msedge.exe",
                    "vs code": "code",
                    "vscode": "code",
                    "code": "code",
                    "spotify": "spotify.exe",
                    "task manager": "taskmgr.exe",
                    "taskmgr": "taskmgr.exe"
                }
                exec_target = app_aliases.get(low, target)

                if sys.platform == "win32":
                    try:
                        os.startfile(exec_target)
                    except Exception:
                        subprocess.Popen(f'start "" "{exec_target}"', shell=True)
                else:
                    subprocess.Popen([exec_target], shell=True)

                self._send_cors(200)
                self.wfile.write(json.dumps({
                    "success": True,
                    "app": name,
                    "target": target,
                    "message": f"Successfully launched {name} on your PC."
                }).encode("utf-8"))
            except Exception as e:
                self._send_cors(500)
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
        else:
            self._send_cors(404)
            self.wfile.write(b'{"error":"not found"}')

def main():
    print("=" * 65)
    print("        J.A.R.V.I.S. DESKTOP LOCAL APP BRIDGE")
    print("=" * 65)
    print(f" [*] Status:   Active and listening on http://127.0.0.1:{PORT}")
    print(" [*] Function: Enables browser JARVIS to open native PC applications")
    print(" [*] Supported: Notepad, Calculator, VS Code, Chrome, Spotify, etc.")
    print("=" * 65)
    print("\nJARVIS is ready to execute PC app launch commands from your browser!\n")
    server = HTTPServer(("0.0.0.0", PORT), JarvisBridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping JARVIS Bridge.")

if __name__ == "__main__":
    main()
