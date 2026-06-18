#!/bin/bash
# AerOS-PM — push backend to Apps Script and redeploy web app

CLASP=~/.npm-global/node_modules/.bin/clasp
DEPLOY_ID="AKfycbx-twUE6SK_8QZ2f5hQwgvwOVCpLN53UH31Hwt8HqWMP4LLf1dLmpfeY6fDi7v5Z7C44A"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Pushing backend to Apps Script..."
cd "$DIR" && $CLASP push --force

if [ $? -ne 0 ]; then
  echo "❌ Push failed. Run: $CLASP login  (first time only)"
  exit 1
fi

echo "▶ Redeploying web app..."
$CLASP deploy --deploymentId "$DEPLOY_ID" --description "auto-deploy $(date '+%Y-%m-%d %H:%M')"

if [ $? -eq 0 ]; then
  echo "✅ Done — backend and web app are live."
else
  echo "❌ Redeploy failed."
fi
