import { describe, it, expect } from 'vitest';
import { validateForm } from './validation';
import type { FormState } from './types';

describe('validateForm', () => {
  const validState: FormState = {
    name: 'Alice',
    rating: 4,
    comment: 'Great workshop!',
  };

  it('returns empty object when all fields are valid', () => {
    const errors = validateForm(validState);
    expect(errors).toEqual({});
  });

  it('returns name error when name is empty', () => {
    const errors = validateForm({ ...validState, name: '' });
    expect(errors.name).toBe('Name is required');
    expect(errors.rating).toBeUndefined();
    expect(errors.comment).toBeUndefined();
  });

  it('trims name before checking — whitespace-only name is invalid', () => {
    const errors = validateForm({ ...validState, name: '   ' });
    expect(errors.name).toBe('Name is required');
  });

  it('returns rating error when rating is null', () => {
    const errors = validateForm({ ...validState, rating: null });
    expect(errors.rating).toBe('Please select a rating');
    expect(errors.name).toBeUndefined();
    expect(errors.comment).toBeUndefined();
  });

  it('returns comment error when comment is empty', () => {
    const errors = validateForm({ ...validState, comment: '' });
    expect(errors.comment).toBe('Comment is required');
    expect(errors.name).toBeUndefined();
    expect(errors.rating).toBeUndefined();
  });

  it('trims comment before checking — whitespace-only comment is invalid', () => {
    const errors = validateForm({ ...validState, comment: '\t\n  ' });
    expect(errors.comment).toBe('Comment is required');
  });

  it('returns all three errors when all fields are invalid', () => {
    const errors = validateForm({ name: '', rating: null, comment: '' });
    expect(errors.name).toBe('Name is required');
    expect(errors.rating).toBe('Please select a rating');
    expect(errors.comment).toBe('Comment is required');
  });

  it('does not trim name value — leading/trailing spaces are valid after trimming if content remains', () => {
    const errors = validateForm({ ...validState, name: '  Alice  ' });
    expect(errors.name).toBeUndefined();
  });

  it('does not trim comment value — leading/trailing spaces are valid after trimming if content remains', () => {
    const errors = validateForm({ ...validState, comment: '  Great!  ' });
    expect(errors.comment).toBeUndefined();
  });
});
