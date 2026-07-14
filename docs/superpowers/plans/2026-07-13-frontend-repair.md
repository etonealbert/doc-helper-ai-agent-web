# Frontend Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the existing frontend so strict TypeScript, runtime API validation, request lifecycle, accessibility, privacy, tests, CI, and production build all pass a reproducible quality gate.

**Architecture:** Preserve the feature-oriented React UI while adding an app-level TanStack Query provider. Health and documents use cancellable queries; chat uses a no-retry mutation while its transcript remains local React state. Every endpoint parses `unknown` with Zod after the shared request layer handles transport, timeout, JSON, and typed backend errors.

**Tech Stack:** React 19, Vite 8, TypeScript 6 strict mode, TanStack Query, Zod, native fetch, CSS Modules, Vitest, React Testing Library, user-event, MSW, ESLint, and Prettier.

## Global Constraints

- Keep the application identified as a portfolio demonstration, not a medical product.
- Preserve backend answer text exactly and never add diagnosis, medication, or treatment advice.
- Persist only the generated session ID; keep user ID and messages in memory.
- Route every HTTP request through `src/shared/api/request.ts`.
- Treat every network response as `unknown` until Zod parsing succeeds.
- Keep feature internals isolated and compose features in `src/App.tsx`.
- Render tool data only as text and retain recursive sensitive-key redaction.
- Do not add Terraform, change AWS, modify DNS, modify backend CORS, deploy, push, or commit.
- Work with existing user changes; never revert unrelated files.

## File Structure

Create or update these focused units:

- `src/app/queryClient.ts`: conservative Query defaults.
- `src/app/providers.tsx`: application Query provider.
- `src/features/*/api/*Schemas.ts`: Zod schemas and camel-case transforms.
- `src/features/*/api/*Api.ts`: endpoint calls that parse schemas.
- `src/features/*/hooks/*`: Query/mutation lifecycle and local feature state.
- `src/test/fixtures.ts`: fictional API fixtures.
- `src/test/handlers.ts`: default MSW handlers.
- `src/test/server.ts`: node MSW server.
- `src/test/setup.ts`: Vitest lifecycle and browser polyfills.
- `src/test/render.tsx`: Query-aware component render helper.
- `.github/workflows/ci.yml`: pull-request and main quality gate.
- `.github/workflows/deploy.yml`: existing deployment workflow repaired to use the implemented quality commands.

---

### Task 1: Install And Configure The Quality Toolchain

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.app.json`
- Modify: `tsconfig.node.json`
- Modify: `eslint.config.js`
- Create: `.nvmrc`
- Create: `.prettierrc`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/server.ts`

**Interfaces:**

- Produces: scripts `format`, `format:check`, `typecheck`, and `test:run`.
- Produces: Vitest jsdom environment backed by the exported `server` MSW instance.
- Produces: Node.js 22 as the local and CI runtime contract.

- [ ] **Step 1: Reproduce the current gates**

Run:

```powershell
npm run lint
npm run build
```

Expected: lint reports the three known errors and build reports `TS2339` for `prompt.safety`.

- [ ] **Step 2: Install runtime dependencies**

Run:

```powershell
npm install @tanstack/react-query zod
```

Expected: `package.json` and `package-lock.json` contain both runtime packages.

- [ ] **Step 3: Install test and formatting dependencies**

Run:

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw prettier
```

Expected: installation exits `0` and updates the lockfile.

- [ ] **Step 4: Add repository scripts and strict compiler options**

Set the `package.json` scripts to include:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc -b --pretty false",
  "test:run": "vitest run",
  "preview": "vite preview"
}
```

Add `"strict": true` to both TypeScript project configurations. Include
`vitest.config.ts` in `tsconfig.node.json`:

```json
"include": ["vite.config.ts", "vitest.config.ts"]
```

- [ ] **Step 5: Add Node, Prettier, Vitest, and ESLint test configuration**

Create `.nvmrc`:

