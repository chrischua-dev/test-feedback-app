import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders exactly 5 star buttons', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('each button has aria-label "Rate N out of 5"', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByRole('button', { name: `Rate ${n} out of 5` })).toBeInTheDocument();
    }
  });

  it('all buttons have type="button"', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });

  it('applies filled class to stars 1 through N when value is N', () => {
    render(<StarRating value={3} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // Stars 1, 2, 3 should be filled
    expect(buttons[0]).toHaveClass('star-rating__star--filled');
    expect(buttons[1]).toHaveClass('star-rating__star--filled');
    expect(buttons[2]).toHaveClass('star-rating__star--filled');
    // Stars 4, 5 should not be filled
    expect(buttons[3]).not.toHaveClass('star-rating__star--filled');
    expect(buttons[4]).not.toHaveClass('star-rating__star--filled');
  });

  it('no filled class applied when value is null', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveClass('star-rating__star--filled');
    });
  });

  it('calls onChange with the correct rating when a star is clicked', async () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not show error element when no error is provided', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays error string below the group when error is provided', () => {
    render(<StarRating value={null} onChange={vi.fn()} error="Please select a rating" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Please select a rating');
  });

  it('links the group to the error element via aria-describedby', () => {
    render(<StarRating value={null} onChange={vi.fn()} error="Please select a rating" />);
    const errorEl = screen.getByRole('alert');
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-describedby', errorEl.id);
  });

  it('does not set aria-describedby when no error is provided', () => {
    render(<StarRating value={null} onChange={vi.fn()} />);
    const group = screen.getByRole('group');
    expect(group).not.toHaveAttribute('aria-describedby');
  });
});
