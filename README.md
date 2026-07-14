# Doc Helper AI Agent Web

A responsive React interface for demonstrating a document-grounded AI agent. It
surfaces backend answers, classifications, tool activity, sources, escalation
state, and trace IDs so the workflow remains inspectable.

> **Portfolio demonstration only.** This application is not a medical product,
> does not provide diagnosis or treatment, and must not be used with real patient
> data. Urgent or life-threatening situations require local emergency services or
> an appropriate qualified professional.

## Project Status

- Frontend application and local quality gate: implemented
- Production API: `https://api.albertlukmanovlabs.lol`
- API documentation: <https://api.albertlukmanovlabs.lol/docs>
- Frontend infrastructure URL: `https://albertlukmanovlabs.lol` (assets not deployed)
- CI and deployment workflow definitions: present but not run by this change
- Frontend Terraform: applied and infrastructure-verified on 2026-07-14
- Backend CORS, GitHub environment setup, and asset deployment: remaining work
- Spanish-default English/Spanish frontend and coordinated backend contract:
  implemented locally, not deployment-verified

The AWS origin, CDN, certificate, DNS aliases, and deployment role are provisioned,
but this working tree has not been deployed. The empty origin currently returns an
expected CloudFront `403`; backend CORS was not changed or verified.

## Implemented Features

- Responsive agent workspace for mobile, tablet, and desktop
- Multiline composer with Enter and Shift+Enter behavior
- Starter prompts for general, pricing, appointment, policy, and safety routes
- Spanish-by-default interface with an English switcher and localized metadata,
  accessibility labels, errors, safety framing, and workflow labels
- TanStack Query ownership for health, document, and chat request lifecycles
- Zod validation of all consumed API responses
- Visible classifications, tool results, sources, and copyable trace IDs
- Calm, prominent safety and human-escalation states
- Health polling and knowledge-base metadata with retry states
- Request cancellation, a 25-second timeout, retry, and safe error messages
- In-memory conversation history with only the session ID stored locally
- Keyboard focus states, semantic markup, live regions, and reduced-motion support
- Recursive redaction of sensitive-looking keys before displaying tool data
- Vitest and React Testing Library coverage isolated from the deployed API by MSW
- Per-request `es`/`en` chat locale propagation with language-stable retries and
  in-flight responses

## Architecture

```mermaid
flowchart LR
    Browser[Browser] --> App[React application composition]
    App --> Locale[Memory-only localization provider]
    App --> Query[TanStack Query hooks]
    App --> Chat[Local chat transcript]
    Query --> APIs[Feature API modules]
    Chat --> APIs
    APIs --> Zod[Zod response schemas]
    APIs --> Request[Shared request layer]
    Request --> Backend[Existing FastAPI backend]
```

Visual components do not call `fetch` directly. Feature hooks own Query and local
state, feature API modules parse unknown responses with Zod, and the shared
request layer owns transport, timeout, cancellation, and safe error conversion.
Conversation messages stay in React state rather than Query cache or browser
storage. Locale also stays in React state; Spanish is restored on reload and only
the generated session ID is stored locally. See
[docs/architecture.md](docs/architecture.md).

## Technology

- React 19 and React DOM
- TypeScript 6 with strict mode enabled
- Vite 8
- TanStack Query 5
- Zod 4
- Native `fetch` and `AbortController`
- CSS Modules and global design tokens
- Vitest, jsdom, React Testing Library, user-event, and MSW
- ESLint and Prettier

## Local Development

Prerequisites:

- Node.js 22, as recorded in `.nvmrc`
- npm
- Backend access, or a contract-compatible backend running locally

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

### Configuration

All frontend environment variables are public build-time values. Never put
secrets in a `VITE_` variable.

| Variable                     | Default                              | Purpose                                      |
| ---------------------------- | ------------------------------------ | -------------------------------------------- |
| `VITE_API_BASE_URL`          | `https://api.albertlukmanovlabs.lol` | Backend origin; trailing slashes are removed |
| `VITE_APP_ENV`               | `local`                              | Environment label available to the frontend  |
| `VITE_GITHUB_REPOSITORY_URL` | Project GitHub URL                   | Header source link                           |

