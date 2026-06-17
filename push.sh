#!/bin/bash
# AerOS-PM — push backend to Apps Script
# Run this after editing Code.gs

CLASP=~/.npm-global/node_modules/.bin/clasp
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Pushing backend to Apps Script..."
cd "$DIR" && $CLASP push --force

if [ $? -eq 0 ]; then
  echo "✅ Done — changes are live."
else
  echo "❌ Push failed. Run: $CLASP login  (first time only)"
fi
