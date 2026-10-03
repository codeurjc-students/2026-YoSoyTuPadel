import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { coachService } from './coachService';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    getUri: vi.fn(({ url }: { url: string }) => url),
    post: vi.fn(),
  },
}));

describe('coachService', () => {
  beforeEach(() => vi.clearAllMocks());

  test('builds the coach image URL from the configured API base URL', () => {
    expect(coachService.getCoachImageUrl(3)).toBe('/api/v1/users/coaches/3/image');
    expect(api.getUri).toHaveBeenCalledWith({ url: '/api/v1/users/coaches/3/image' });
  });

  test('requests a paginated list of coaches', async () => {
    const page = {
      content: [{ id: 1, name: 'Coach One', skillLevel: 1, sessionPrice: 35 }],
      number: 1,
      size: 10,
      totalElements: 11,
      totalPages: 2,
      last: true,
    };
    vi.mocked(api.get).mockResolvedValue({ data: page });

    await expect(coachService.getCoaches(1, 10)).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/coaches', {
      params: { page: 1, size: 10 },
      signal: undefined,
    });
  });

  test('loads coach details by id', async () => {
    const coach = { id: 2, name: 'Coach Two', skillLevel: 2, sessionPrice: 38 };
    vi.mocked(api.get).mockResolvedValue({ data: coach });

    await expect(coachService.getCoachById(2)).resolves.toEqual(coach);
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/coaches/2', { signal: undefined });
  });

  test('loads reserved coach slots for a date', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: ['09:00', '13:00'] });

    await expect(coachService.getReservedCoachSlots(3, '2026-10-04')).resolves.toEqual(['09:00', '13:00']);
    expect(api.get).toHaveBeenCalledWith('/api/v1/bookings/coaches/3/availability', {
      params: { date: '2026-10-04' },
      signal: undefined,
    });
  });

  test('books a two-hour training session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 7 } });

    await expect(coachService.bookCoach(3, 9, '2026-10-03', '19:00')).resolves.toMatchObject({ id: 7 });
    expect(api.post).toHaveBeenCalledWith('/api/v1/bookings', {
      userId: 9,
      coachId: 3,
      bookingDate: '2026-10-03',
      startTime: '19:00:00',
      endTime: '21:00:00',
      bookingPrice: null,
      type: 'TRAINING',
      status: 'PENDING',
    });
  });
});
