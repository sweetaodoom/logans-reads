#!/usr/bin/env python3
"""Extract isolated short-vowel phonemes from TTS CVC source words.

For source words like 'at' (/ae/ + /t/): the vowel is the first long
high-energy region; the final stop is a short burst after an energy dip.
We find the first contiguous high-energy region >= 120ms and take it,
trimming edges, with short fades to avoid clicks.

Usage: extract_vowels.py <audio_dir>
Writes ph_a/e/i/o/u.mp3 next to the vow_*_src.mp3 files.
"""
import subprocess, sys, os
import numpy as np

SR = 16000
WIN = int(SR * 0.010)  # 10ms windows

def load_wav(path):
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
         "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32)

def rms_windows(x):
    n = len(x) // WIN
    x = x[: n * WIN].reshape(n, WIN)
    return np.sqrt((x ** 2).mean(axis=1) + 1e-12)

def extract(src, dst):
    x = load_wav(src)
    if len(x) < SR * 0.1:
        raise ValueError(f"too short: {src}")
    rms = rms_windows(x)
    thresh = rms.max() * 0.30
    above = rms > thresh
    # find contiguous runs
    runs = []
    start = None
    for i, a in enumerate(above):
        if a and start is None:
            start = i
        elif not a and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(above)))
    # first run >= 120ms (12 windows) is the vowel
    vowel = next(((s, e) for s, e in runs if (e - s) >= 12), None)
    if vowel is None:
        # fallback: loudest 250ms region
        w = 25
        idx = max(range(len(rms) - w), key=lambda i: rms[i:i + w].sum())
        vowel = (idx, idx + w)
    s, e = vowel
    # trim 20ms each edge, cap at 400ms
    s = min(s + 2, e)
    e = max(s, e - 2)
    if (e - s) > 40:
        e = s + 40
    seg = x[s * WIN: e * WIN].copy()
    # 10ms fades
    f = int(SR * 0.010)
    if len(seg) > 2 * f:
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
    dur = len(seg) / SR
    tmp = dst + ".tmp.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR),
         "-ac", "1", "-i", "-", "-ar", "44100", tmp],
        input=seg.tobytes(), check=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", tmp,
         "-codec:a", "libmp3lame", "-b:a", "96k", dst], check=True)
    os.remove(tmp)
    return dur

def main():
    d = sys.argv[1]
    mapping = {"a": "vow_a_src.mp3", "e": "vow_e_src.mp3", "i": "vow_i_src.mp3",
               "o": "vow_o_src.mp3", "u": "vow_u_src.mp3"}
    ok = True
    for vowel, src_name in mapping.items():
        src = os.path.join(d, src_name)
        dst = os.path.join(d, f"ph_{vowel}.mp3")
        if not os.path.exists(src):
            print(f"SKIP {vowel}: source missing")
            ok = False
            continue
        dur = extract(src, dst)
        flag = "OK " if 0.12 <= dur <= 0.45 else "CHECK"
        print(f"{flag} ph_{vowel}.mp3 duration={dur:.3f}s")
        if not (0.12 <= dur <= 0.45):
            ok = False
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
