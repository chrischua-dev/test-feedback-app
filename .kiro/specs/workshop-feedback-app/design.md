# Design Document — Workshop Feedback App

## Overview

The Workshop Feedback App is a single-page React application that lets workshop participants submit and view feedback in real time. The design prioritises beginner-readability: a flat component hierarchy, co-located CSS, minimal abstractions, and no third-party UI library.

The app is architected in two modes that coexist in the same codebase:

- **Local-only mode** — state lives in `useState` inside `App`. No external dependencies are required; the app runs entirely in the browser.
- **Amplify-connected mode** — the same state management is augmented with Amplify Gen 2 Data calls. The integration is gated by a runtime check (`isAmplifyConfigured`) so the app degrades gracefully when Amplify is not yet set up.

This dual-mode design lets workshop instructors walk participants through the app in phases: first build the local React app, then progressively add cloud persistence.

---

## Architecture

### High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  App (root state owner)                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │  FeedbackForm            │  │  FeedbackList                │  │
│  │  ┌────────────────────┐  │  │  ┌──────────────────────┐   │  │
│  │  │  StarRating        │  │  │  │  FeedbackCard (×N)   │   │  │
│  │  └────────────────────┘  │  │  └──────────────────────┘   │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
          │ onSubmit(entry)                 ↑ entries[]
          └─────────────────────────────────┘
```

State is **lifted to `App`**. `FeedbackForm` reports a completed submission upward via `onSubmit`; `FeedbackList` receives the current `entries` array as a prop. Neither child component owns persistent state — they are fully controlled.

### Amplify Integration Layer

```
App
 └─ useAmplify (custom hook, optional)
     ├─ fetchEntries()   → Amplify.DataStore / client.models.FeedbackEntry.list()
     └─ saveEntry(entry) → client.models.FeedbackEntry.create()
```

The `useAmplify` hook is only invoked when `amplify_outputs.json` is present and importable. A try/catch around the dynamic import of `aws-exports` or `amplify_outputs` is the runtime gate. When Amplify is not configured the hook returns no-op functions and the app behaves as a local-only SPA.

---

## Components and Interfaces

### Component Hierarchy

| Component | File | Responsibility |
|---|---|---|
| `App` | `src/App.tsx` | Root; owns `entries` and `isLoading`/`error` state; wires form ↔ list |
| `FeedbackForm` | `src/components/FeedbackForm.tsx` | Controlled form; owns transient `formState` and `errors`; calls `onSubmit` |
| `StarRating` | `src/components/StarRating.tsx` | Renders 5 accessible star buttons; controlled via `value`/`onChange` props |
| `FeedbackList` | `src/components/FeedbackList.tsx` | Renders ordered list of entries or empty-state message |
| `FeedbackCard` | `src/components/FeedbackCard.tsx` | Renders a single feedback entry (name, rating, comment) |

### Component Props

```typescript
// App — no external props (root component)

