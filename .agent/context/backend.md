# Backend Context

Load this context when changing endpoint calls, response models, validation,
errors, health behavior, document metadata, chat rendering, or CORS guidance.

## Service

- Production origin: `https://api.albertlukmanovlabs.lol`
- Swagger: `https://api.albertlukmanovlabs.lol/docs`
- Backend ownership: separate repository and deployment
- Frontend request timeout: 25 seconds
- Authoritative frontend contract: [../../docs/api.md](../../docs/api.md)

Do not add a backend, proxy, or mock production behavior to this repository.

## Consumed Endpoints

### `GET /health`

Required string fields: `status`, `service`, and `version`.

### `GET /api/documents`

The deployed response may omit `documents`, `total_documents`, and
`total_chunks`. The frontend defaults them to `[]`, `0`, and `0`. Present
documents require `source` and `chunks`; present counts remain non-negative
integers.

### `POST /api/chat`

Request fields: `message`, `user_id`, and `session_id`.

Required response fields:

- `message`
- supported `classification`
- `trace_id`

Backend-defaulted response fields:

- omitted `actions` becomes `[]`;
- omitted `requires_human` becomes `false`;
- omitted `sources` becomes `[]`; and
- an omitted action `result` becomes `null`.

When present, each action requires `tool` and a strict `success`, `error`, or
`skipped` status. A present `result` must be an object with arbitrary properties;
arrays, scalars, and explicit `null` are rejected. Explicit malformed values are
rejected.

Supported classifications are `appointment_request`, `pricing_question`,
`document_question`, `emergency_or_pain`, `complaint`, `general_question`, and
`human_escalation`.

## Validation And Errors

- Treat response bodies as `unknown`.
- Keep validation in feature API modules.
- Keep transport behavior in `src/shared/api/request.ts`.
- Preserve typed `ApiError` metadata: status, code, trace ID, and kind.
- Combine safe error fields from the root and object-valued `detail` envelope,
  preferring nested values per field and retaining root fallbacks.
- Preserve specific handling for `422`, `429`, `503`, `crm_unavailable`, generic
  `5xx`, invalid JSON, invalid schema, timeout, abort, and network errors.
- Never show a failed appointment, callback, ticket, or escalation as successful.
- Do not retry chat automatically.

## CORS Assumptions

Production backend origins should allow:

```text
https://albertlukmanovlabs.lol
https://www.albertlukmanovlabs.lol
```

Local development may allow `http://localhost:5173`. Credentials should be off,
origins must not use a production wildcard, and `X-Trace-Id` should be exposed.
CORS changes belong to the backend repository.

## Safety Boundary

The backend answer is displayed as answer text. The frontend may add safety
framing but must not reinterpret it clinically. For `emergency_or_pain` or
`requires_human=true`, show the warning without claiming emergency services were
contacted. Never add diagnosis, treatment, or medication guidance.

When the contract changes, update this file, `docs/api.md`, endpoint validators,
and relevant UI/tests together.