```text
22
```

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all"
}
```

Create `vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
```

Add a test-file ESLint block with Node globals:

```js
{
  files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  languageOptions: { globals: { ...globals.browser, ...globals.node } },
}
```

- [ ] **Step 6: Add the shared test lifecycle**

Create `src/test/server.ts`:

```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
```

Create temporary empty `src/test/handlers.ts` so setup resolves:

```ts
import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = []
```

- [ ] **Step 7: Verify the harness starts**

Run:

```powershell
npm run test:run -- --passWithNoTests
```

Expected: Vitest exits `0` with no tests found. Do not claim lint/build success yet.

---

### Task 2: Make API Transport And Zod Contracts Correct

**Files:**

- Modify: `src/shared/api/request.ts`
- Delete: `src/shared/api/validation.ts`
- Modify: `src/features/chat/model/types.ts`
- Create: `src/features/chat/api/chatSchemas.ts`
- Modify: `src/features/chat/api/chatApi.ts`
- Create: `src/features/health/api/healthSchemas.ts`
- Modify: `src/features/health/api/healthApi.ts`
- Create: `src/features/documents/api/documentSchemas.ts`
- Modify: `src/features/documents/api/documentsApi.ts`
- Create: `src/test/fixtures.ts`
- Modify: `src/test/handlers.ts`
- Create: `src/shared/api/request.test.ts`
- Create: `src/features/chat/api/chatApi.test.ts`
- Create: `src/features/health/api/healthApi.test.ts`
- Create: `src/features/documents/api/documentsApi.test.ts`

**Interfaces:**

- `apiRequest<T>(path, validate, options): Promise<T>` retains its public signature.
- `chatResponseSchema.parse(unknown): ChatResponse` supplies defaults and camel-case fields.
- `healthSchema.parse(unknown): HealthResponse` returns validated health data.
- `documentsSchema.parse(unknown): DocumentsResponse` converts aggregate keys to camel case.

- [ ] **Step 1: Add fictional fixtures and default handlers**

Create fixtures with no identifying data:

```ts
export const healthFixture = {
  status: 'ok',
  service: 'doc-helper-ai-agent',
  version: '0.1.0',
}

export const documentsFixture = {
  documents: [{ source: 'pricing.md', chunks: 4 }],
  total_documents: 1,
  total_chunks: 4,
}

export const chatFixture = {
  message: 'The demonstration price is listed in the knowledge base.',
  classification: 'pricing_question',
  actions: [
    {
      tool: 'answer_with_rag',
      status: 'success',
      result: { sources: ['pricing.md'], num_chunks: 2 },
    },
  ],
  requires_human: false,
  sources: ['pricing.md'],
  trace_id: 'trace-demo-001',
}
```

Create `src/test/handlers.ts` with handlers against the configured production
default:

```ts
import { http, HttpResponse } from 'msw'
import { chatFixture, documentsFixture, healthFixture } from './fixtures'

export const API_BASE = 'https://api.albertlukmanovlabs.lol'

export const handlers = [
  http.get(`${API_BASE}/health`, () => HttpResponse.json(healthFixture)),
  http.get(`${API_BASE}/api/documents`, () =>
    HttpResponse.json(documentsFixture),
  ),
  http.post(`${API_BASE}/api/chat`, () => HttpResponse.json(chatFixture)),
]
```

- [ ] **Step 2: Write failing endpoint contract tests**

Add tests that call real endpoint modules through MSW:

```ts
const request = {
  message: 'What is the demonstration price?',
  userId: 'web-user-test',
  sessionId: 'session-test',
}

it('defaults omitted chat metadata', async () => {
  server.use(
    http.post(`${API_BASE}/api/chat`, () =>
      HttpResponse.json({
        message: 'A safe answer.',
        classification: 'general_question',
        trace_id: 'trace-defaults',
      }),
    ),
  )

  await expect(sendChat(request)).resolves.toMatchObject({
    actions: [],
    requiresHuman: false,
    sources: [],
  })
})

it('rejects an unsupported action status', async () => {
  server.use(
    http.post(`${API_BASE}/api/chat`, () =>
      HttpResponse.json({
        ...chatFixture,
        actions: [{ tool: 'answer_with_rag', status: 'unknown', result: {} }],
      }),
    ),
  )

  await expect(sendChat(request)).rejects.toMatchObject({
    kind: 'invalid_response',
  })
})
```

Add equivalent health malformed-response and documents camel-case tests.

- [ ] **Step 3: Write failing request-layer tests**

Cover mixed error metadata, invalid JSON, timeout, and an already-aborted caller:

```ts
it('preserves root code with a nested detail message', async () => {
  server.use(
    http.get(`${API_BASE}/mixed-error`, () =>
      HttpResponse.json(
        { code: 'crm_unavailable', detail: { message: 'CRM is unavailable.' } },
        { status: 503, headers: { 'X-Trace-Id': 'trace-error' } },
      ),
    ),
  )

  await expect(apiRequest('/mixed-error', String)).rejects.toMatchObject({
    code: 'crm_unavailable',
    traceId: 'trace-error',
    kind: 'service_unavailable',
  })
})
```

For abort, create and abort an `AbortController` before calling `apiRequest`, then
assert the rejection kind is `network`. For timeout, delay the MSW response beyond
an explicit `timeoutMs` and assert kind `timeout`.

- [ ] **Step 4: Run the contract tests to verify failure**

Run:

```powershell
npm run test:run -- src/shared/api/request.test.ts src/features/chat/api/chatApi.test.ts src/features/health/api/healthApi.test.ts src/features/documents/api/documentsApi.test.ts
```

Expected: failures show missing defaults, permissive status validation, lost root
error code, and the already-aborted signal edge case.

- [ ] **Step 5: Implement closed model values and Zod schemas**

In `types.ts`, define:

```ts
export const toolStatuses = ['success', 'error', 'skipped'] as const
export type ToolStatus = (typeof toolStatuses)[number]

