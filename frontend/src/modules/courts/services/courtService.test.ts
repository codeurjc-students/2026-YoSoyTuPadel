import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { courtService } from './courtService';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('courtService', () => {
  beforeEach(() => vi.clearAllMocks());

  test('requests a paginated court list', async () => {
    const response = {
      content: [{ id: 1, name: 'Pista 1', isAvailable: true }],
      number: 1,
      size: 10,
      totalElements: 11,
      totalPages: 2,
      last: true,
    };
    vi.mocked(api.get).mockResolvedValue({ data: response });

    await expect(courtService.getCourts(1, 10)).resolves.toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/api/v1/courts', {
      params: { page: 1, size: 10 },
      signal: undefined,
    });
  });

  test('loads court details by id', async () => {
    const court = {
      id: 1,
      name: 'Pista 1',
      courtPrice: 8,
      type: 'INDOOR',
      surface: 'GLASS',
      isAvailable: true,
    };
    vi.mocked(api.get).mockResolvedValue({ data: court });

    await expect(courtService.getCourtById(1)).resolves.toEqual(court);
    expect(api.get).toHaveBeenCalledWith('/api/v1/courts/1', { signal: undefined });
  });

  test('loads reserved court time slots for a date', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: ['10:00', '13:00'] });

    await expect(courtService.getReservedCourtSlots(4, '2026-10-02')).resolves.toEqual(['10:00', '13:00']);
    expect(api.get).toHaveBeenCalledWith('/api/v1/bookings/courts/4/availability', {
      params: { date: '2026-10-02' },
      signal: undefined,
    });
  });

  test('creates a one-hour court booking', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 12 } });

    await expect(courtService.bookCourt(4, 9, '2026-10-02', '09:00')).resolves.toMatchObject({ id: 12 });
    expect(api.post).toHaveBeenCalledWith('/api/v1/bookings', {
      userId: 9,
      courtId: 4,
      bookingDate: '2026-10-02',
      startTime: '09:00:00',
      endTime: '10:00:00',
      bookingPrice: null,
      type: 'MATCH',
      status: 'PENDING',
    });
  });
});
