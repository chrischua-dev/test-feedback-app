# Implementation Plan: Workshop Feedback App

## Overview

Build a React + TypeScript + Vite single-page feedback app in two phases: first a fully functional local-only mode using `useState`, then an Amplify Gen 2 Data integration layer that persists entries to the cloud. The component tree is flat and beginner-readable; state is lifted to `App`. Testing uses Vitest + React Testing Library for component/integration tests and fast-check for property-based tests targeting the 9 correctness properties defined in the design.

## Tasks

- [x] 1. Set up types, testing framework, and shared utilities
  - [x] 1.1 Create `src/types.ts` with `FeedbackEntry`, `FormState`, and `ValidationErrors` interfaces
    - Define `FeedbackEntry` (id, name, rating, comment, createdAt?)
    - Define `FormState` (name, rating | null, comment)
    - Define `ValidationErrors` (name?, rating?, comment?)
    - _Requirements: 1.1, 2.1, 3.1, 4.2_
  - [x] 1.2 Install and configure Vitest + React Testing Library + fast-check
    - Install `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fast-check` as dev dependencies
    - Add `vitest.config.ts` (or extend `vite.config.ts`) with jsdom environment and `@testing-library/jest-dom` setup file
    - Add a `src/setupTests.ts` that imports `@testing-library/jest-dom`
    - Add `"test": "vitest --run"` script to `package.json`
    - _Requirements: (testing infrastructure)_