interface FeedbackFormProps {
  onSubmit: (entry: Omit<FeedbackEntry, 'id'>) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

interface StarRatingProps {
  value: number | null;           // currently selected rating (null = unset)
  onChange: (rating: number) => void;
  error?: string;                 // validation error message
}

interface FeedbackListProps {
  entries: FeedbackEntry[];
  isLoading: boolean;
  loadError: string | null;
}

interface FeedbackCardProps {
  entry: FeedbackEntry;
}
```

---

## Data Models

### TypeScript Interfaces

```typescript
/** A single submitted feedback entry. */
export interface FeedbackEntry {
  id: string;           // UUID generated client-side (or returned by Amplify)
  name: string;         // Trimmed display name, 1–100 chars
  rating: number;       // Integer 1–5
  comment: string;      // Trimmed comment, 1–500 chars
  createdAt?: string;   // ISO 8601 timestamp; set by Amplify if connected
}

/** Mirrors the live values of the controlled form inputs. */
export interface FormState {
  name: string;
  rating: number | null;
  comment: string;
}

/** Keyed validation errors; undefined/empty string means "no error". */
export interface ValidationErrors {
  name?: string;
  rating?: string;
  comment?: string;
}
```

### Amplify Gen 2 Data Schema

```typescript
// amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  FeedbackEntry: a
    .model({
      name:    a.string().required(),
      rating:  a.integer().required(),
      comment: a.string().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema, authorizationModes: { defaultAuthorizationMode: 'apiKey' } });
```

The `id` and `createdAt` fields are auto-managed by Amplify and do not appear in the schema definition. Authorization uses a public API key — appropriate for a workshop with no authentication.

### Form Validation Logic

Validation runs synchronously inside `FeedbackForm` when the Submit button is clicked. The validator returns a `ValidationErrors` object; an empty object means all fields are valid.

```
validateForm(state: FormState): ValidationErrors
  name   → trim → empty?  → "Name is required"
           length > 100?  → (blocked by maxLength; not reachable)
  rating → null?          → "Please select a rating"
           < 1 || > 5?    → (blocked by StarRating; not reachable)
  comment → trim → empty? → "Comment is required"
            length > 500? → (blocked by maxLength; not reachable)
```

Errors are set in local component state (`setErrors`) and each error string is linked to its input via `aria-describedby`. The form does **not** submit if `Object.keys(errors).length > 0`.

### State Management in App

```typescript
// App.tsx — state shape
const [entries, setEntries]         = useState<FeedbackEntry[]>([]);
const [isLoading, setIsLoading]     = useState(false);       // Amplify fetch
const [loadError, setLoadError]     = useState<string|null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);     // Amplify save
const [submitError, setSubmitError] = useState<string|null>(null);
```

New entries are prepended (`[newEntry, ...entries]`) to maintain reverse-chronological order without sorting.

### Amplify Integration Pattern

```typescript
// Conditional Amplify import (top of App.tsx)
let amplifyConfigured = false;
try {
  const outputs = await import('../amplify_outputs.json');
  Amplify.configure(outputs.default);
  amplifyConfigured = true;
} catch {
  // amplify_outputs.json not present → local-only mode
}
```

Inside `App`, the `handleSubmit` callback branches:

```
handleSubmit(formData):
  if amplifyConfigured:
    setIsSubmitting(true)
    try:
      saved = await client.models.FeedbackEntry.create(formData)
      setEntries([toFeedbackEntry(saved), ...entries])
      setSubmitError(null)
    catch:
      setSubmitError("Failed to save feedback. Please try again.")
    finally:
      setIsSubmitting(false)
  else:
    newEntry = { ...formData, id: crypto.randomUUID() }
    setEntries([newEntry, ...entries])
```

On mount (`useEffect`), if `amplifyConfigured`:
```
fetchEntries():
  setIsLoading(true)
  try:
    { data } = await client.models.FeedbackEntry.list()
    setEntries(data.sort by createdAt desc)
    setLoadError(null)
  catch:
    setLoadError("Could not load feedback. Showing any locally added entries.")
  finally:
    setIsLoading(false)
```

---

## File Structure

```
src/
├── App.tsx                      # Root component; state owner
├── App.css                      # App-level layout styles
├── index.css                    # CSS reset + design tokens (fonts, colours, spacing)
├── main.tsx                     # React DOM entry point
├── types.ts                     # FeedbackEntry, FormState, ValidationErrors
├── components/
│   ├── FeedbackForm.tsx         # Controlled form with validation
│   ├── FeedbackForm.css
│   ├── StarRating.tsx           # Accessible 1–5 star input
│   ├── StarRating.css
│   ├── FeedbackList.tsx         # List container + empty state
│   ├── FeedbackList.css
│   ├── FeedbackCard.tsx         # Single entry card
│   └── FeedbackCard.css
amplify/
├── backend.ts                   # Amplify backend definition
└── data/
    └── resource.ts              # FeedbackEntry schema
