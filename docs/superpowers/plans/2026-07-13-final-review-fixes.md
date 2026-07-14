# Final Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every final-review privacy, contract, accessibility, deployment-configuration, documentation, and error-coverage finding without changing the backend or deploying infrastructure.

**Architecture:** Keep chat transcript data in React state while a void TanStack mutation tracks only request lifecycle; operation-owned refs carry request and response payloads outside Query cache and are cleared with ownership checks. Keep endpoint validation in feature Zod schemas, structured-result redaction in the shared formatter, and production build configuration in the existing artifact-based workflow.

**Tech Stack:** React 19, TanStack Query 5, Zod 4, Vitest, React Testing Library, MSW, GitHub Actions, TypeScript 6.

## Global Constraints

- Follow test-first red-green cycles for behavior changes and record exact evidence in `.superpowers/sdd/task-8-report.md`.
- Keep the portfolio-demonstration and medical-safety boundaries unchanged.
- Do not commit, push, deploy, invoke AWS, add Terraform, or modify the backend.
- Preserve unrelated working-tree changes.
- Run format, all five quality gates, build, and `git diff --check` before completion.

---

### Task 1: Remove Sensitive Chat Payloads From Mutation Cache

**Files:**

- Modify: `src/features/chat/ChatFeature.test.tsx`
- Modify: `src/features/chat/hooks/useChat.ts`

**Interfaces:**

- `useChat()` retains its existing public return shape and behavior.
- The Query mutation consumes and returns `void`, uses `retry: false` and `gcTime: 0`.

- [ ] Add a success-path test that captures request IDs through MSW, verifies in-flight mutation variables/data contain no request or response payload, and verifies the cache is empty after completion.
- [ ] Add clear-path cache assertions to prove no submitted text, IDs, response text, or action data survive clear.
- [ ] Run `npm run test:run -- src/features/chat/ChatFeature.test.tsx` and verify privacy assertions fail against the current mutation.
- [ ] Refactor `useChat` so operation-owned refs carry request/response data, call `mutateAsync()` without variables, return no mutation data, and clear/reset only the operation still owned by that execution.
- [ ] Re-run the focused chat tests and verify success, clear, retry, abort, and stale-response behavior remain green.

### Task 2: Harden Structured-Result Container Redaction

**Files:**

- Modify: `src/shared/lib/format.test.ts`
- Modify: `src/shared/lib/format.ts`

**Interfaces:**

- `sanitizeStructuredData(value)` remains recursive and preserves safe keys.

- [ ] Add nested container tests for normalized patient, medical-record, address-line, and contact keys while retaining safe token/cookie-policy/secretary keys.
- [ ] Run `npm run test:run -- src/shared/lib/format.test.ts` and verify sensitive containers remain before the fix.
- [ ] Add normalized delimiter-aware container matching without broad substring matching.
- [ ] Re-run the formatter tests and verify all redaction and safe-key cases pass.

### Task 3: Match Deployed Document And Action Schemas

**Files:**

- Modify: `src/features/documents/api/documentsApi.test.ts`
- Modify: `src/features/documents/api/documentSchemas.ts`
- Modify: `src/features/chat/api/chatApi.test.ts`
- Modify: `src/features/chat/api/chatSchemas.ts`
- Modify: `src/features/chat/model/types.ts`
- Modify: `docs/api.md`
- Modify: `.agent/context/backend.md`
- Modify: `.agent/context/frontend.md`

**Interfaces:**

- `{}` parses as `{ documents: [], totalDocuments: 0, totalChunks: 0 }`.
- Omitted action `result` maps to `null`; a present result must be a record object.

- [ ] Add the empty-document-response regression and present-invalid action-result contract cases.
- [ ] Run both endpoint test files and verify the new regressions fail for the expected schema reasons.
- [ ] Add document defaults and an optional object-only action-result transform to `null`.
- [ ] Narrow `ToolAction.result` to `Record<string, unknown> | null`.
- [ ] Re-run endpoint tests and update API/backend/frontend contract documentation.

### Task 4: Use A Persistent Assistant Announcement Region

**Files:**

- Modify: `src/features/chat/ChatFeature.test.tsx`
- Modify: `src/features/chat/ChatFeature.tsx`
- Modify: `src/features/chat/components/ChatMessage.tsx`
- Modify: `docs/architecture.md`

**Interfaces:**

- A polite atomic region exists empty at initial mount and receives the latest completed non-welcome assistant answer.
- Pending status remains independently accessible.

- [ ] Change the announcement test to capture the region before submission and assert the same node receives the completed answer.
- [ ] Run the focused test and verify the persistent region is missing.
- [ ] Render the region unconditionally in `ChatFeature`, derive only completed assistant answer text, and remove `aria-live` from inserted message articles.
- [ ] Re-run chat tests and document the persistent announcement behavior.

### Task 5: Bind Production Build To Its GitHub Environment

**Files:**

- Create: `.github/workflows/deploy.test.ts`
- Modify: `.github/workflows/deploy.yml`
- Modify: `docs/deployment.md`
- Modify: `.agent/context/aws.md`
- Modify: `README.md`

**Interfaces:**

- The quality/build and deploy jobs both reference `production`.
- Only deploy grants `id-token: write`; quality retains read-only permissions.

- [ ] Add a static workflow regression that scopes each job and checks production binding and OIDC permissions.
- [ ] Run the workflow test and verify quality lacks the environment binding.
- [ ] Add the production environment to quality without changing deploy permissions.
- [ ] Re-run the workflow test and document that environment approval/configuration precedes the production build and deployment remains separately protected.

