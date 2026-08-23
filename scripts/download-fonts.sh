#!/usr/bin/env bash
# Download Fontshare fonts as self-hosted woff2 for the portfolio's type system.
#
# Type system (each role has a distinct voice — modern-minimalist):
#   Switzer   400-700   → body / UI            (replaces General Sans)
#   Tanker    400       → HERO signature        (requested)
#   Cabinet Grotesk     → display workhorse: marquees, card titles, nav, loading
#   Comico    400       → moving marquee strips (playful handwriting/comic)
#   Bevellier 600/700   → section H2s + WhatIDo mega rows (display signature)
#   Zodiak    700 italic→ editorial serif accent for hover-reveal labels
#
# Source: the Fontshare catalog endpoint (api.fontshare.com/v2/fonts) is NOT
# rate-limited (unlike the /v2/css API), and each style's `file` path points
# straight at the CDN woff2. We append ".woff2" to that path.
set -euo pipefail

DIR="$(dirname "$0")/../public/fonts"
mkdir -p "$DIR"
CATALOG=/tmp/fontshare-fonts.json

echo "Fetching Fontshare catalog..."
curl -sL "https://api.fontshare.com/v2/fonts" -o "$CATALOG"

python3 - "$CATALOG" "$DIR" <<'PY'
import json, os, sys, urllib.request

catalog_path, outdir = sys.argv[1], sys.argv[2]
fonts = json.load(open(catalog_path))["fonts"]

# family -> list of (weight, italic)
WANT = {
    "Switzer":     [(400, False), (500, False), (600, False), (700, False)],
    "Tanker":      [(400, False)],
    "Cabinet Grotesk": [(400, False), (500, False), (700, False), (800, False), (900, False)],
    "Comico":      [(400, False)],
    "Chillax":     [(600, False)],
    "Bevellier":   [(600, False), (700, False)],
    "Zodiak":      [(700, True)],  # Bold Italic (Fontshare internal 701 -> CSS 700)
}

# File-name override: fonts that ship under a single style use the style name
# (e.g. "Tanker-Regular", "Comico-Regular"), and layout.tsx references those
# exact filenames.
FILENAME = {"Tanker": "Tanker-Regular", "Comico": "Comico-Regular"}

by_name = {f["name"]: f for f in fonts}

def hdr():
    return {"User-Agent": "Mozilla/5.0"}

for family, weights in WANT.items():
    entry = by_name.get(family)
    if not entry:
        print(f"!! family not in catalog: {family}")
        continue
    for weight, italic in weights:
        found = None
        for s in entry["styles"]:
            if s.get("is_italic") == italic:
                num = s.get("weight", {}).get("number")
                # Zodiak-family italics use weight+1 (400->401, 700->701)
                if (not italic and num == weight) or (italic and num == weight + 1):
                    found = s
                    break
        if found is None and italic:
            # fallback: pick any italic style close to the target weight
            for s in entry["styles"]:
                if s.get("is_italic"):
                    num = s.get("weight", {}).get("number")
                    if abs((num - 1) - weight) <= 200:
                        found = s
                        break
        if found is None:
            print(f"  !! no style for {family} {weight}{'i' if italic else ''}")
            continue
        url = "https:" + found["file"] + ".woff2"
        base = FILENAME.get(family)
        if base:
            # Explicit filename (e.g. Tanker -> Tanker-Regular); no weight suffix.
            fn = os.path.join(outdir, f"{base}.woff2")
        else:
            base = family.replace(" ", "")
            suffix = "i" if italic else ""
            fn = os.path.join(outdir, f"{base}-{weight}{suffix}.woff2")
        try:
            req = urllib.request.Request(url, headers=hdr())
            with urllib.request.urlopen(req, timeout=60) as r, open(fn, "wb") as out:
                out.write(r.read())
            print(f"  OK {os.path.basename(fn)} ({os.path.getsize(fn)} bytes)")
        except Exception as e:
            print(f"  ERR {family} {weight}{suffix}: {e}")
print("Done.")
PY

echo "Download complete."
