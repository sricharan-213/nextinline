import { render, screen, act } from '@testing-library/react';
import CountdownTimer from '../components/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders the timer element', () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    render(<CountdownTimer deadline={future} />);
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
  });

  test('shows "Window Expired" when deadline is in the past', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    render(<CountdownTimer deadline={past} />);
    expect(screen.getByText('Window Expired')).toBeInTheDocument();
  });

  test('shows "Too late to acknowledge" sub-text when expired', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    render(<CountdownTimer deadline={past} />);
    expect(screen.getByText('Too late to acknowledge')).toBeInTheDocument();
  });

  test('shows remaining time countdown when deadline is in the future', () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    render(<CountdownTimer deadline={future} />);
    expect(screen.getByText('remaining to acknowledge')).toBeInTheDocument();
  });

  test('shows MM:SS format for future deadline', () => {
    const future = new Date(Date.now() + 10 * 60 * 1000 + 30 * 1000).toISOString(); // 10m 30s
    render(<CountdownTimer deadline={future} />);
    // Should show something like "10:30"
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  test('updates countdown after 1 second tick', () => {
    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    render(<CountdownTimer deadline={future} />);

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still show remaining time (not expired)
    expect(screen.getByText('remaining to acknowledge')).toBeInTheDocument();
  });

  test('transitions to expired when timer reaches zero', () => {
    const future = new Date(Date.now() + 1500).toISOString(); // 1.5 seconds
    render(<CountdownTimer deadline={future} />);

    act(() => {
      vi.advanceTimersByTime(2000); // advance past deadline
    });

    expect(screen.getByText('Window Expired')).toBeInTheDocument();
  });

  test('cleans up interval on unmount', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<CountdownTimer deadline={future} />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