### Task 6: Add Safe Error Mapping Coverage

**Files:**

- Modify: `src/shared/api/request.test.ts`
- Modify: `.agent/context/testing.md`

**Interfaces:**

- Existing `ApiError` kinds and `getSafeErrorMessage` copy remain unchanged.

- [ ] Add MSW cases for `422`, `429`, and generic `5xx`, asserting status, kind, and exact safe copy.
- [ ] Run the focused request tests; if existing behavior is already correct, record these as coverage-only green characterization tests rather than fabricating a red result.
- [ ] Update testing context coverage.

### Task 7: Final Verification And Evidence

**Files:**

- Modify: `.superpowers/sdd/task-8-report.md`

**Interfaces:**

- The report contains exact red-green and final gate evidence.

- [ ] Run `npm run format`.
- [ ] Run `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:run`, and `npm run build` independently.
- [ ] Run `git diff --check`, inspect `git status --short`, `git diff --stat`, and the complete relevant diff.
- [ ] Append `Final Review Fixes` with command exits, test count, red-green evidence, changed scope, and residual concerns.
- [ ] Do not start preview unless bounded cleanup is guaranteed; otherwise record that it remains for the controller.

### Task 8: Keep Chat Failures Out Of Mutation State

**Files:**

- Modify: `src/features/chat/ChatFeature.test.tsx`
- Modify: `src/features/chat/hooks/useChat.ts`
- Modify: `docs/api.md`
- Modify: `docs/architecture.md`

**Interfaces:**

- The void Query mutation always resolves without variables, data, error, or failure reason.
- Operation-owned refs carry either the validated response or caught failure to `execute`.

- [ ] Subscribe to MutationCache in network and backend-error component tests and record every variables/data/error/failureReason transition.
- [ ] Run the focused chat file and verify the current rejected mutation exposes failure state.
- [ ] Catch `sendChat` inside `mutationFn`, store the cause only for the still-owned operation, and resolve the mutation.
- [ ] Re-throw the operation-owned cause from `execute` after `mutateAsync` resolves so existing local safe-error handling and retry behavior remain unchanged.
- [ ] Clear failure refs on start, success handling, clear, unmount, and ownership-checked finalization.
- [ ] Re-run all chat tests and document that failures never enter MutationCache.

### Task 9: Redact Explicit Direct Sensitive Qualifiers

**Files:**

- Modify: `src/shared/lib/format.test.ts`
- Modify: `src/shared/lib/format.ts`

**Interfaces:**

- Normalized sensitive aliases may be followed only by closed qualifiers such as `value` and `payload`.
- Safe `token_count`, `cookie_policy_url`, and `secretary_available` keys remain visible.

- [ ] Add failing nested tests for `email_value`, `phone_payload`, and `token_value` plus safe-key controls.
- [ ] Run the focused formatter test and verify the three direct-prefix variants survive.
- [ ] Add delimiter-aware alias-plus-qualifier matching without generic substring matching.
- [ ] Re-run the formatter tests and verify sensitive variants are removed and controls remain.

### Task 10: Re-announce Identical Completed Responses

**Files:**

- Modify: `src/features/chat/ChatFeature.test.tsx`
- Modify: `src/features/chat/ChatFeature.tsx`
- Modify: `docs/architecture.md`

**Interfaces:**

- The same persistent polite/atomic region clears while any subsequent chat request is pending.
- Completion repopulates it even when the new answer text equals the preceding answer.

- [ ] Add a two-response test that captures the initial region, blocks request two, verifies the same node clears, then releases an identical answer and verifies repopulation.
- [ ] Run the focused chat test and verify the region incorrectly retains the first answer while request two is pending.
- [ ] Gate the derived completion announcement on `isPending` while preserving the separate pending status.
- [ ] Re-run chat tests and update accessibility wording.

### Task 11: Follow-up Verification Evidence

**Files:**

- Modify: `.superpowers/sdd/task-8-report.md`

**Interfaces:**

- The report appends exact remaining-findings red-green and final-gate results.

- [ ] Run `npm run format`.
- [ ] Run lint, format check, typecheck, the complete test suite, and build independently.
- [ ] Run `git diff --check` and inspect status/stat/relevant diffs.
- [ ] Append exact test counts, gate exits, changed scope, and concerns without running preview.

### Task 12: Keep Historical Answers Out Of Failed-Request Announcements

**Files:**

- Modify: `src/features/chat/ChatFeature.test.tsx`
- Modify: `src/features/chat/ChatFeature.tsx`
- Modify: `docs/architecture.md`
- Modify: `.superpowers/sdd/task-8-report.md`
- Modify: `.superpowers/sdd/final-review-package.md`

**Interfaces:**

- The existing persistent assistant completion region is empty while pending and while the current request has a local error.
- Historical successful answers remain visibly rendered, and retry behavior remains unchanged.

- [ ] Add a deterministic test that succeeds once, blocks request two, verifies the same region clears, releases a network failure, and verifies safe error UI plus an empty region and visible historical answer.
- [ ] Run `npm run test:run -- src/features/chat/ChatFeature.test.tsx` and verify the region repopulates the historical answer after failure.
- [ ] Gate completion announcement derivation on `isPending || error`.
- [ ] Re-run focused chat tests and update accessibility wording.
- [ ] Run format, lint, format check, typecheck, full tests, build, and `git diff --check`.
- [ ] Append exact red-green/gate evidence to Task 8 and update the final review package test count.
