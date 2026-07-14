# API Contract

## Base URL

Production: `https://api.albertlukmanovlabs.lol`

The frontend reads the origin from `VITE_API_BASE_URL`, validates that it uses
HTTP or HTTPS, and removes trailing slashes. API calls are centralized in
`src/shared/api/request.ts` and time out after 25 seconds by default.

## Health

### `GET /health`

```json
{
  "status": "ok",
  "service": "doc-helper-ai-agent",
  "version": "0.1.0"
}
```

All three properties must be non-empty strings. `status: "ok"` maps to **online**;
another valid status maps to **degraded**. A request or validation failure maps to
**unavailable**. TanStack Query checks immediately, retries a failed query once,
and then polls every 45 seconds.

## Documents

### `GET /api/documents`

```json
{
  "documents": [
    {
      "source": "pricing.md",
      "chunks": 4
    }
  ],
  "total_documents": 4,
  "total_chunks": 12
}
```

The deployed response may omit `documents`, `total_documents`, and `total_chunks`.
The frontend defaults omitted documents to `[]` and either omitted total to `0`.
When present, document sources must be non-empty strings and counts must be
non-negative integers. TanStack Query owns cancellation, one automatic retry,
and manual refetch. The UI displays metadata only; it does not upload, edit, or
search documents.

`POST /api/documents/search` exists on the backend but is not a primary UI route.

## Chat

### `POST /api/chat`

Request:

```json
{
  "message": "How much does teeth whitening cost?",
  "user_id": "web-user-uuid",
  "session_id": "session-uuid"
}
```

The composer accepts up to 2,000 characters and trims surrounding whitespace.
The UI blocks empty and concurrent submissions.

Response:

```json
{
  "message": "User-facing response",
  "classification": "pricing_question",
  "actions": [
    {
      "tool": "answer_with_rag",
      "status": "success",
      "result": {}
    }
  ],
  "requires_human": false,
  "sources": ["pricing.md"],
  "trace_id": "uuid-or-trace-value"
}
```

Supported classifications:

- `appointment_request`
- `pricing_question`
- `document_question`
- `emergency_or_pain`
- `complaint`
- `general_question`
- `human_escalation`

The Zod schema requires `message`, `classification`, and `trace_id`. For parity
with backend defaults, omitted `actions` and `sources` become empty arrays,
omitted `requires_human` becomes `false`, and an omitted `action.result` becomes
`null`. Explicit malformed values are still rejected.

Supported action statuses are strictly `success`, `error`, and `skipped`.
Unsupported classifications or statuses are rejected. When `action.result` is
present, it must be an object with arbitrary properties; arrays, scalar values,
and explicit `null` are rejected. An omitted result becomes frontend `null`.
Result objects are sanitized before text display, and arbitrary HTML is never
rendered.

Chat executes through a TanStack Query mutation with automatic retry disabled.
The mutation is invoked without variables, returns no response data, uses zero
garbage-collection time, and is reset after each operation so message text,
pseudonymous IDs, backend responses, and failures are not retained in
MutationCache. `sendChat` failures are caught into an operation-owned ref and
mapped to local safe UI state only after the void mutation resolves. The active
request, response, failure, and transcript remain local to the chat hook.

## Error Contract

The request layer safely combines error metadata from the response root and an
object-valued `detail` property. For each recognized field, a nested value takes
precedence and a root value supplies a fallback, so mixed envelopes retain all
available metadata. Recognized fields include:

```json
{
  "detail": {
    "message": "Safe backend message",
    "code": "crm_unavailable",
    "trace_id": "trace-value"
  }
}
```

It also reads `X-Trace-Id` when a trace is not present in the body.

| Condition                 | UI behavior                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `422`                     | Explain that the request could not be processed                |
| `429`                     | Ask the user to wait before retrying                           |
| `503` + `crm_unavailable` | State that scheduling is unavailable and nothing was confirmed |
| Other `503`               | Report a temporarily unavailable supporting service            |
| Other `5xx`               | Report a generic server failure                                |
| Invalid JSON or schema    | Report an unexpected response                                  |
| Timeout                   | State that no action was confirmed and allow retry             |
| Network failure           | Suggest checking connectivity and allow retry                  |

Retries reuse the failed request without adding a duplicate user bubble. Mutations
do not retry automatically.

## Cancellation

Each request gets an internal `AbortController` and a 25-second timeout. A
caller-provided signal, including one already aborted, is forwarded to that
controller. Timeout is distinguished from caller cancellation. Chat requests are
aborted when the chat hook unmounts or the conversation is cleared. Health and
document requests consume TanStack Query's signal, including cancellation on
unmount.

## CORS

The backend must allow these production origins:

```text
https://albertlukmanovlabs.lol
https://www.albertlukmanovlabs.lol
```

Local development may additionally allow `http://localhost:5173`. Recommended
backend settings are:

- `allow_credentials=false`
- methods `GET`, `POST`, and `OPTIONS`
- only required request headers, including `Content-Type`
- exposed response header `X-Trace-Id`
- no wildcard production origins

CORS is a backend responsibility and must not be bypassed in this frontend. The
required production allowlist has not been changed or verified by this frontend
work and remains an external release blocker.
