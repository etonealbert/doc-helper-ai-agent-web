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

All three properties must be strings. `status: "ok"` maps to **online**; another
valid status maps to **degraded**. A request or validation failure maps to
**unavailable**. The UI checks immediately and then every 45 seconds.

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

Document sources must be strings and counts must be finite numbers. The first UI
version displays metadata only; it does not upload, edit, or search documents.

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

The response validator rejects unsupported classifications or malformed fields.
`action.result` remains unknown structured data and is sanitized before display.
Arbitrary HTML is never rendered.

## Error Contract

The request layer safely accepts error metadata at the response root or in an
object-valued `detail` property. Recognized fields include:

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

| Condition | UI behavior |
| --- | --- |
| `422` | Explain that the request could not be processed |
| `429` | Ask the user to wait before retrying |
| `503` + `crm_unavailable` | State that scheduling is unavailable and nothing was confirmed |
| Other `503` | Report a temporarily unavailable supporting service |
| Other `5xx` | Report a generic server failure |
| Invalid JSON or schema | Report an unexpected response |
| Timeout | State that no action was confirmed and allow retry |
| Network failure | Suggest checking connectivity and allow retry |

Retries reuse the failed request without adding a duplicate user bubble. Mutations
do not retry automatically.

## Cancellation

Each request gets an internal `AbortController`. A caller-provided signal is
forwarded to that controller. Chat requests are aborted when the chat hook unmounts
or the conversation is cleared. Health and document requests are aborted when
their hooks unmount.

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

CORS is a backend responsibility and must not be bypassed in this frontend.