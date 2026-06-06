/** A single submitted feedback entry. */
export interface FeedbackEntry {
  id: string;        // UUID generated client-side (or returned by Amplify)
  name: string;      // Trimmed display name, 1–100 chars
  rating: number;    // Integer 1–5
  comment: string;   // Trimmed comment, 1–500 chars
  createdAt?: string; // ISO 8601 timestamp; set by Amplify if connected
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
