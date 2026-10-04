import api from '../../../service/api';
import { coachService } from '../../coaches/services/coachService';
import { courtService } from '../../courts/services/courtService';
import { racketService } from '../../rackets/services/racketService';
import type { RacketDTO } from '../../rackets/services/racketService';

interface BookingDTO {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingPrice: number | null;
  type: 'MATCH' | 'TRAINING';
  status: string;
  courtId: number | null;
  coachId: number | null;
}

interface UserBookingsDTO {
  racketId: number | null;
  racketUsages: number;
  racketHistory: RacketDTO[];
}

export type BookingItemType = 'court' | 'coach' | 'racket';

export interface BookingItem {
  id: string;
  type: BookingItemType;
  title: string;
  date: string | null;
  time: string | null;
  price: number | null;
  image: string;
  status: string;
  remainingUses?: number;
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function toRacketHistoryItems(rackets: RacketDTO[]): BookingItem[] {
  return rackets.map((racket, index) => ({
    id: `racket-history-${index}-${racket.id}`,
    type: 'racket',
    title: `${racket.brand} ${racket.name}`,
    date: null,
    time: null,
    price: racket.pricePerDay,
    image: `/api/v1/rackets/${racket.id}/image`,
    status: 'RETURNED',
  }));
}

export const bookingService = {
  toRacketHistoryItems,

  async cancelBooking(bookingId: string, type: BookingItemType): Promise<void> {
    const match = /^booking-(\d+)$/.exec(bookingId);
    if (type === 'racket' || !match) {
      throw new Error('Solo se pueden cancelar reservas de pistas o entrenadores.');
    }

    await api.patch(`/api/v1/bookings/${match[1]}`);
  },

  async getUserBookings(
    userId: number,
    signal?: AbortSignal,
  ): Promise<BookingItem[]> {
    const [{ data: bookings }, { data: user }] = await Promise.all([
      api.get<BookingDTO[]>(`/api/v1/users/${userId}/bookings`, { signal }),
      api.get<UserBookingsDTO>('/api/v1/users/me', { signal }),
    ]);
    const currentUserRacketId = user.racketId ?? null;

    const bookingItems = await Promise.all(bookings.map(async (booking): Promise<BookingItem> => {
      if (booking.type === 'MATCH' && booking.courtId !== null) {
        const court = await courtService.getCourtById(booking.courtId, signal);
        return {
          id: `booking-${booking.id}`,
          type: 'court',
          title: court.name,
          date: booking.bookingDate,
          time: formatTime(booking.startTime),
          price: booking.bookingPrice ?? court.courtPrice,
          image: '/images/padel-court-overhead.jpg',
          status: booking.status,
        };
      }

      if (booking.type === 'TRAINING' && booking.coachId !== null) {
        const coach = await coachService.getCoachById(booking.coachId, signal);
        return {
          id: `booking-${booking.id}`,
          type: 'coach',
          title: coach.name,
          date: booking.bookingDate,
          time: formatTime(booking.startTime),
          price: booking.bookingPrice ?? coach.sessionPrice,
          image: coachService.getCoachImageUrl(coach.id),
          status: booking.status,
        };
      }

      throw new Error(`La reserva ${booking.id} no tiene un recurso asociado válido.`);
    }));

    const materialItems: BookingItem[] = currentUserRacketId === null
      ? []
      : await racketService.getRacketById(currentUserRacketId, signal).then((racket) => [{
        id: `racket-${racket.id}`,
        type: 'racket',
        title: `${racket.brand} ${racket.name}`,
        date: null,
        time: null,
        price: racket.pricePerDay,
        image: `/api/v1/rackets/${racket.id}/image`,
        status: 'ACTIVE',
        remainingUses: Math.max(0, 3 - user.racketUsages),
      }]);

    return [...bookingItems, ...materialItems, ...toRacketHistoryItems(user.racketHistory ?? [])].sort((a, b) => {
      if (a.date === null) return b.date === null ? 0 : 1;
      if (b.date === null) return -1;
      return a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');
    });
  },
};