- [x] 2. Implement `validateForm` and property-based tests
  - [x] 2.1 Create `src/validation.ts` implementing `validateForm(state: FormState): ValidationErrors`
    - Trim name and comment before checking for empty
    - Return `"Name is required"` if trimmed name is empty
    - Return `"Please select a rating"` if rating is null
    - Return `"Comment is required"` if trimmed comment is empty
    - Return empty object `{}` when all fields are valid
    - _Requirements: 1.3, 2.3, 3.3_
  - [ ]* 2.2 Write property test — Property 1: Whitespace-only fields are rejected
    - **Property 1: Whitespace-only name/comment strings → validator returns required-field error**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 })` for whitespace-only strings
    - Assert `errors.name === "Name is required"` and `errors.comment === "Comment is required"`
    - **Validates: Requirements 1.3, 3.3**
  - [ ]* 2.3 Write property test — Property 4: Valid submission adds exactly one entry
    - **Property 4: Any valid FormState → local submission increases entries length by exactly 1 with matching trimmed fields**
    - Use `fc.record({ name: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0), rating: fc.integer({ min: 1, max: 5 }), comment: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0) })`
    - Invoke `validateForm`; assert errors object is empty, then simulate submission and check entries delta
    - **Validates: Requirements 4.2**
  - [ ]* 2.4 Write property test — Property 5: Form resets after every successful submission
    - **Property 5: After valid local-mode submission, form name === "", rating === null, comment === ""**
    - Generate valid `FormState` records as in Property 4
    - After submission render, assert controlled input values are reset
    - **Validates: Requirements 4.3**

- [x] 3. Implement `StarRating` component
  - [x] 3.1 Create `src/components/StarRating.tsx` and `StarRating.css`
    - Render exactly 5 `<button>` elements with `type="button"`
    - Each button gets `aria-label="Rate N out of 5"` where N is its position
    - Apply a filled CSS class to stars 1–N when `value` is N
    - Call `onChange(N)` on click
    - Display `error` string below the group when provided; link group to error via `aria-describedby`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.2, 7.4_
  - [ ]* 3.2 Write property test — Property 2: Star selection stores the selected rating
    - **Property 2: For any N in {1..5}, clicking star N sets value === N and fills stars 1..N**
    - Use `fc.integer({ min: 1, max: 5 })` and render `StarRating` with a controlled mock onChange
    - Assert `onChange` was called with N and that rendered buttons have the correct CSS class state
    - **Validates: Requirements 2.2, 2.4**

- [x] 4. Implement `FeedbackForm` component
  - [x] 4.1 Create `src/components/FeedbackForm.tsx` and `FeedbackForm.css`
    - Render Name `<input type="text">` with visible `<label>`, `placeholder="Your name"`, `maxLength={100}`, correct `for`/`id` pairing
    - Render `<StarRating>` controlled by local `formState.rating`
    - Render Comment `<textarea>` with visible `<label>`, `rows={3}`, `maxLength={500}`, correct `for`/`id` pairing
    - Render remaining-character count: `"${500 - comment.length} / 500 characters remaining"`
    - Render Submit button labelled "Submit Feedback"
    - Manage `formState: FormState` and `errors: ValidationErrors` in local state
    - On submit: run `validateForm`; if errors exist, set them and abort; otherwise call `props.onSubmit` and await
    - Display each error string in a `<span>` immediately below its field; link via `aria-describedby`
    - Disable submit button and show loading state when `isSubmitting` is true
    - Display `submitError` near the Submit button when non-null
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.3, 6.4, 7.1, 7.4_
  - [ ]* 4.2 Write property test — Property 3: Comment counter reflects remaining capacity
    - **Property 3: For any comment string s with length in [0, 500], counter text equals `"${500 - s.length} / 500 characters remaining"`**
    - Use `fc.string({ maxLength: 500 })` and render `FeedbackForm` with mock props
    - Fire change event on textarea, assert displayed counter matches formula
    - **Validates: Requirements 3.2**
  - [ ]* 4.3 Write property test — Property 9: Validation errors are linked via aria-describedby
    - **Property 9: For any submission where fields fail validation, each errored input's aria-describedby matches its error span's id**
    - Use `fc.record` to generate invalid form states (empty name, null rating, empty comment — any combination)
    - Submit form and assert `aria-describedby` on each errored field matches the `id` of the error `<span>`
    - **Validates: Requirements 7.4**

- [x] 5. Implement `FeedbackCard` component
  - [x] 5.1 Create `src/components/FeedbackCard.tsx` and `FeedbackCard.css`
    - Display `entry.name`, `entry.comment`
    - Display rating as `"${entry.rating} / 5"`
    - _Requirements: 5.2_
  - [ ]* 5.2 Write property test — Property 8: Rating is rendered in "N / 5" format
    - **Property 8: For any FeedbackEntry with rating N in {1..5}, FeedbackCard renders the text `"${N} / 5"`**
    - Use `fc.integer({ min: 1, max: 5 })` to generate ratings; build a minimal `FeedbackEntry` record
    - Render `FeedbackCard` and assert text content contains the expected string
    - **Validates: Requirements 5.2**

- [x] 6. Implement `FeedbackList` component
  - [x] 6.1 Create `src/components/FeedbackList.tsx` and `FeedbackList.css`
    - Accept `entries: FeedbackEntry[]`, `isLoading: boolean`, `loadError: string | null` as props
    - When `isLoading` is true, render a loading indicator
    - When `loadError` is non-null, render the error string as a banner above the list
    - When `entries` is empty and not loading, render `"No feedback yet. Be the first to share yours!"`
    - Otherwise render an ordered list of `<FeedbackCard>` elements in the provided array order (caller is responsible for ordering)
    - _Requirements: 5.1, 5.3, 5.4, 6.2, 6.5_
  - [ ]* 6.2 Write property test — Property 7: Every entry in state is rendered in the list
    - **Property 7: For any array of FeedbackEntry objects, every entry's name and comment appear in FeedbackList's rendered output**
    - Use `fc.array(fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1 }), rating: fc.integer({ min: 1, max: 5 }), comment: fc.string({ minLength: 1 }) }), { minLength: 1 })`
    - Render `FeedbackList` with the generated entries array and assert each name and comment is in the DOM
    - **Validates: Requirements 5.1**

- [x] 7. Checkpoint — Wire local-only mode in `App` and verify core flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `App` component — local-only mode
  - [x] 8.1 Rewrite `src/App.tsx` to own `entries`, `isLoading`, `loadError`, `isSubmitting`, `submitError` state
    - Import `FeedbackForm`, `FeedbackList`, and `FeedbackEntry` type
    - Implement `handleSubmit`: create a `FeedbackEntry` with `crypto.randomUUID()`, prepend to `entries`
    - Pass `handleSubmit`, `isSubmitting`, and `submitError` to `FeedbackForm`
    - Pass `entries`, `isLoading`, and `loadError` to `FeedbackList`
    - Gate Amplify logic behind `amplifyConfigured` flag (start as `false`)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.3, 5.4_
  - [ ]* 8.2 Write property test — Property 6: Most recently submitted entry is always at index 0
    - **Property 6: After any sequence of two or more valid submissions, entries[0] is always the most recently submitted entry**
    - Use `fc.array(validFormStateArbitrary, { minLength: 2 })` and simulate sequential submissions
    - After each submission assert `entries[0]` matches the last submitted data
    - **Validates: Requirements 4.5, 5.4**

- [x] 9. Checkpoint — Verify end-to-end local-only mode
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Amplify Gen 2 backend schema
  - [x] 10.1 Create `amplify/backend.ts` and `amplify/data/resource.ts`
    - Define `FeedbackEntry` model with `name` (string, required), `rating` (integer, required), `comment` (string, required)
    - Set authorization to `allow.publicApiKey()`
    - Export `Schema` type and `data` constant with `defaultAuthorizationMode: 'apiKey'`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Integrate Amplify into `App` — connected mode
  - [x] 11.1 Add dynamic Amplify import and `amplifyConfigured` runtime gate in `App.tsx`
    - Wrap `import('../amplify_outputs.json')` + `Amplify.configure(...)` in try/catch at module level
    - Set `amplifyConfigured = true` only on success
    - Install `aws-amplify` as a runtime dependency
    - _Requirements: 6.1, 6.3_
  - [x] 11.2 Augment `handleSubmit` in `App.tsx` for Amplify-connected mode
    - When `amplifyConfigured`: set `isSubmitting(true)`, call `client.models.FeedbackEntry.create(formData)`, prepend saved entry, clear `submitError`; on error set `submitError` message; always clear `isSubmitting`
    - When not configured: keep existing local-only path
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 11.3 Add `useEffect` in `App.tsx` to fetch entries on mount when `amplifyConfigured`
    - Set `isLoading(true)`, call `client.models.FeedbackEntry.list()`, sort by `createdAt` desc, update `entries`; on error set `loadError` message; always clear `isLoading`
    - _Requirements: 6.2, 6.5_
  - [ ]* 11.4 Write integration tests for Amplify-connected mode
    - Mock `aws-amplify` client; verify `create` is called on valid submission
    - Verify `list` is called on mount and entries are rendered
    - Verify `submitError` appears and form values are preserved when `create` rejects
    - Verify `loadError` banner appears and local entries remain when `list` rejects
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Final checkpoint — Full test suite green
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 7, 9, and 12 ensure incremental validation before moving to the next phase
- Property tests validate universal correctness across arbitrary inputs; unit tests cover specific examples and edge cases
- The Amplify integration (tasks 10–11) is intentionally separated so the app is fully functional in local-only mode first, mirroring the workshop's progressive disclosure approach

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "10.1"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2", "11.3"] },
    { "id": 9, "tasks": ["11.4"] }
  ]
}
```
