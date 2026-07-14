# AL METHER Company Platform

## Architecture

All operational modules are governed by the immutable
[Operation Engine Golden Rule](docs/architecture/operation-engine-golden-rule.md).
No Operations feature may start before its `WorkOrder -> Event -> Reducer -> Read Model`
integration is explicitly defined.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Configure the required environment variables.
3. Start the application with `npm run dev`.

Next.js loads `.env.local` from the project root. Variables prefixed with
`NEXT_PUBLIC_` are embedded into the browser bundle when the development
server or production build starts. Restart the development server after an
environment-variable change.

## Google Maps

The shared map foundation uses the Google Maps JavaScript API. Configure:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_javascript_api_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_optional_map_id
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is required. The map ID is optional; local
development uses `DEMO_MAP_ID` when it is omitted. Never hardcode an API key in
source files.

For Vercel deployments, add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to the selected
Production, Preview, and/or Development environments before redeploying. A
local `.env.local` file is intentionally not committed and is not available to
Vercel builds.

The Google Cloud key must allow the deployment origins and have Maps
JavaScript API enabled. Changes to a `NEXT_PUBLIC_` variable require a new
deployment because its value is injected at build time.

During local development, `GoogleMapProvider` logs only the detected API-key
length to the browser console. The key value itself is never logged.

## Verification

```bash
npm run typecheck
npm run build
```
