import './StarRating.css';

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  error?: string;
}

export default function StarRating({ value, onChange, error }: StarRatingProps) {
  const errorId = 'star-rating-error';

  return (
    <div className="star-rating">
      <div
        className="star-rating__group"
        role="group"
        aria-label="Star rating"
        aria-describedby={error ? errorId : undefined}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} out of 5`}
            className={`star-rating__star${value !== null && n <= value ? ' star-rating__star--filled' : ''}`}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
      </div>
      {error && (
        <span id={errorId} className="star-rating__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
