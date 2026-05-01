# Sideways Text

A tiny React + Vite app that converts alphanumeric text into "sideways" / Unicode-mapped text.

How it works

- Edit the left textarea to type input text.
- The right textarea shows the converted output (read-only) and updates automatically.
- The character mappings are controlled in source at `src/mappings.json`. There is no editable mapping UI — change the JSON file and rebuild to change mappings.

Run locally

```bash
cd sideways-react
npm install
npm run dev
```

Build

```bash
npm run build
```

Files changed

- `index.html` — updated title and meta tags for SEO.
- `src/App.jsx` — replaced boilerplate with converter UI and logic.
- `src/index.css` — simplified styling for the converter layout.
- `README.md` — quick instructions.

Notes

Notes

- Mappings live in `src/mappings.json`. There are two top-level keys: `upsideDown` and `sideways`.
- To change mappings, edit `src/mappings.json` and restart the dev server or rebuild.
