import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { FeedbackEntry } from './types';
import FeedbackForm from './components/FeedbackForm';
import FeedbackList from './components/FeedbackList';
import './App.css';

// Create a typed Amplify Data client.
// Safe to create before Amplify.configure() — only exercised when
// amplifyConfigured state is true.
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
  // Track whether Amplify has been configured as React state so that
  // the fetch useEffect re-runs once configuration resolves.
  const [amplifyConfigured, setAmplifyConfigured] = useState(false);

  // Configure Amplify on mount by dynamically importing amplify_outputs.json.
  // Falls back to local-only mode silently if the file is absent.
  useEffect(() => {
    (async () => {
      try {
        const outputs = await import('../amplify_outputs.json');
        Amplify.configure(outputs.default);
        setAmplifyConfigured(true);
      } catch {
        // amplify_outputs.json not present → local-only mode
      }
    })();
  }, []);

  // Fetch existing entries from Amplify once it's configured.
  useEffect(() => {
    if (!amplifyConfigured) return;

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
  }, [amplifyConfigured]);

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
