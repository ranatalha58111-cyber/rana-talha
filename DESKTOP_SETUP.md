# 🛡️ JARVIS - Windows Desktop & Real PC App Launcher Setup Guide
*(Roman Urdu & English Beginner-Friendly Guide)*

Yeh guide aapko batati hai ke JARVIS ko apne **Windows PC par Electron ke zariye kaise chalayein**, real applications (Notepad, Chrome, Calculator, VS Code, etc.) kaise launch karein, aur naye apps ko Allow-List mein kaise add karein.

---

## ⚡ Quick Start (Sirf 3 Steps)

### Step 1: Requirements
Aapke Windows 10 / 11 PC par yeh cheezein installed honi chahiye:
1. **Node.js (v18 ya latest)**: [https://nodejs.org](https://nodejs.org) se download karein.
2. Project ko download ya clone karein apne folder mein.

### Step 2: Dependencies Install Karein
Apne project folder mein Command Prompt (CMD) ya PowerShell kholen aur yeh command chalayein:

```bash
npm install
```

*(Agar aapne pehle se `.env` nahi banaya, toh `.env.example` ko copy karke `.env` banayein aur apna `GEMINI_API_KEY` daalein).*

### Step 3: Electron Desktop App Run Karein

```bash
npm run electron
```
*Ya phir:*
```bash
npx electron desktop/main.cjs
```

🎉 **Mubarak ho!** JARVIS ab aapke Windows desktop par ek native software ki tarah khul jayega, aur global hotkey `Ctrl+Shift+J` se background se toggle ho sakega.

---

## 🚀 Real PC Par Apps Launch Kaise Karein?

Jab JARVIS Electron mode mein run ho raha ho, aap voice se ya chat box mein type karke bolein:

- **"Jarvis, open Notepad"** *(Notepad foran aapki screen par khul jayega)*
- **"Launch Google Chrome"** *(Chrome browser launch hoga)*
- **"Calculator open karo"** *(Windows Calculator pop-up ho jayega)*
- **"Open VS Code"** *(Visual Studio Code open hoga)*
- **"Open File Explorer"** *(This PC / Windows Explorer khulega)*
- **"Launch Terminal"** *(Windows Terminal start hoga)*

Electron ka secure detached process runner (`desktop/appLauncher.cjs`) application ko independently background mein spawn karta hai taake JARVIS smoothly chalta rahe.

---

## 🛡️ Security Barrier (Aapka PC 100% Mehfooz Hai)

Humne double-layer security firewall lagaya hai (Server + Electron levels par):

### 🚫 Permanently Blocked Commands (Hard Block)
Koi bhi dangerous, administrative ya destructive action **strictly block** hai:
1. **Shutdown / Restart / Sleep / Hibernate**: `shutdown`, `reboot`, `stop-computer`, `rundll32 powrprof.dll` etc.
2. **File Deletion & Storage Erasure**: `del`, `rmdir`, `format`, `rm -rf`, `erase` etc.
3. **Privilege Escalation & Accounts**: `runas`, `net user`, `net localgroup`, `reg add`, `bcdedit`, `diskpart` etc.

Chahe user ghalati se bole ya AI hallucinate kare, JARVIS ka firewall inhein block karke `SECURITY_BLOCKED` alert return karta hai.

### 🛑 Unknown Apps Auto-Rejection
Agar koi unlisted ya unknown software launch karne ki request aayegi (e.g. `unknown_file.exe`), JARVIS usay reject karega:
> *"Application is not present in authorized allow-list. Execution rejected."*

---

## ➕ Future Mein Naye Apps Kaise Add Karein? (1-Minute Guide)

Naye apps add karna intehai aasan hai! Aapko koi code badalne ki zaroorat nahi hai.

1. File kholen: `desktop/allowList.json`
2. `"apps"` list mein ek naya object add karein:

```json
{
  "id": "photoshop",
  "name": "Adobe Photoshop",
  "aliases": ["photoshop", "ps", "adobe photoshop"],
  "command": "photoshop.exe",
  "category": "creativity",
  "description": "Professional photo and graphic editing"
}
```

### Parameters ki wazahat:
- **`id`**: Unique chhota naam (e.g. `"spotify"`, `"vlc"`).
- **`name`**: Screen par dikhne wala mukammal naam.
- **`aliases`**: Wo alfaaz ya nicknames jo user bol ya type kar sakta hai (e.g. `["ps", "photoshop"]`).
- **`command`**: Windows executable command ya path (e.g. `"notepad.exe"`, `"calc.exe"`, `"code"`).
- **`category`**: Category (e.g. `"tools"`, `"browsers"`, `"media"`, `"utilities"`).

File save karein, aur JARVIS foran nayi app ko recognize karna shuru kar dega!

---

## 📂 Desktop Architecture Summary

- **`desktop/main.cjs`**: Electron main window, global shortcuts (`Ctrl+Shift+J`), tray lifecycle, aur IPC bridge.
- **`desktop/preload.cjs`**: Context-isolated secure bridge (`window.electronAPI.launchApp`, `getAllowedApps`).
- **`desktop/appLauncher.cjs`**: Electron-side security validator aur detached process spawner.
- **`desktop/allowList.json`**: Central source of truth for authorized applications.
- **`server/tools/appAllowList.ts`**: Server-side security evaluator and alias matcher.
- **`server/tools/windowsAutomation.ts`**: AI Studio tool integration for Gemini / assistant automation.

Aapka system ready hai! 🚀
