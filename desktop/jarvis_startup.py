import os
import sys
import time
import subprocess
import webbrowser

def play_sound_and_start():
    print("======================================================================")
    print("             J.A.R.V.I.S. SYSTEM INITIALIZATION ROUTINE             ")
    print("======================================================================")
    print(" [+] Arc Reactor Core: ONLINE")
    print(" [+] Initializing Audio Cue...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    wav_path = os.path.join(script_dir, "jarvis-startup.wav")
    
    try:
        if sys.platform == "win32":
            import winsound
            if os.path.exists(wav_path):
                winsound.PlaySound(wav_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        elif sys.platform == "darwin":
            if os.path.exists(wav_path):
                subprocess.run(["afplay", wav_path], check=False)
        else:
            if os.path.exists(wav_path):
                subprocess.run(["aplay", wav_path], check=False)
    except Exception as e:
        print(f" Audio notice: {e}")

    time.sleep(1.5)
    print(" [+] Status: Online and ready, Sir. All systems operational.")
    print("======================================================================")
    webbrowser.open("http://localhost:3000")

if __name__ == "__main__":
    play_sound_and_start()