export interface ToolAction {
  tool: string
  status: ToolStatus
  result: unknown
}
```

Implement `chatSchemas.ts` with `z.enum(classifications)`,
`z.enum(toolStatuses)`, defaults for omitted metadata, and a transform from
`requires_human`/`trace_id` to `requiresHuman`/`traceId`. Implement health and
documents schemas with non-empty strings, non-negative integer counts, and
camel-case aggregate transforms.

- [ ] **Step 6: Parse endpoint responses with Zod**

Endpoint modules pass schema parsing into `apiRequest`:

```ts
return apiRequest('/api/chat', (value) => chatResponseSchema.parse(value), {
  method: 'POST',
  body: JSON.stringify({ message, user_id: userId, session_id: sessionId }),
  signal,
})
```

Remove all imports of `src/shared/api/validation.ts`, then delete that file.

- [ ] **Step 7: Fix error merging and caller abort propagation**

In `parseErrorEnvelope`, resolve each field from nested detail first and root
second:

```ts
return {
  message:
    readString(detail, 'message', 'error', 'detail') ??
    readString(root, 'message', 'error', 'detail'),
  code:
    readString(detail, 'code', 'error_code') ??
    readString(root, 'code', 'error_code'),
  traceId:
    readString(detail, 'trace_id', 'traceId') ??
    readString(root, 'trace_id', 'traceId'),
}
```

Before registering the caller listener, propagate an existing abort:

```ts
if (options.signal?.aborted) {
  controller.abort(options.signal.reason)
} else {
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })
}
```

Attach the caught cause when rethrowing the configuration error in
`src/app/config.ts`:

```ts
throw new Error(`Invalid VITE_API_BASE_URL: ${reason}`, { cause: error })
```

- [ ] **Step 8: Verify API behavior**

Run the command from Step 4.

Expected: every listed API/request test passes.

---

### Task 3: Add Query Providers And Cancellable Server State

**Files:**

- Create: `src/app/queryClient.ts`
- Create: `src/app/providers.tsx`
- Modify: `src/main.tsx`
- Modify: `src/features/health/hooks/useHealth.ts`
- Modify: `src/features/documents/hooks/useDocuments.ts`
- Modify: `src/features/chat/ChatFeature.tsx`
- Modify: `src/App.tsx`
- Create: `src/test/render.tsx`
- Create: `src/features/health/components/HealthIndicator.test.tsx`
- Create: `src/features/documents/components/KnowledgeBaseSummary.test.tsx`

**Interfaces:**

- `createQueryClient(): QueryClient` returns an isolated client for production and tests.
- `AppProviders({ children })` supplies the production Query client.
- `renderWithProviders(ui)` supplies a fresh no-retry Query client to each UI test.
- `useHealth()` continues returning `{ health, status, refresh }`.
- `useDocuments()` continues returning `{ data, error, isLoading, retry }`.
- `ChatFeature` accepts `knowledgeBaseSummary: ReactNode` from `App`.

- [ ] **Step 1: Write failing health and documents UI tests**

Use MSW and `renderWithProviders` to assert:

```ts
function HealthHarness() {
  const { health, status, refresh } = useHealth()

  return (
    <HealthIndicator
      health={health}
      status={status}
      onRefresh={() => void refresh()}
    />
  )
}

it('shows online health returned by the API', async () => {
  renderWithProviders(<HealthHarness />)
  expect(await screen.findByRole('button', { name: /API online/i })).toBeVisible()
})