```

---

## Error Handling

| Scenario | User-facing behaviour | Implementation detail |
|---|---|---|
| Name field empty on submit | "Name is required" below Name field | `validateForm` → `errors.name` set; `aria-describedby` links to error `<span>` |
| No star selected on submit | "Please select a rating" below star group | Same pattern; `errors.rating` |
| Comment field empty on submit | "Comment is required" below Comment field | Same pattern; `errors.comment` |
| Amplify save fails | Error message near Submit button with retry prompt; form values preserved | `submitError` state; `isSubmitting` disabled during retry |
| Amplify fetch fails | Banner above list; local entries still shown | `loadError` state; `entries` array untouched |
| `amplify_outputs.json` absent | App operates in local-only mode silently | Dynamic import try/catch; `amplifyConfigured = false` |

Errors are never swallowed silently. Every caught exception either surfaces a user-visible message or is logged to the console (in development).

---

## Testing Strategy

This feature is a React single-page application. The logic under test falls into two categories:

1. **Pure validation logic** (`validateForm`) — input varies, behaviour varies, fast to run many iterations → suitable for property-based testing.
2. **UI rendering, form interactions, Amplify integration** — example-based unit/integration tests are appropriate; these depend on DOM events, async side effects, or external services.

### Tooling

- **Unit / component tests**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Property-based tests**: [fast-check](https://fast-check.io/) (works with Vitest; no extra runner needed)
- Minimum **100 iterations** per property test (fast-check default is 100)

### Unit Test Coverage

- `FeedbackForm` renders all fields with correct labels and ids
- `StarRating` renders 5 buttons with correct `aria-label` values
- `FeedbackList` shows empty-state message when `entries` is empty
- `FeedbackList` renders entries in the order provided (caller is responsible for ordering)
- `FeedbackCard` renders name, rating display, and comment
- `App` — submitting a valid form adds an entry to the list (local mode)
- `App` — submitting a valid form with Amplify configured calls `client.models.FeedbackEntry.create` (mocked)

### Property-Based Test Coverage

See Correctness Properties section below. Each property maps to one `fc.assert(fc.property(...))` test tagged:

> **Feature: workshop-feedback-app, Property N: \<property text\>**

### Integration Test Coverage

- Amplify-connected mode: mock `client.models.FeedbackEntry.create` and `.list`, verify correct data flow end-to-end.
- Error paths: mock rejected promises, verify error messages appear and form is not reset.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The validation logic (`validateForm`) and several rendering/state-management behaviours qualify for property-based testing: they are pure or near-pure functions where input variation meaningfully reveals edge cases. UI layout, Amplify API wiring, and one-time rendering checks are better served by example-based unit tests or integration tests.

Each test uses [fast-check](https://fast-check.io/) with a minimum of 100 iterations.

---

### Property 1: Whitespace-only fields are rejected by the validator

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines, carriage returns), passing that string as the `name` field to `validateForm` SHALL produce `errors.name === "Name is required"`. Equivalently, *for any* such string passed as the `comment` field, `validateForm` SHALL produce `errors.comment === "Comment is required"`.

**Validates: Requirements 1.3, 3.3**

---

### Property 2: Star selection stores the selected rating

*For any* rating value N drawn from {1, 2, 3, 4, 5}, after a user selects star N in `StarRating` (regardless of any previously selected rating), the `value` reported to the parent component SHALL equal N, and stars 1 through N SHALL carry the filled-state CSS class.

**Validates: Requirements 2.2, 2.4**

---

### Property 3: Comment character counter reflects remaining capacity

*For any* comment string `s` with `s.length` in [0, 500], after the user types `s` into the Comment field, the displayed counter text SHALL equal `"${500 - s.length} / 500 characters remaining"`.

**Validates: Requirements 3.2**

---

### Property 4: Valid submission adds exactly one entry to the list

*For any* valid `FormState` (name non-empty after trim, rating in {1..5}, comment non-empty after trim), submitting the form in local-only mode SHALL increase the length of `entries` by exactly 1, and the newly added entry SHALL have `name`, `rating`, and `comment` values that match the submitted form state (after trim).

**Validates: Requirements 4.2**

---

### Property 5: Form resets after every successful submission

*For any* valid `FormState`, after a successful submission (local-only mode), the form's `name` field SHALL be `""`, the `rating` SHALL be `null`, and the `comment` field SHALL be `""`.

**Validates: Requirements 4.3**

---

### Property 6: The most recently submitted entry is always at the top

*For any* sequence of two or more valid submissions, after each submission the entry at `entries[0]` SHALL be the entry that was most recently submitted.

**Validates: Requirements 4.5, 5.4**

---

### Property 7: Every entry in state is rendered in the list

*For any* array of `FeedbackEntry` objects passed to `FeedbackList`, every entry's `name` and `comment` SHALL appear in the rendered output.

**Validates: Requirements 5.1**

---

### Property 8: Rating is rendered in "N / 5" format

*For any* `FeedbackEntry` with `rating` N in {1, 2, 3, 4, 5}, the `FeedbackCard` rendered for that entry SHALL contain the text `"${N} / 5"`.

**Validates: Requirements 5.2**

---

### Property 9: Validation errors are linked to their inputs via aria-describedby

*For any* form submission where one or more fields fail validation, each input that has an error SHALL have an `aria-describedby` attribute whose value matches the `id` of the `<span>` (or equivalent element) that contains the corresponding error message string.

**Validates: Requirements 7.4**
