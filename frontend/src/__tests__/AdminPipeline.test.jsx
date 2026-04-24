import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminPipeline from '../pages/AdminPipeline';
import { vi } from 'vitest';

// Mock the API utility
vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn()
  }
}));

import { api } from '../utils/api';

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

const mockAudit = [];

function renderPipeline(jobId = 'job-1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/pipeline/${jobId}`]}>
      <Routes>
        <Route path="/admin/pipeline/:jobId" element={<AdminPipeline />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminPipeline', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders job title and columns after data loads', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/pipeline')) return Promise.resolve({ ok: true, json: async () => mockPipeline });
      if (url.includes('/audit')) return Promise.resolve({ ok: true, json: async () => mockAudit });
      return Promise.reject(new Error('Not found'));
    });

    renderPipeline();

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE REVIEW')).toBeInTheDocument();
      expect(screen.getByText('AWAITING ACK')).toBeInTheDocument();
      expect(screen.getByText('WAITLIST')).toBeInTheDocument();
    });
  });

  test('shows empty state messages', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/pipeline')) return Promise.resolve({ ok: true, json: async () => mockPipeline });
      if (url.includes('/audit')) return Promise.resolve({ ok: true, json: async () => mockAudit });
      return Promise.reject(new Error('Not found'));
    });

    renderPipeline();

    await waitFor(() => {
      expect(screen.getByText('No active applicants')).toBeInTheDocument();
      expect(screen.getByText('None pending')).toBeInTheDocument();
      expect(screen.getByText('Waitlist is empty')).toBeInTheDocument();
    });
  });

  test('shows error state when API fails', async () => {
    api.get.mockResolvedValue({ ok: false });

    renderPipeline();

    await waitFor(() => {
      expect(screen.getByText('Failed to load pipeline')).toBeInTheDocument();
    });
  });
});