it('recovers when document retry succeeds', async () => {
  let calls = 0
  server.use(
    http.get(`${API_BASE}/api/documents`, () => {
      calls += 1
      return calls === 1
        ? HttpResponse.error()
        : HttpResponse.json(documentsFixture)
    }),
  )
  renderWithProviders(<KnowledgeBaseSummary />)
  await userEvent.click(await screen.findByRole('button', { name: /retry/i }))
  expect(await screen.findByText('pricing.md')).toBeVisible()
})
```

- [ ] **Step 2: Run UI tests to verify they fail without Query infrastructure**

Run:

```powershell
npm run test:run -- src/features/health/components/HealthIndicator.test.tsx src/features/documents/components/KnowledgeBaseSummary.test.tsx
```

Expected: tests fail because providers and Query-backed hooks do not exist.

- [ ] **Step 3: Add Query client and providers**

Implement:

```ts
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
```

`AppProviders` holds one client with lazy state and renders
`<QueryClientProvider client={queryClient}>`. Wrap `<App />` in `main.tsx`.

- [ ] **Step 4: Replace effect-driven health and document state**

Use Query functions that consume Query's signal:

```ts
const query = useQuery({
  queryKey: ['health'],
  queryFn: ({ signal }) => fetchHealth(signal),
  refetchInterval: 45_000,
})
```

Derive health status from `query.isPending`, `query.isError`, and
`query.data.status`. For documents, use `queryKey: ['documents']` and return
`retry: query.refetch`. Remove effect-owned `AbortController` code.

- [ ] **Step 5: Restore feature boundaries**

Change `ChatFeature` to accept:

```ts
interface ChatFeatureProps {
  knowledgeBaseSummary: ReactNode
}
```

Render that node in the side rail and remove the documents-feature import.
Compose it in `App.tsx`:

```tsx
<ChatFeature knowledgeBaseSummary={<KnowledgeBaseSummary />} />
```

- [ ] **Step 6: Add the Query-aware test renderer**

Implement `renderWithProviders` with a fresh client configured with
`queries.retry = false`, `mutations.retry = false`, and a `QueryClientProvider`.
Return the normal Testing Library render result and the client.

- [ ] **Step 7: Verify server-state behavior and lint regression**

Run:

```powershell
npm run test:run -- src/features/health/components/HealthIndicator.test.tsx src/features/documents/components/KnowledgeBaseSummary.test.tsx
npm run lint
```

Expected: both UI test files pass and the two former
`react-hooks/set-state-in-effect` errors are absent.

---

### Task 4: Move Chat Requests To A Tested Mutation Lifecycle

**Files:**

- Modify: `src/features/chat/hooks/useChat.ts`
- Modify: `src/features/chat/ChatFeature.tsx`
- Modify: `src/features/chat/components/ChatMessage.tsx`
- Create: `src/features/chat/ChatFeature.test.tsx`

**Interfaces:**

- `useChat()` retains `messages`, `isPending`, `error`, `sessionId`, `submit`, `clear`, and `retry`.
- The transcript remains local state; only request execution uses `useMutation`.
- Clearing aborts the active request and calls `mutation.reset()`.

- [ ] **Step 1: Write failing end-to-end chat component tests**

Cover submission and metadata in one behavioral test:

```ts
it('renders the complete assistant response after submission', async () => {
  const user = userEvent.setup()
  renderWithProviders(
    <ChatFeature knowledgeBaseSummary={<div>Knowledge test double</div>} />,
  )

  await user.type(
    screen.getByRole('textbox', { name: /message the doc helper/i }),
    'What is the demonstration price?',
  )
  await user.click(screen.getByRole('button', { name: /^send$/i }))

  expect(await screen.findByText(chatFixture.message)).toBeVisible()
  expect(screen.getByText(/Pricing Question/i)).toBeVisible()
  expect(screen.getByText(/Answer With Rag/i)).toBeVisible()
  expect(screen.getByText('pricing.md')).toBeVisible()
  expect(screen.getByText(/trace-demo-001/i)).toBeVisible()
})
```

Add separate tests for duplicate submission, `crm_unavailable`, network failure,
retry without a second user bubble, emergency warning, starter prompt population,
Enter/Shift+Enter, and clear-conversation session rotation.

- [ ] **Step 2: Run the chat tests and record failures**

Run:

```powershell
npm run test:run -- src/features/chat/ChatFeature.test.tsx
```

Expected: tests fail until the Query provider/mutation and accessible completion
announcement are integrated.

- [ ] **Step 3: Implement the no-retry chat mutation**

Create the mutation inside `useChat`:

```ts
const mutation = useMutation({
  mutationFn: sendChat,
  retry: false,
})
```

Keep the request lock and active controller. `execute` passes message, IDs, and
signal to `mutation.mutateAsync`, appends the response on success, and maps errors
through `getSafeErrorMessage`. Use `mutation.isPending` for rendered pending state.
On clear, abort, reset local transcript/error, call `mutation.reset()`, and rotate
the session.

- [ ] **Step 4: Fix starter prompt typing**

Declare an explicit prompt type:

```ts
interface StarterPrompt {
  label: string
  type: string
  safety?: boolean
}

