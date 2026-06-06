import type { FormState, ValidationErrors } from './types';

/**
 * Validates the feedback form state synchronously.
 * Trims name and comment before checking for empty values.
 *
 * @returns A ValidationErrors object; an empty object means all fields are valid.
 */
export function validateForm(state: FormState): ValidationErrors {
  const errors: ValidationErrors = {};

  if (state.name.trim() === '') {
    errors.name = 'Name is required';
  }

  if (state.rating === null) {
    errors.rating = 'Please select a rating';
  }

  if (state.comment.trim() === '') {
    errors.comment = 'Comment is required';
  }

  return errors;
}
