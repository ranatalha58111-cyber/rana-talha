#!/usr/bin/env python3
"""
====================================================================
J.A.R.V.I.S. BACKGROUND VOICE DAEMON (ALWAYS-LISTENING PC SERVICE)
====================================================================
Runs continuously in the background on your Windows PC.
Listens 24/7 for:
  - "Jarvis yeh kaam karo [your command]"
  - "Jarvis yeh akm karo [your command]"
  - "Jarvis ye kaam karo [your command]"
  - "Hey Jarvis [your command]"
  - "Jarvis [your command]"

When activated:
1. Plays tactical confirmation chime
2. Sends the command to your JARVIS Core API
3. Launches authorized Windows apps locally (Chrome, YouTube, Spotify, Notepad, VS Code, etc.)
4. Speaks the intelligence reply through your speakers using Windows Neural TTS
5. Returns immediately to silent background listening
====================================================================
"""

import sys
import os
import json
import time
import re
import urllib.request
import urllib.parse
import subprocess
import webbrowser
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")

# Default settings
DEFAULT_SERVER_URL = "http://localhost:3000"
config = {
    "server_url": DEFAULT_SERVER_URL,
    "wake_phrases": [
        "jarvis yeh kaam karo",
        "jarvis yeh akm karo",
        "jarvis ye kaam karo",
        "jarvis ye kam karo",
        "jarvis kaam karo",
        "jarvis suno",
        "hey jarvis",
        "jarvis",
    ],
    "sound_effects": True,
    "speech_rate": 185,
    "language": "AUTO"
}

# Load user config if exists
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            user_config = json.load(f)
            config.update(user_config)
    except Exception as e:
        print(f"[!] Notice loading config.json: {e}")

SERVER_URL = config.get("server_url", DEFAULT_SERVER_URL).rstrip("/")

# -------------------------------------------------------------
# LOCAL DESKTOP HTTP BRIDGE (Listens on 127.0.0.1:41199)
# Allows the JARVIS Web App to natively launch Windows apps directly!
# -------------------------------------------------------------
class JarvisLocalBridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress excessive HTTP log output

    def _send_cors(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors(204)

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

                print(f"[BRIDGE] Launching application on PC: '{target}' ({name})")
                if sys.platform == "win32":
                    try:
                        os.startfile(target)
                    except Exception:
                        subprocess.Popen(f'start "" "{target}"', shell=True)
                else:
                    subprocess.Popen([target], shell=True)

                self._send_cors(200)
                self.wfile.write(json.dumps({
                    "success": True,
                    "app": name,
                    "target": target,
                    "message": f"Successfully launched {name} natively."
                }).encode("utf-8"))
            except Exception as e:
                self._send_cors(500)
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
        else:
            self._send_cors(404)
            self.wfile.write(b'{"error":"not found"}')

def start_local_bridge():
    try:
        bridge_server = HTTPServer(("127.0.0.1", 41199), JarvisLocalBridgeHandler)
        print("[✓] JARVIS Local Desktop Bridge running on http://127.0.0.1:41199")
        bridge_server.serve_forever()
    except Exception as err:
        print(f"[!] Local bridge server notice: {err}")

threading.Thread(target=start_local_bridge, daemon=True).start()

# Windows SAPI5 Speech Engine (Built-in to 100% of Windows PCs, no extra pip packages required!)
tts_engine = None
def speak(text: str):
    """Speaks text using Windows built-in SAPI5 or pyttsx3."""
    if not text:
        return
    clean_text = re.sub(r'[*_#`\[\]]', '', text)
    print(f"\n[JARVIS VOICE]: {clean_text}\n")

    def _speak_thread():
        try:
            # Try pyttsx3 if installed
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty('rate', config.get('speech_rate', 185))
            engine.say(clean_text)
            engine.runAndWait()
            return
        except Exception:
            pass

        try:
            # Try Windows native PowerShell SpeechSynthesizer (100% built into Windows)
            escaped_text = clean_text.replace('"', '""').replace("'", "''")
            ps_cmd = f"Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = 1; $synth.Speak('{escaped_text}')"
            subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_cmd], capture_output=True)
            return
        except Exception as e:
            print(f"[!] TTS output fallback: {e}")

    threading.Thread(target=_speak_thread, daemon=True).start()

