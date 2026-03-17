# Lair of Riches

Lair of Riches is a 5x5 PixiJS slot prototype prepared for a local exhibition setup. The repository contains the frontend game client, the local backend used by the demo math engine, and a local exhibition workflow that starts both services together.

## Gameplay Showcase

| Stage | Preview |
|-------|----------|
| **Loading Screen** | ![Loading Screen](https://i.ibb.co/qYg8mnQF/game0.jpg) |
| **Start Screen** | ![Start Screen](https://i.ibb.co/Pv19wFnp/game1.jpg) |
| **Main Game Screen** | ![Main Game Screen](https://i.ibb.co/mjQ0wyK/game2.jpg) |
| **Bonus Buy Screen** | ![Bonus Buy Screen](https://i.ibb.co/MDp7X9LS/game3.jpg) |
| **Bonus Win Screen** | ![Bonus Win Screen](https://i.ibb.co/Y41vgtQd/game4.jpg) |
| **Bonus Game Screen** | ![Bonus Game Screen](https://i.ibb.co/FZ6c054/game5.jpg) |

## Project Overview

**Game Engine:** TypeScript + PixiJS  
**Design:** Responsive, self-contained, and production-hardened for local exhibition use

### Core Features

- Expanding Multiplier Wolf Wild
- Free Spins Bonus
- Bonus Buy flow through the existing `SpinT` contract
- Data-driven UI and paytable flow
- Local exhibition workflow with frontend and backend startup scripts

## Mathematical Model

| Metric | Value | Description |
|--------|--------|-------------|
| **Total RTP** | 96.92% | Theoretical long-term return percentage |
| **RTP Structure** | 70.38% (Base) / 26.55% (Bonus) | Most payouts originate from the base game |
| **Max Win** | 15,000x | Maximum win multiplier per spin |
| **Hit Frequency** | 27.69% | Probability of any winning combination |
| **Bonus Trigger** | ~1 in 305 spins (0.328%) | Average rate of Free Spins activation |
| **Volatility** | Very High | Infrequent wins with large potential payouts |

## Requirements

- Node.js 20 LTS
- npm 10 or newer

## Project Structure

- `src/`: PixiJS frontend
- `backend/src/`: local demo backend
- `public/`: production assets
- `scripts/`: local workflow helpers
- `docs/exhibition-prep-status.md`: current prep status and verification log

## Environment

Frontend variables:

- `VITE_API_BASE_URL`: API base URL used by the frontend
- `VITE_PUBLIC_BASE_PATH`: public base path for hosted builds

Backend variables:

- `PORT`: backend port
- `CORS_ORIGIN`: allowed frontend origin, or a comma-separated allowlist
- `PUBLIC_BASE_URL`: frontend URL returned by the provider endpoint

Example files:

- [`.env.example`](/Users/furkan/Desktop/Proje/SlotGameWithPixiJS/.env.example)
- [`backend/.env.example`](/Users/furkan/Desktop/Proje/SlotGameWithPixiJS/backend/.env.example)

## Installation

```bash
npm install
npm --prefix backend install
```

## Local Exhibition Workflow

Start the full local exhibition stack:

```bash
npm run dev:exhibition
```

This starts:

- frontend on `http://127.0.0.1:5173`
- backend on `http://localhost:3001/demo`

Individual services:

```bash
npm run dev:frontend
npm run dev:backend
```

## Build And Verification

Frontend production build:

```bash
npm run build
```

Backend production build:

```bash
npm run build:backend
```

Full build verification:

```bash
npm run build:all
```

Smoke verification:

```bash
npm run smoke
```

Type checking:

```bash
npm run typecheck
npm --prefix backend run typecheck
```

Linting:

```bash
npm run lint
```

Clean generated output:

```bash
npm run clean
```

Security verification:

```bash
npm audit --json
npm --prefix backend audit --json
```

## Deployment Notes

- Local exhibition is the default target.
- Hosted builds should set `VITE_PUBLIC_BASE_PATH` and `VITE_API_BASE_URL` explicitly.
- The frontend expects the backend under `/demo/api`.
- Bonus buy remains part of the existing spin contract through `SpinT`; there is no separate `bonus-buy` endpoint.

## Troubleshooting

- If the frontend opens without responses, confirm the backend is reachable at `http://localhost:3001/demo/ping` and that `CORS_ORIGIN` includes the frontend origin.
- If assets fail to load after a base-path change, verify `VITE_PUBLIC_BASE_PATH` matches the deployed public folder.
- If audio does not start immediately, interact with the start screen once to unlock browser audio.
- If a runtime failure overlay appears, use the retry action or restart the local exhibition stack.

## Acknowledgements

Thank you for taking the time to explore Lair of Riches. This project remains open for feedback, discussion, and collaboration.
