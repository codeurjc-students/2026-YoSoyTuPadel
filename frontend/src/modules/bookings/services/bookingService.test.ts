import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { coachService } from '../../coaches/services/coachService';
import { courtService } from '../../courts/services/courtService';
import { racketService } from '../../rackets/services/racketService';
import { bookingService } from './bookingService';

vi.mock('../../../service/api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('../../coaches/services/coachService', () => ({
  coachService: {
    getCoachById: vi.fn(),
    getCoachImageUrl: vi.fn((id: number) => `/api/v1/users/coaches/${id}/image`),
  },
}));
vi.mock('../../courts/services/courtService', () => ({
  courtService: { getCourtById: vi.fn() },
}));
vi.mock('../../rackets/services/racketService', () => ({
  racketService: { getRacketById: vi.fn() },
}));

describe('bookingService', () => {
  beforeEach(() => vi.clearAllMocks());

  test('cancels a booking with the backend patch endpoint', async () => {
    await bookingService.cancelBooking('booking-27', 'court');

    expect(api.patch).toHaveBeenCalledWith('/api/v1/bookings/27');
  });

  test('does not allow cancelling material rentals through the booking endpoint', async () => {
    await expect(bookingService.cancelBooking('racket-8', 'racket')).rejects.toThrow(
      'Solo se pueden cancelar reservas de pistas o entrenadores.',
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  test('combines court, coach and currently rented racket data', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
        {
          id: 1,
          type: 'MATCH',
          status: 'PENDING',
          bookingDate: '2026-10-05',
          startTime: '10:00:00',
          endTime: '11:00:00',
          bookingPrice: null,
          courtId: 4,
          coachId: null,
        },
        {
          id: 2,
          type: 'TRAINING',
          status: 'COMPLETED',
          bookingDate: '2026-10-06',
          startTime: '12:00:00',
          endTime: '14:00:00',
          bookingPrice: 70,
          courtId: null,
          coachId: 3,
        },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          racketId: 8,
          racketUsages: 1,
          racketHistory: [{
            id: 6,
            brand: 'Head',
            name: 'Alpha',
            description: 'Control',
            pricePerDay: 9,
            stock: 2,
          }],
        },
      });
    vi.mocked(courtService.getCourtById).mockResolvedValue({
      id: 4,
      name: 'Pista central',
      courtPrice: 15,
      type: 'INDOOR',
      surface: 'GLASS',
      isAvailable: true,
    });
    vi.mocked(coachService.getCoachById).mockResolvedValue({
      id: 3,
      name: 'María López',
      skillLevel: 2,
      sessionPrice: 35,
    });
    vi.mocked(racketService.getRacketById).mockResolvedValue({
      id: 8,
      brand: 'Bullpadel',
      name: 'Vertex',
      description: 'Pala de prueba',
      pricePerDay: 12,
      stock: 4,
    });

    const result = await bookingService.getUserBookings(9);

    expect(api.get).toHaveBeenCalledWith('/api/v1/users/9/bookings', { signal: undefined });
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/me', { signal: undefined });
    expect(result).toEqual([
      {
        id: 'booking-1',
        type: 'court',
        title: 'Pista central',
        date: '2026-10-05',
        time: '10:00',
        price: 15,
        image: '/images/padel-court-overhead.jpg',
        status: 'PENDING',
      },
      {
        id: 'booking-2',
        type: 'coach',
        title: 'María López',
        date: '2026-10-06',
        time: '12:00',
        price: 70,
        image: '/api/v1/users/coaches/3/image',
        status: 'COMPLETED',
      },
      {
        id: 'racket-8',
        type: 'racket',
        title: 'Bullpadel Vertex',
        date: null,
        time: null,
        price: 12,
        image: '/api/v1/rackets/8/image',
        status: 'ACTIVE',
        remainingUses: 2,
      },
      {
        id: 'racket-history-0-6',
        type: 'racket',
        title: 'Head Alpha',
        date: null,
        time: null,
        price: 9,
        image: '/api/v1/rackets/6/image',
        status: 'RETURNED',
      },
    ]);
  });

  test('sorts bookings with the closest date first', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
        { id: 3, type: 'MATCH', status: 'PENDING', bookingDate: '2026-10-09', startTime: '09:00:00', endTime: '10:00:00', bookingPrice: 10, courtId: 4, coachId: null },
        { id: 4, type: 'MATCH', status: 'PENDING', bookingDate: '2026-10-04', startTime: '15:00:00', endTime: '16:00:00', bookingPrice: 10, courtId: 4, coachId: null },
        ],
      })
      .mockResolvedValueOnce({
        data: { racketId: null, racketUsages: 0, racketHistory: [] },
      });
    vi.mocked(courtService.getCourtById).mockResolvedValue({
      id: 4,
      name: 'Pista central',
      courtPrice: 15,
      type: 'INDOOR',
      surface: 'GLASS',
      isAvailable: true,
    });

    const result = await bookingService.getUserBookings(9);

    expect(result.map((booking) => booking.date)).toEqual(['2026-10-04', '2026-10-09']);
  });
});