def play_chime(freq=1200, duration_ms=120):
    """Plays an instant audible acknowledgment beep."""
    if not config.get("sound_effects", True):
        return
    try:
        if sys.platform == "win32":
            import winsound
            winsound.Beep(freq, duration_ms)
        else:
            print("\a", end="", flush=True)
    except Exception:
        pass

def send_chat_to_jarvis(command_text: str):
    """Sends voice transcript to the JARVIS Core Server."""
    api_url = f"{SERVER_URL}/api/chat"
    payload = {
        "message": command_text,
        "language": config.get("language", "AUTO"),
        "model": "gemini",
        "userName": "Commander"
    }

    try:
        data_json = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            api_url,
            data=data_json,
            headers={"Content-Type": "application/json", "User-Agent": "JARVIS-Background-Listener/2.5"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body)
    except Exception as err:
        print(f"[!] Communication notice with {api_url}: {err}")
        return None

def execute_desktop_action(command_lower: str, reply_data: dict = None):
    """Executes verified desktop actions locally on the PC."""
    handled = False

    # Check side effects from server first
    if reply_data and "sideEffects" in reply_data:
        for eff in reply_data.get("sideEffects", []):
            eff_type = eff.get("type")
            if eff_type == "APP_LAUNCH":
                app_cmd = eff.get("app", {}).get("command") or eff.get("target")
                if app_cmd:
                    try:
                        print(f"[*] Launching authorized app: {app_cmd}")
                        if sys.platform == "win32":
                            os.startfile(app_cmd)
                        else:
                            subprocess.Popen([app_cmd], shell=True)
                        handled = True
                    except Exception as ex:
                        print(f"[!] App launch notice: {ex}")
            elif eff_type == "URL_OPEN":
                target_url = eff.get("url")
                if target_url:
                    print(f"[*] Opening browser URL: {target_url}")
                    webbrowser.open(target_url)
                    handled = True

    # Fallback local pattern detection if offline or direct command
    if not handled:
        # Chrome
        if "chrome" in command_lower:
            webbrowser.open("https://www.google.com")
            handled = True
        # YouTube
        elif "youtube" in command_lower:
            match = re.search(r'(?:search|play|dhundho|chalao)\s+(?:on\s+youtube|youtube\s+par)?\s*(.*)', command_lower)
            query = match.group(1).replace("youtube", "").strip() if match else ""
            if query:
                webbrowser.open(f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}")
            else:
                webbrowser.open("https://www.youtube.com")
            handled = True
        # Spotify
        elif "spotify" in command_lower or "gana" in command_lower or "song" in command_lower:
            webbrowser.open("https://open.spotify.com")
            handled = True
        # Calculator
        elif "calculator" in command_lower or "calc" in command_lower:
            if sys.platform == "win32":
                os.system("start calc.exe")
            handled = True
        # Notepad
        elif "notepad" in command_lower or "notes" in command_lower:
            if sys.platform == "win32":
                os.system("start notepad.exe")
            handled = True
        # VS Code
        elif "vs code" in command_lower or "vscode" in command_lower:
            if sys.platform == "win32":
                os.system("start code")
            handled = True

    return handled