For a local backend, use a local Vite environment file:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=local
VITE_GITHUB_REPOSITORY_URL=
```

`src/app/config.ts` validates the API URL during application startup.

## Quality Commands

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

`npm run test:run` uses local MSW handlers and does not call the deployed API.
`npm run build` runs the TypeScript project build before Vite writes `dist/`.
Use `npm run format` to apply repository formatting.

## CI Behavior

`.github/workflows/ci.yml` runs on pull requests targeting `main` and pushes to
`main`. It installs with `npm ci`, runs all five quality commands, and uploads the
tested `dist` artifact for that commit. The CI workflow has read-only repository
permission and no AWS credentials or deployment step.

`.github/workflows/deploy.yml` is a separate deployment definition. Its quality
job references the GitHub `production` environment, runs the same gate with its
environment-scoped public build values, and passes the tested artifact to a
separately protected OIDC-based deployment job. Environment protection may gate
the build and deploy jobs separately. Only deploy can request an OIDC token. The
workflow depends on pre-provisioned AWS resources and GitHub environment values;
this change did not run it or verify a production deployment.

## API Contract

The frontend consumes:

| Method | Path             | Purpose                                      |
| ------ | ---------------- | -------------------------------------------- |
| `GET`  | `/health`        | API status, service name, and version        |
| `GET`  | `/api/documents` | Document names and chunk totals              |
| `POST` | `/api/chat`      | Localized agent answer and workflow metadata |

Responses remain `unknown` until their endpoint Zod schema succeeds. See
[docs/api.md](docs/api.md) for exact shapes, defaults, and error behavior.

## Safety And Privacy

- The interface never adds diagnosis, medication, or treatment advice.
- Emergency and human-escalation responses receive a visible warning.
- The UI never claims emergency services, a callback, appointment, or ticket was
  created unless a successful backend action explicitly confirms it.
- Message contents are not written to `localStorage`.
- Clearing the conversation cancels an active request and rotates the session.
- Tool output is rendered as text, never arbitrary HTML.
- Sensitive-looking keys are removed from structured tool previews.
- Examples and automated test fixtures are fictional and non-identifying.

## Repository Layout

```text
.
|-- .agent/                    Focused context and task tracking
|-- .github/workflows/         CI and deployment workflow definitions
|-- docs/                      Maintainer documentation
|-- infra/terraform/           Frontend AWS definitions and validation tooling
|-- public/                    Static browser assets
`-- src/
    |-- app/                   Configuration and application providers
    |-- features/              Chat, documents, and health ownership
    |-- shared/                API, UI, localization, hooks, and formatting utilities
    |-- styles/                Reset, tokens, globals, and CSS Module styles
    `-- test/                  Fictional fixtures and MSW test infrastructure
```

## Intended Deployment Topology

```mermaid
flowchart TD
    User[Browser] --> DNS[Route 53 apex aliases]
    DNS --> CF[CloudFront]
    CF -->|Origin Access Control| S3[Private S3 REST origin]
    User -->|HTTPS API requests| API[api.albertlukmanovlabs.lol]
```

The provisioned design uses a private S3 origin behind CloudFront OAC, Route 53
apex and `www` aliases, and an ACM certificate in `us-east-1`. The Terraform stack
was applied and verified on 2026-07-14. Production browser integration still
requires frontend asset deployment, GitHub environment configuration, and the
separately owned backend CORS allowlist. See
[docs/deployment.md](docs/deployment.md).

## Known Limitations

- The frontend assets and production workflow have not been deployment-verified.
- GitHub environment configuration and backend CORS remain external work.
- No authentication or user accounts
- No persisted chat history
- No streaming responses
- No document upload or administration UI
- The pseudonymous user ID is regenerated on each page load
- The selected interface language is intentionally memory-only and returns to
  Spanish after reload

Deferred work belongs in [docs/roadmap.md](docs/roadmap.md) and
[.agent/tasks/backlog.md](.agent/tasks/backlog.md).

## Fictional Demonstration Walkthrough

Use fictional prompts only; do not enter patient or identifying data.

1. Confirm that the interface starts in Spanish, then check the API status indicator.
2. Ask, "¿Cuál es el horario de atención?" and inspect the classification.
3. Ask, "¿Cuánto cuesta el blanqueamiento dental?" and inspect sources and tool data.
4. Switch to English and verify the transcript and draft are preserved.
5. Use the appointment and safety prompts and verify outcomes are not assumed.
6. Copy a trace ID, then clear the conversation to rotate the session.

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Conventions](docs/conventions.md)
- [Deployment](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
