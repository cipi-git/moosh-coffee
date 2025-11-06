#!/usr/bin/env bash
set -euo pipefail

PAGES_DIR="src/content/pages"
mkdir -p "$PAGES_DIR"

echo "Scanning *.html for data-page…"
# Caută toate fișierele .html (exclus admin)
mapfile -t HTMLS < <(git ls-files "*.html" | grep -v "^admin/")

created=0
for f in "${HTMLS[@]}"; do
  # extrage data-page; dacă lipsește, deduce din numele fișierului
  key=$(grep -oE '<body[^>]*data-page="[^"]+"' "$f" | head -n1 | sed -E 's/.*data-page="([^"]+)".*/\1/')
  if [[ -z "${key:-}" ]]; then
    base="$(basename "$f" .html)"
    [[ "$base" == "index" ]] && key="home" || key="$base"
  fi

  json="$PAGES_DIR/$key.json"
  if [[ ! -f "$json" ]]; then
    cat > "$json" <<JSON
{
  "seo": { "title": "" },
  "hero": {
    "title": "",
    "subtitle": "",
    "image": "",
    "bg": ""
  },
  "title": "",
  "subtitle": "",
  "body": ""
}
JSON
    echo "Created: $json"
    created=$((created+1))
  fi
done

echo "Done. New files: $created"
