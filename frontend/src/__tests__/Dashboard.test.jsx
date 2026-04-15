import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock fetch globally
const mockPipeline = {
  job: {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    active_capacity: 3,
    acknowledge_window_minutes: 60,
    decay_penalty: 10,
    is_open: true
  },
  active: [],
  pending_acknowledgment: [],
  waitlist: [],
  counts: { active: 0, pending: 0, waitlisted: 0, capacity: 3 }
};

function renderDashboard(jobId = 'job-1') {
  return render(
    <MemoryRouter initialEntries={[`/dashboard/${jobId}`]}>
      <Routes>
        <Route path="/dashboard/:jobId" element={<Dashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockPipeline
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Dashboard', () => {
  test('shows loading spinner initially', () => {
    // fetch never resolves — spinner should be visible
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderDashboard();
    // spinner div is present (it's a div with class containing spinner)
    const spinner = document.querySelector('[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  test('renders job title after data loads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async (_, idx) => mockPipeline
    });
    // Both pipeline and audit calls resolve with mockPipeline (audit will be treated as array [] from counts etc.)
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockPipeline })  // pipeline
      .mockResolvedValueOnce({ ok: true, json: async () => [] });           // audit log

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    });
  });

  test('renders all three pipeline columns', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockPipeline })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Active Review')).toBeInTheDocument();
      expect(screen.getByText('Awaiting Response')).toBeInTheDocument();
      expect(screen.getByText('Waitlist')).toBeInTheDocument();
    });
  });

  test('shows empty state messages when pipeline is empty', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockPipeline })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No active applicants')).toBeInTheDocument();
      expect(screen.getByText('No pending acknowledgments')).toBeInTheDocument();
      expect(screen.getByText('Waitlist is empty')).toBeInTheDocument();
    });
  });

  test('renders stat cards with counts', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockPipeline })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending Ack')).toBeInTheDocument();
      expect(screen.getByText('Waitlisted')).toBeInTheDocument();
      expect(screen.getByText('Audit Events')).toBeInTheDocument();
    });
  });

  test('shows error state when data fails to load', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load pipeline.')).toBeInTheDocument();
    });
  });

  test('refresh button is rendered', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockPipeline })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });
});
