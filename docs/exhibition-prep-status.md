# Exhibition Prep Status

## Current State

- Repo hygiene, local workflow scripts, environment configuration, lifecycle teardown, and local exhibition startup hardening are complete.
- Frontend and backend compile successfully and the combined local stack boots successfully.
- The local exhibition workflow is documented in the README and script layer.
- Lint, unused code cleanup, dependency pruning, and audit cleanup are complete.

## Completed

- Added root and backend ignore rules for generated output, temporary files, and local environment files.
- Replaced broken root validation scripts with working `typecheck`, `smoke`, `build:backend`, `build:all`, and `dev:exhibition` commands.
- Moved frontend API/base-path config to environment-driven runtime values.
- Moved backend port, CORS origin, and public URL config to environment-driven values.
- Removed tracked `.DS_Store` files from the git index.
- Refactored bootstrap into dedicated modules for browser chrome, viewport handling, recovery, loading, session startup, and runtime bindings.
- Added explicit destroy/dispose flows for renderer, UI, asset loader, game client, and sound manager.
- Removed full-page reload handling from viewport changes.
- Deferred bonus background preloading so the initial boot path does less work.
- Added ESLint-based validation and removed unused packages, files, and dead debug modules.
- Updated dependency graph to remove known audit issues from both root and backend packages.
- Updated README with install, run, build, verification, configuration, and troubleshooting guidance.

## Verified Commands

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run smoke`
- `npm --prefix backend run typecheck`
- `npm --prefix backend run build`
- `npm audit --json`
- `npm --prefix backend audit --json`
- `npm run dev:exhibition`
- `curl -s http://127.0.0.1:3001/demo/ping`
- `curl -s http://127.0.0.1:5173`
- `curl -s -X POST http://127.0.0.1:3001/demo/api/spin -H 'Content-Type: application/json' -d '{"amount":200,"isDemo":true,"SpinT":0}'`

## Live Verification

- Frontend served successfully at `http://127.0.0.1:5173`.
- Backend responded successfully at `http://127.0.0.1:3001/demo/ping`.
- Backend returned a successful demo response from `/demo/api/spin`.
- Browser console was reduced to clean Vite connection logs after the favicon fix.
- Final root and backend audit checks reported `0` vulnerabilities.
- A live UI capture was saved to [`docs/exhibition-ui-check.png`](/Users/furkan/Desktop/Proje/SlotGameWithPixiJS/docs/exhibition-ui-check.png).

## Notes

- Node target for this repository is `20 LTS`.
- Hosted deployment is supported through environment variables, but the primary target remains the local exhibition setup.
