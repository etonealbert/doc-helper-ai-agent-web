# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Doc Helper AI Agent Web

  A responsive React interface for demonstrating a document-grounded AI agent. It
  surfaces the backend answer, classification, tool activity, sources, escalation
  state, and trace ID without hiding the workflow behind a conventional chat UI.

  > **Portfolio demonstration only.** This application is not a medical product,
  > does not provide diagnosis or treatment, and must not be used with real patient
  > data. Urgent or life-threatening situations require local emergency services or
  > an appropriate qualified professional.

  ## Project Status

  - Frontend source: implemented
  - Production API: `https://api.albertlukmanovlabs.lol`
  - API documentation: <https://api.albertlukmanovlabs.lol/docs>
  - Intended frontend URL: `https://albertlukmanovlabs.lol`
  - AWS infrastructure and deployment: managed separately and not included yet
  - Automated frontend tests: not included yet

  The intended frontend URL is a deployment target, not proof that the current
  working tree has been deployed.

  ## Features

  - Responsive agent workspace for mobile, tablet, and desktop
  - Multiline chat composer with Enter and Shift+Enter behavior
  - Starter prompts for general, pricing, appointment, policy, and safety routes
  - Runtime validation of health, document, and chat API responses
  - Visible classifications, tool results, sources, and copyable trace IDs
  - Calm, prominent safety and human-escalation states
  - Health polling and knowledge-base metadata
  - Request cancellation, 25-second timeout, retry, and safe error messages
  - In-memory conversation history with only a session ID stored locally
  - Keyboard focus states, semantic markup, live regions, and reduced-motion support
  - Redaction of sensitive-looking keys before structured tool data is displayed

  ## Architecture

  ```mermaid
  flowchart LR
      Browser[Browser] -->|Static assets| Frontend[React + Vite frontend]
      Frontend -->|GET /health| API[Existing FastAPI backend]
      Frontend -->|GET /api/documents| API
      Frontend -->|POST /api/chat| API
      API --> Agent[Agent workflow]
      Agent --> Docs[Document knowledge base]
      Agent --> Tools[Scheduling and escalation tools]
  ```

  The application uses a feature-first source tree. Visual components never call
  `fetch` directly. Endpoint modules validate unknown response data at runtime,
  while hooks own request lifecycle and presentation state.

  See [docs/architecture.md](docs/architecture.md) for ownership boundaries and
  data flow.

  ## Technology

  - React 19
  - TypeScript in strict mode
  - Vite
  - Native `fetch` and `AbortController`
  - Local runtime validators using `unknown` at API boundaries
  - CSS Modules and global design tokens
  - Browser `crypto.randomUUID()` and `localStorage`

  The current implementation deliberately has no client-state library, component
  framework, CSS framework, or runtime dependency beyond React and React DOM.

  ## Local Development

  Prerequisites:

  - A Node.js version supported by the Vite version in `package.json`
  - npm
  - Backend access, or a compatible backend running locally

  ```bash
  npm install
  npm run dev
  ```

  Vite prints the local URL, normally `http://localhost:5173`.

  ### Configuration

  All frontend environment variables are public build-time configuration. Never put
  secrets in a `VITE_` variable.

  | Variable | Default | Purpose |
  | --- | --- | --- |
  | `VITE_API_BASE_URL` | `https://api.albertlukmanovlabs.lol` | Backend origin; trailing slashes are removed |
  | `VITE_APP_ENV` | `local` | Environment label available to the frontend |
  | `VITE_GITHUB_REPOSITORY_URL` | Project GitHub URL | Header source link |

  For a local backend, create a local Vite environment file with:

  ```dotenv
  VITE_API_BASE_URL=http://localhost:8000
  VITE_APP_ENV=local
  VITE_GITHUB_REPOSITORY_URL=
  ```

  Configuration is parsed in `src/app/config.ts`. An invalid API URL fails at
  application startup with a useful error.

  ## Quality Commands

  ```bash
  npm run lint
  npm run build
  npm run preview
  ```

  `npm run build` performs the TypeScript project build before producing `dist/`.
  Dedicated test, format-check, and standalone type-check scripts are roadmap work;
  do not document them as available until they exist in `package.json`.

  ## API Contract

  The frontend currently consumes:

  | Method | Path | Purpose |
  | --- | --- | --- |
  | `GET` | `/health` | API status, service name, and version |
  | `GET` | `/api/documents` | Document names and chunk totals |
  | `POST` | `/api/chat` | Agent answer and workflow metadata |

  A chat request contains `message`, `user_id`, and `session_id`. A successful
  response contains answer text, classification, actions, escalation state,
  sources, and a trace ID. Responses are treated as untrusted until validated.

  See [docs/api.md](docs/api.md) for exact shapes and error behavior.

  ## Safety And Privacy

  - The interface never adds diagnosis, medication, or treatment advice.
  - Emergency and human-escalation classifications receive a visible warning.
  - The UI never claims emergency services, a callback, or a ticket were created
    unless a successful backend action explicitly confirms it.
  - Message contents are not written to `localStorage`.
  - Clearing the conversation cancels an active request and creates a new session.
  - Tool output is rendered as text, never arbitrary HTML.
  - Keys resembling credentials, tokens, contact details, or patient fields are
    removed from the structured tool preview.

  ## Repository Layout

  ```text
  .
  ├── AGENTS.md                 Agent entry point and project rules
  ├── .agent/
  │   ├── context/              Focused backend, frontend, AWS, and test context
  │   └── tasks/                Current milestone and deferred backlog
  ├── docs/                     Maintainer documentation
  ├── public/                   Static browser assets
  └── src/
      ├── app/                  Runtime configuration
      ├── features/             Chat, documents, and health ownership
      ├── shared/               API, UI, hooks, and formatting utilities
      └── styles/               Reset, tokens, globals, and CSS Module styles
  ```

  Future coding agents should begin with [AGENTS.md](AGENTS.md). Human maintainers
  should use [docs/architecture.md](docs/architecture.md) and
  [docs/conventions.md](docs/conventions.md) as the source of truth.

  ## Deployment Target

  The planned production topology is a private S3 bucket behind CloudFront Origin
  Access Control, with Route 53 aliases for the apex domain and an ACM certificate
  in `us-east-1`.

  ```mermaid
  flowchart TD
      User[Browser] --> CF[CloudFront]
      CF -->|Origin Access Control| S3[Private S3 bucket]
      User -->|HTTPS API requests| API[api.albertlukmanovlabs.lol]
  ```

  The current repository does not contain Terraform or a deployment workflow and
  has not provisioned AWS resources. See [docs/deployment.md](docs/deployment.md)
  for the expected build, CORS, caching, and verification requirements.

  ## Known Limitations

  - No authentication or user accounts
  - No persisted chat history
  - No streaming responses
  - No document upload or administration UI
  - No automated test suite yet
  - No infrastructure-as-code or deployment workflow yet
  - The pseudonymous user ID is regenerated on each page load

  Planned work belongs in [docs/roadmap.md](docs/roadmap.md) and
  [.agent/tasks/backlog.md](.agent/tasks/backlog.md).

  ## Demonstration Walkthrough

  1. Confirm the header reports the API as online.
  2. Ask for opening hours and inspect the classification and sources.
  3. Ask about whitening cost and inspect the document-grounded result.
  4. Use the appointment starter prompt and inspect each tool action.
  5. Use the marked safety prompt and verify the escalation warning.
  6. Copy a trace ID and clear the conversation to rotate the session.

  ## Documentation

  - [Architecture](docs/architecture.md)
  - [API contract](docs/api.md)
  - [Conventions](docs/conventions.md)
  - [Deployment](docs/deployment.md)
  - [Roadmap](docs/roadmap.md)
