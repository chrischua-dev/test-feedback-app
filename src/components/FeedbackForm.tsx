import { useState } from 'react';
import type { FeedbackEntry, FormState, ValidationErrors } from '../types';
import { validateForm } from '../validation';
import StarRating from './StarRating';
import './FeedbackForm.css';

interface FeedbackFormProps {
  onSubmit: (entry: Omit<FeedbackEntry, 'id'>) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const INITIAL_FORM_STATE: FormState = {
  name: '',
  rating: null,
  comment: '',
};

export default function FeedbackForm({ onSubmit, isSubmitting, submitError }: FeedbackFormProps) {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const remainingChars = 500 - formState.comment.length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateForm(formState);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      name: formState.name.trim(),
      rating: formState.rating as number,
      comment: formState.comment.trim(),
    });

    // Reset the form after successful submission
    setFormState(INITIAL_FORM_STATE);
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit} noValidate>
      {/* Name field */}
      <div className="feedback-form__field">
        <label htmlFor="feedback-name" className="feedback-form__label">
          Name
        </label>
        <input
          type="text"
          id="feedback-name"
          className={`feedback-form__input${errors.name ? ' feedback-form__input--error' : ''}`}
          placeholder="Your name"
          maxLength={100}
          value={formState.name}
          onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
          aria-describedby={errors.name ? 'feedback-name-error' : undefined}
        />
        {errors.name && (
          <span id="feedback-name-error" className="feedback-form__error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      {/* Star rating */}
      <div className="feedback-form__field">
        <span className="feedback-form__label">Rating</span>
        <StarRating
          value={formState.rating}
          onChange={(rating) => setFormState((prev) => ({ ...prev, rating }))}
          error={errors.rating}
        />
      </div>

      {/* Comment field */}
      <div className="feedback-form__field">
        <label htmlFor="feedback-comment" className="feedback-form__label">
          Comment
        </label>
        <textarea
          id="feedback-comment"
          className={`feedback-form__textarea${errors.comment ? ' feedback-form__textarea--error' : ''}`}
          rows={3}
          maxLength={500}
          value={formState.comment}
          onChange={(e) => setFormState((prev) => ({ ...prev, comment: e.target.value }))}
          aria-describedby={errors.comment ? 'feedback-comment-error' : undefined}
        />
        <span className="feedback-form__char-count">
          {remainingChars} / 500 characters remaining
        </span>
        {errors.comment && (
          <span id="feedback-comment-error" className="feedback-form__error" role="alert">
            {errors.comment}
          </span>
        )}
      </div>

      {/* Submit area */}
      <div className="feedback-form__submit-area">
        {submitError && (
          <p className="feedback-form__submit-error" role="alert">
            {submitError}
          </p>
        )}
        <button
          type="submit"
          className="feedback-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}