const starterPrompts: readonly StarterPrompt[] = [
  { label: 'What are your opening hours?', type: 'General' },
  { label: 'How much does teeth whitening cost?', type: 'Pricing' },
  {
    label: 'I want to book a whitening appointment next Friday.',
    type: 'Appointment',
  },
  { label: 'What is your cancellation policy?', type: 'Policy' },
  {
    label: 'I have severe pain and swelling. What should I do?',
    type: 'Safety demo',
    safety: true,
  },
]
```

- [ ] **Step 5: Announce completed assistant responses**

For non-welcome assistant messages, set a polite live region on the article:

```tsx
aria-live={!isUser && !message.isWelcome ? 'polite' : undefined}
```

Keep the existing pending status announcement and avoid changing backend text.

- [ ] **Step 6: Verify all chat behavior**

Run the command from Step 2.

Expected: every chat behavior test passes, including no duplicate request while
pending and a new session after clear.

---

### Task 5: Harden Privacy, Accessibility, Contrast, And Strict Types

**Files:**

- Modify: `src/shared/lib/format.ts`
- Create: `src/shared/lib/format.test.ts`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/ui.module.css`
- Modify: any source file reported by strict TypeScript, without weakening strict mode

**Interfaces:**

- `sanitizeStructuredData(value: unknown): unknown` recursively removes sensitive fields.
- `formatStructuredData(value: unknown): string` remains the only tool-result formatter.

- [ ] **Step 1: Write failing sensitive-data regression tests**

Add:

```ts
it('redacts common identity and medical fields recursively', () => {
  const result = sanitizeStructuredData({
    full_name: 'Example Person',
    address: 'Example address',
    nested: {
      date_of_birth: '2000-01-01',
      medical_record_number: 'demo-record',
      available_slots: ['Friday 10:00'],
    },
  })

  expect(result).toEqual({
    nested: { available_slots: ['Friday 10:00'] },
  })
})
```

- [ ] **Step 2: Run the formatter test to verify failure**

Run:

```powershell
npm run test:run -- src/shared/lib/format.test.ts
```

Expected: identity and birth-date fields remain before the fix.

- [ ] **Step 3: Expand sensitive-key redaction**

Use a documented closed pattern that includes credentials, contact details,
patient identifiers, names, addresses, birth dates, and medical record keys:

```ts
const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|password|secret|token|email|phone|patient|ssn|full_?name|first_?name|last_?name|address|date_?of_?birth|dob|medical_?record/i
```

Keep recursive arrays and objects unchanged except for removed keys.

- [ ] **Step 4: Correct contrast tokens**

Change `--color-text-soft` to `#667774`, use that token for the textarea
prompt text instead of `#899895`, and retain the current visual hierarchy. This
provides sufficient contrast for the existing small labels on white surfaces.

- [ ] **Step 5: Run strict type-check and fix reported source errors**

Run:

```powershell
npm run typecheck
```

Expected before final fixes: strict-mode diagnostics identify exact unsafe or
optional accesses. Fix each at its source with narrowing or explicit types; do not
add `any`, non-null assertions, or disable compiler rules. Re-run until exit `0`.

- [ ] **Step 6: Verify formatter and accessibility-related tests**

Run:

```powershell
npm run test:run -- src/shared/lib/format.test.ts src/features/chat/ChatFeature.test.tsx
npm run typecheck
```

Expected: all commands exit `0`.

---

### Task 6: Add CI And Repair The Deployment Workflow

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**

- CI runs for pull requests and pushes to `main` with no AWS credentials.
- Deployment retains OIDC only in the deployment job and uses the tested `dist` artifact.

- [ ] **Step 1: Add the CI workflow**

Create a least-permission workflow with:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:run
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-dist-${{ github.sha }}
          path: dist
          if-no-files-found: error
          retention-days: 7
