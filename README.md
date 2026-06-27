# MIDAS Soccer Wizard

A web app that auto-generates a soccer ball–shaped structural model using the MIDAS CAE API and runs a structural analysis on it. Built as a 2026 FIFA World Cup themed demo.

## What it does

1. Generates a 3D soccer ball lattice structure (60 nodes based on a golden-ratio icosahedron)
2. Creates the model in MIDAS Gen NX or Civil NX via API (material, section, boundary conditions, load cases)
3. Runs a structural analysis and returns reactions, displacements, beam forces, and stress ratios

## Stack

- **Backend**: Node.js serverless functions (Vercel) — `api/`
- **Frontend**: `index.html` (HTML skeleton) + `css/style.css` + `js/strings.js` (6-lang i18n) + `js/app.js` (logic) + Plotly.js
- **External API**: MIDAS moa-engineers API

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connect` | POST | Validate MIDAS API key |
| `/api/generate` | POST | Generate soccer ball model |
| `/api/analyze` | POST | Run analysis and fetch results |

## Deploy

This project is configured for Vercel. Push to GitHub and connect to Vercel — no build step required.

```bash
vercel deploy
```

## Usage

1. Open the app and select a product (Gen NX or Civil NX)
2. Enter your MIDAS API key and verify the connection
3. Set geometry (radius, center coordinates), material, and section properties
4. Configure boundary conditions and load cases
5. Generate the model and run the analysis
6. View results in the Plotly chart

## Notes

- No npm dependencies — pure Node.js
- API key is passed from the client at runtime; no server-side env vars needed
- Backend uses relative paths — no CORS configuration needed
- To add a language: add one entry to `LANGS` in `js/app.js` and one translation block to `STRINGS` in `js/strings.js`
