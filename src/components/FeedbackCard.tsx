import type { FeedbackEntry } from '../types'
import './FeedbackCard.css'

interface FeedbackCardProps {
  entry: FeedbackEntry
}

function FeedbackCard({ entry }: FeedbackCardProps) {
  return (
    <article className="feedback-card">
      <div className="feedback-card__header">
        <span className="feedback-card__name">{entry.name}</span>
        <span className="feedback-card__rating">{entry.rating} / 5</span>
      </div>
      <p className="feedback-card__comment">{entry.comment}</p>
    </article>
  )
}

export default FeedbackCard