```

- [ ] **Step 2: Make deployment build configuration deterministic**

Keep the existing workflow, valid `.nvmrc`, and newly implemented scripts. Set
safe public fallbacks at workflow scope so environment-scoped variables are not
silently absent in the quality job:

```yaml
env:
  AWS_REGION: ${{ vars.AWS_REGION || 'us-east-1' }}
  VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL || 'https://api.albertlukmanovlabs.lol' }}
  VITE_APP_ENV: production
  VITE_GITHUB_REPOSITORY_URL: https://github.com/etonealbert/doc-helper-ai-agent-web
```

Do not add AWS provisioning or credentials.

- [ ] **Step 3: Prevent immediate deletion of old immutable assets**

Remove `--delete` from the immutable `dist/assets` sync. Keep `--delete` only for
non-hashed files and retain narrow invalidation of `/` and `/index.html`. This
prevents a previously cached shell from referencing an asset removed during the
new release.

- [ ] **Step 4: Statically validate workflow YAML and repository references**

Run:

```powershell
npm run format:check
git diff --check
```

Expected: no formatting or whitespace errors. Do not run deployment or AWS
commands.

---

### Task 7: Update Current Documentation And Task Tracking

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/architecture.md`
- Modify: `docs/api.md`
- Modify: `docs/conventions.md`
- Modify: `docs/deployment.md`
- Modify: `docs/roadmap.md`
- Modify: `.agent/context/frontend.md`
- Modify: `.agent/context/testing.md`
- Modify: `.agent/tasks/current.md`
- Modify: `.agent/tasks/backlog.md`

**Interfaces:**

- Documentation lists only commands and capabilities that exist in the final tree.
- Deployment documentation continues to state that Terraform, DNS, backend CORS,
  AWS provisioning, and verified production deployment remain outside this change.

- [ ] **Step 1: Replace the malformed README with current project documentation**

Remove the Vite template section and broken code fence. Include the portfolio
disclaimer, implemented features, Query/Zod/test stack, local setup, environment
variables, all five quality commands, architecture diagram, CI behavior, intended
AWS topology, backend CORS requirement, known deployment limitations, and a
fictional demonstration walkthrough.

- [ ] **Step 2: Update architecture and API contracts**

Document Query ownership for health/documents/chat mutation, local transcript
ownership, Zod schemas, defaulted chat metadata, strict tool statuses, mixed error
envelopes, timeout/cancellation, and app-level cross-feature composition.

- [ ] **Step 3: Update agent and testing guidance**

List these available commands verbatim:

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

Change testing status from future to current, describe MSW isolation, and remove
completed test/CI work from the roadmap.

- [ ] **Step 4: Update current and backlog task files**

Mark frontend quality, tests, and CI as the current completed milestone after the
final gate succeeds. Keep Terraform, deployment, backend CORS, DNS, authentication,
streaming, analytics, and other deferred product work in backlog only.

- [ ] **Step 5: Check documentation consistency**

Run:

```powershell
rg "no automated test|not included yet|strict mode|test:run|format:check|Terraform" README.md AGENTS.md docs .agent
```

Expected: references accurately distinguish implemented frontend quality tooling
from still-missing infrastructure and external deployment work.

---

### Task 8: Run The Full Release Gate And Review The Diff

**Files:**

- Review: all changed files

**Interfaces:**

- Produces: fresh command evidence for every acceptance criterion.

- [ ] **Step 1: Format the implementation**

Run:

```powershell
npm run format
```

Expected: Prettier formats supported repository files.

- [ ] **Step 2: Run all required gates independently**

Run each command and retain its complete result:

```powershell
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

Expected: every command exits `0`; tests report zero failures and Vite writes
`dist/`.

- [ ] **Step 3: Smoke-test the production bundle locally**

Start `npm run preview -- --host 127.0.0.1`, request the printed local URL, verify
that it returns `index.html`, then stop the preview process. Do not call the
deployed API from automated tests.

- [ ] **Step 4: Inspect repository state and diff**

Run:

```powershell
git status --short
git diff --check
git diff --stat
git diff
```

Expected: no whitespace errors, no generated `dist` files tracked, no Terraform
or AWS changes, and only intended frontend, test, workflow, and documentation
changes.

- [ ] **Step 5: Request final code review**

Dispatch a reviewer with the design spec, this plan, base commit, and current
working-tree diff. Resolve all critical and important findings, then rerun Step 2
before reporting completion.
