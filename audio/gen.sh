#!/bin/bash
# $1 = "file<TAB>text" (one full line from gen_list.tsv)
line="$1"
f="${line%%$'\t'*}"
t="${line#*$'\t'}"
out="done/$f"
[ -f "$out" ] && [ -s "$out" ] && { echo "SKIP $f"; exit 0; }
for attempt in 1 2 3; do
  if tts speak --text "$t" --voice avocado_v2:MAI_01 --output "$out" >/dev/null 2>&1 \
     && [ -s "$out" ]; then
    echo "OK $f"; exit 0
  fi
  sleep $((attempt * 10))
done
echo "FAIL $f"
exit 1
