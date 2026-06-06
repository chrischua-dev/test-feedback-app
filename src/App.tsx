import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { FeedbackEntry } from './types';
import FeedbackForm from './components/FeedbackForm';
import FeedbackList from './components/FeedbackList';
import './App.css';

// Amplify integration flag — starts false; set to true after
// amplify_outputs.json is successfully loaded at runtime.
let amplifyConfigured = false;

// Attempt to load amplify_outputs.json at module load time.
// If the file is absent (local-only / pre-workshop mode) the import
// rejects and amplifyConfigured stays false — the app degrades silently.
(async () => {
  try {
    const outputs = await import('../amplify_outputs.json');
    Amplify.configure(outputs.default);
    amplifyConfigured = true;
  } catch {
    // amplify_outputs.json not present → local-only mode
  }
})();

// Create a typed Amplify Data client.
// It is only used inside `amplifyConfigured` branches, so calling it
// before Amplify.configure() succeeds won't cause runtime errors in
// local-only mode — the client is never exercised.
const client = generateClient<Schema>();

/**
 * Normalise an Amplify model record into a plain FeedbackEntry.
 * Amplify's `create` / `list` responses wrap the item in a `.data`
 * property; handle both shapes defensively.
 */
function toFeedbackEntry(
  raw: { data?: Record<string, unknown> } | Record<string, unknown> | null | undefined,
): FeedbackEntry {
  const item = (raw && typeof raw === 'object' && 'data' in raw && raw.data)
    ? (raw.data as Record<string, unknown>)
    : (raw as Record<string, unknown>);
  return {
    id:        String(item.id ?? crypto.randomUUID()),
    name:      String(item.name ?? ''),
    rating:    Number(item.rating ?? 0),
    comment:   String(item.comment ?? ''),
    createdAt: item.createdAt != null ? String(item.createdAt) : undefined,
  };
}

function App() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!amplifyConfigured) return;

    // Amplify-connected mode: fetch existing entries on mount.
    setIsLoading(true);
    (async () => {
      try {
        const result = await client.models.FeedbackEntry.list();
        const items = (result.data ?? result) as unknown[];
        setEntries(
          [...items]
            .map((item) => toFeedbackEntry(item as Record<string, unknown>))
            .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        );
        setLoadError(null);
      } catch {
        setLoadError('Could not load feedback. Showing any locally added entries.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(formData: Omit<FeedbackEntry, 'id'>): Promise<void> {
    if (amplifyConfigured) {
      // Amplify-connected mode: persist entry before updating local state.
      setIsSubmitting(true);
      try {
        const result = await client.models.FeedbackEntry.create({
          name:    formData.name,
          rating:  formData.rating,
          comment: formData.comment,
        });
        const saved = toFeedbackEntry(result as unknown as Record<string, unknown>);
        setEntries((prev) => [saved, ...prev]);
        setSubmitError(null);
      } catch {
        setSubmitError('Failed to save feedback. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Local-only mode: generate a client-side UUID and prepend to entries.
      const newEntry: FeedbackEntry = {
        ...formData,
        id: crypto.randomUUID(),
      };
      setEntries((prev) => [newEntry, ...prev]);
    }
  }

  return (
    <main>
      <h1>Workshop Feedback</h1>
      <FeedbackForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
      <FeedbackList
        entries={entries}
        isLoading={isLoading}
        loadError={loadError}
      />
    </main>
  );
}

export default App;
