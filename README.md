# AerOS-PM

Project management system built on Google Sheets + Apps Script, served via GitHub Pages.

## Architecture

```
GitHub repo (this)
├── index.html      → Dashboard UI (served via GitHub Pages)
├── Code.gs         → Apps Script backend logic
└── appsscript.json → Apps Script manifest

Google Drive
├── AerOS-PM Sheet  → Database (38 tabs)
├── attachments/    → File uploads
└── media/          → Video project folders
```

## Dashboard URL

**https://YOUR-USERNAME.github.io/aeros-pm**

## Backend URL (Apps Script)

https://script.google.com/macros/s/AKfycbx-twUE6SK_8QZ2f5hQwgvwOVCpLN53UH31Hwt8HqWMP4LLf1dLmpfeY6fDi7v5Z7C44A/exec

## Updating the Dashboard (frontend)

```bash
# Edit index.html, then:
git add index.html
git commit -m "update dashboard"
git push
# GitHub Pages auto-deploys in ~30 seconds
```

## Updating the Backend (Apps Script)

```bash
# Edit Code.gs, then:
clasp push
# Changes are live immediately — no redeployment needed for logic changes
# Only redeploy if you change appsscript.json (webapp settings)
```

## First-Time Setup

### 1. Enable GitHub Pages
- Go to repo Settings → Pages
- Source: Deploy from branch → `main` → `/ (root)`
- Save → your URL will be `https://YOUR-USERNAME.github.io/aeros-pm`

### 2. Set up clasp (to push backend changes)
```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json
# Edit .clasp.json and paste your Apps Script ID
clasp push
```

### 3. Run initSheet() once
- Open [script.google.com](https://script.google.com)
- Open your AerOS-PM project
- Run `initSheet` function once to create all 38 Sheet tabs

### 4. Open the dashboard
Visit your GitHub Pages URL or the Apps Script web app URL directly.
