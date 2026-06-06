import type { FeedbackEntry } from '../types'
import FeedbackCard from './FeedbackCard'
import './FeedbackList.css'

interface FeedbackListProps {
  entries: FeedbackEntry[]
  isLoading: boolean
  loadError: string | null
}

function FeedbackList({ entries, isLoading, loadError }: FeedbackListProps) {
  if (isLoading) {
    return (
      <div className="feedback-list__loading" aria-live="polite" aria-busy="true">
        <span className="feedback-list__spinner" aria-hidden="true" />
        <span>Loading feedback…</span>
      </div>
    )
  }

  return (
    <section className="feedback-list">
      {loadError && (
        <div className="feedback-list__error" role="alert">
          {loadError}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="feedback-list__empty">
          No feedback yet. Be the first to share yours!
        </p>
      ) : (
        <ol className="feedback-list__items">
          {entries.map((entry) => (
            <li key={entry.id} className="feedback-list__item">
              <FeedbackCard entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default FeedbackList
