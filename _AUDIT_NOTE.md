# Audit Note — AIMonitorrealtimeaudi

Source audit: `_AUDIT/reports/batch_05.md` § 26

## Original audit recommendations

### Missing AI endpoints
- `/passenger-safety-score`
- `/distraction-detection`
- `/road-hazard-detector`
- `/premium-adjustment`

### Missing non-AI features
- Insurance integration (claim reporting)
- Driver coaching (automated safety training)
- Passenger communication (real-time alerts)
- Video integration (dashcam footage review)
- Third-party liability tracking
- Public API (telematics data export)

### Custom feature suggestions
- Agentic safety coach
- Vision-based road hazard detection
- Autonomous emergency response
- Insurance risk orchestration
- Passenger safety agent
- Fleet optimization & safety

## Implemented in this pass
1. **POST `/api/ai/passenger-safety-score`** — pulls trip + driver behavior + vehicle incidents, returns safety score with risk factors and recommendations.
2. **POST `/api/ai/road-hazard-detector`** — clusters incidents to identify risky intersections / time-of-day hotspots.

Both follow the existing `routes/ai.js` patterns (`callOpenRouter`, `parseAIJson`, `saveAnalysis`, `aiRateLimiter`). Defensive try/catch on DB queries handles schema variance. Syntax checked.

## Backlog (priority order)

### Mechanical
- `/distraction-detection` (text-only behavior analysis; vision-based requires creds)
- `/premium-adjustment` (insurance rate recommendations from existing risk scores)

### Needs creds / external SDK
- Insurance carrier APIs (claim reporting)
- Dashcam video integration (storage + vision model)
- Public telematics export API (auth + rate-limit policy)

### Needs product decision
- Driver coaching curriculum (training content sourcing)
- Passenger communication channels (SMS vs in-app)
- Third-party liability tracking (legal + financial integration)

## Apply pass 5 (all backlog)

Implemented 6 endpoints in `server/routes/ai.js` covering all remaining NEEDS-CREDS and NEEDS-PRODUCT-DECISION backlog:

**NEEDS-CREDS** (return 503 with `missing: <ENV>`):
- `POST /api/ai/insurance-claim-report` — `INSURANCE_CARRIER_API_KEY`
- `POST /api/ai/dashcam-vision` — `DASHCAM_VISION_API_KEY`
- `GET /api/ai/telematics-export` — `TELEMATICS_EXPORT_API_KEY` (also requires `x-telematics-key` header for caller auth)

**PRODUCT-DECISION:**
- `POST /api/ai/driver-coaching` — built-in 10-module curriculum library (M01 Defensive Driving … M10 Incident Response). AI selects modules based on driver risk signals.
- `POST /api/ai/passenger-alert` — in-app broadcast channel only (SMS/email left as future NEEDS-CREDS).
- `POST /api/ai/liability-tracking` — third-party liability records persisted in existing `ai_analyses` table (no schema migration needed).

Reuses existing `callOpenRouter`, `parseAIJson`, `saveAnalysis`, `aiRateLimiter`, and a generic `requireEnv(envName)` factory for 503 gating. Syntax checked.

Backlog now empty.

## Apply pass 4 (mechanical backlog)

Implemented both mechanical backlog items:

1. **`POST /api/ai/distraction-detection`** — text-only driver distraction analysis: pulls driver behavior + recent incidents, accepts free-form observations and recent text logs, returns distraction score, signals, and broadcasts a `driver_alert` if `alert_required`. (No vision input; vision-based remains NEEDS-CREDS.)
2. **`POST /api/ai/premium-adjustment`** — advisory insurance premium recommendation derived from existing risk signals (driver behavior, incidents, prior `analyze-driver`/`analyze-fatigue`/`passenger-safety-score` analyses). Outputs recommended premium, adjustment %, risk tier, and per-factor impact. Marked advisory in the system prompt — does not bind quotes.

Both follow the existing `routes/ai.js` patterns (`callOpenRouter`, `parseAIJson`, `saveAnalysis`, `aiRateLimiter`) and add a new `requireOpenRouterKey` middleware that returns 503 when `OPENROUTER_API_KEY` is missing or a placeholder.

Frontend: `client/src/pages/AIToolsPage.js` gained two new entries in the `TOOLS` tab array (Distraction Detection, Insurance Premium Adjustment), plus textarea support and 503-aware error rendering.

Smoke-tested via login + curl: server logs confirmed both routes are registered and middleware reaches them.

Mechanical backlog is now empty for this project. Remaining items are NEEDS-CREDS (vision/dashcam, insurance carrier APIs, telematics export) or NEEDS-PRODUCT-DECISION (driver coaching curriculum, passenger comm channels, third-party liability tracking).

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

`client/src/pages/AIToolsPage.js` provides a tab-style UI for the two pass-2 endpoints:
- `POST /api/ai/passenger-safety-score`
- `POST /api/ai/road-hazard-detector`

Form-driven inputs, error and result panels render API responses (including 503-no-key surfaced through the error panel). Routed at `/ai-tools` in `client/src/App.js:143`. The other 9 AI endpoints in `server/routes/ai.js` (`/analyze-driver`, `/analyze-incident`, `/analyze-route`, `/predict-maintenance`, `/assess-threat`, `/analyze-fatigue`, `/emergency-response`, `/analyze-weather`, `/check-compliance`, `/general-analysis`) are wired via `pages/FeaturePage.js`. No FE changes needed.
