BEGIN;
CREATE TABLE IF NOT EXISTS transit_telemetry_events (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, vehicle_ref TEXT NOT NULL, device_ref TEXT NOT NULL,
 source_ref TEXT NOT NULL, schema_version TEXT NOT NULL, sequence BIGINT NOT NULL, speed_kph NUMERIC(8,3) NOT NULL,
 payload JSONB NOT NULL, recorded_at TIMESTAMPTZ NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 consent_reference TEXT NOT NULL, UNIQUE(tenant_id,device_ref,sequence)
);
CREATE TABLE IF NOT EXISTS transit_safety_cases (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, case_ref TEXT NOT NULL, vehicle_ref TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'recorded', score INTEGER CHECK(score BETWEEN 0 AND 100), advisory BOOLEAN NOT NULL DEFAULT TRUE,
 evidence JSONB NOT NULL DEFAULT '[]'::jsonb, idempotency_key TEXT NOT NULL, created_by TEXT NOT NULL,
 retention_until TIMESTAMPTZ NOT NULL, failure_code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,case_ref), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS transit_safety_actions (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, case_ref TEXT NOT NULL, action_type TEXT NOT NULL,
 approval_status TEXT NOT NULL DEFAULT 'pending', approved_by TEXT, provider TEXT, dispatch_idempotency_key TEXT NOT NULL,
 dispatch_status TEXT NOT NULL DEFAULT 'not_dispatched', dispatch_receipt TEXT, attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TIMESTAMPTZ, outcome_evidence JSONB, UNIQUE(tenant_id,provider,dispatch_idempotency_key)
);
CREATE TABLE IF NOT EXISTS transit_safety_evaluations (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, fixture_version TEXT NOT NULL, case_ref TEXT NOT NULL,
 expected_score INTEGER NOT NULL, actual_score INTEGER NOT NULL, latency_ms INTEGER NOT NULL, false_positive BOOLEAN NOT NULL,
 missed_event BOOLEAN NOT NULL, outcome JSONB NOT NULL, UNIQUE(tenant_id,fixture_version,case_ref)
);
CREATE TABLE IF NOT EXISTS transit_safety_audit (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, case_ref TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
 actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, reason TEXT NOT NULL, evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 correlation_id TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transit_action_retry ON transit_safety_actions(dispatch_status,next_attempt_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_transit_audit_correlation ON transit_safety_audit(tenant_id,case_ref,correlation_id);
COMMIT;