def process_recognized_speech(text: str):
    """Analyzes recognized speech for wake words and handles command execution."""
    raw = text.strip()
    if not raw:
        return

    lower = raw.lower()
    print(f"[HEARD]: \"{raw}\"")

    # Check wake word patterns:
    # 1. "jarvis yeh kaam karo [command]"
    # 2. "jarvis yeh akm karo [command]"
    # 3. "jarvis ye kaam karo [command]"
    # 4. "hey jarvis [command]"
    # 5. "jarvis [command]"
    wake_regex = r'^(?:hey\s+|hi\s+|ok\s+|suno\s+|oye\s+)?(?:jarvis|gravis|garvis)(?:\s+(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo|ye\s+kam\s+karo|kaam\s+karo|akm\s+karo))?(?:[,\s.!?]+(.*)|$)'
    match = re.search(wake_regex, lower, re.IGNORECASE)

    is_wake = False
    command = ""

    if match:
        is_wake = True
        command = (match.group(1) or "").strip()
    elif "yeh kaam karo" in lower or "yeh akm karo" in lower or "ye kaam karo" in lower:
        is_wake = True
        command = re.sub(r'.*?(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo|ye\s+kam\s+karo)\s*', '', lower).strip()

    if not is_wake:
        return

    print("\n" + "="*50)
    print(f"[!] WAKE TRIGGER DETECTED! -> Command: \"{command}\"")
    print("="*50)
    play_chime(1400, 100)
    play_chime(1800, 150)

    # If the user only said "Jarvis yeh kaam karo" with no command yet:
    if not command:
        speak("Ji sir, main sun raha hoon. Farmayein kya kaam karna hai?")
        return

    # Send command to JARVIS Core
    print(f"[*] Processing command via JARVIS Core ({SERVER_URL})...")
    res = send_chat_to_jarvis(command)

    if res and "reply" in res:
        reply_text = res["reply"]
        execute_desktop_action(command, res)
        speak(reply_text)
    else:
        # Local execution fallback
        handled = execute_desktop_action(command)
        if handled:
            speak("Command executed on your desktop, sir.")
        else:
            speak("I received your command, sir. Processing request.")

def main_listen_loop():
    """Main continuous listening loop utilizing speech_recognition."""
    try:
        import speech_recognition as sr
    except ImportError:
        print("[!] Package 'SpeechRecognition' is required.")
        print("[*] Automatically installing speech_recognition & pyaudio...")
        subprocess.run([sys.executable, "-m", "pip", "install", "speechrecognition", "pyaudio", "requests", "pyttsx3"], check=False)
        try:
            import speech_recognition as sr
        except ImportError:
            print("\n[CRITICAL] Please run: pip install speechrecognition pyaudio requests pyttsx3\n")
            sys.exit(1)

    r = sr.Recognizer()
    r.dynamic_energy_threshold = True
    r.energy_threshold = 400
    r.pause_threshold = 0.8

    try:
        mic = sr.Microphone()
    except Exception as e:
        print(f"[CRITICAL] Microphone access error: {e}")
        print("Please verify your microphone is plugged in and allowed in Windows Settings.")
        return

    print("\n" + "#"*60)
    print("      J.A.R.V.I.S. BACKGROUND LISTENER - ACTIVE")
    print("#"*60)
    print(f"[*] Server URL:       {SERVER_URL}")
    print("[*] Always Listening: YES (24/7 background mode)")
    print("[*] Wake Phrases:")
    print("    -> \"Jarvis yeh kaam karo [your command]\"")
    print("    -> \"Jarvis yeh akm karo [your command]\"")
    print("    -> \"Hey Jarvis [your command]\"")
    print("[*] Desktop Control:  Chrome, YouTube, Spotify, VS Code, Calculator, Tavily")
    print("[*] To minimize:     Run 'run_silent_background.vbs'")
    print("#"*60 + "\n")

    speak("Jarvis background voice system is online, sir. Always listening.")

    print("[*] Calibrating microphone for ambient room noise (2 seconds)...")
    with mic as source:
        r.adjust_for_ambient_noise(source, duration=2)
    print("[✓] Ambient noise calibration complete. LISTENING NOW...\n")

    while True:
        try:
            with mic as source:
                audio = r.listen(source, phrase_time_limit=10)
            
            try:
                # Use Google Speech Recognition engine (free, highly accurate for Urdu, Hindi, English)
                recognized_text = r.recognize_google(audio)
                process_recognized_speech(recognized_text)
            except sr.UnknownValueError:
                pass # Silent background loop
            except sr.RequestError as e:
                print(f"[!] Speech recognition service notice: {e}")
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[*] Shutting down JARVIS background listener.")
            break
        except Exception as loop_err:
            print(f"[!] Listener loop exception: {loop_err}")
            time.sleep(1)

if __name__ == "__main__":
    main_listen_loop()
