import api from '../../../service/api';

export interface PreCourtDTO {
  id: number;
  name: string;
  isAvailable: boolean | null;
}

export interface CourtDTO {
  id: number;
  name: string;
  courtPrice: number;
  type: string;
  surface: string;
  isAvailable: boolean | null;
}

export interface CourtPage {
  content: PreCourtDTO[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface BookingDTO {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingPrice: number;
  userId: number;
  courtId: number;
}

export const courtService = {
  async getCourts(page = 0, size = 10, signal?: AbortSignal): Promise<CourtPage> {
    const { data } = await api.get<CourtPage>('/api/v1/courts', {
      params: { page, size },
      signal,
    });
    return data;
  },

  async getCourtById(id: number, signal?: AbortSignal): Promise<CourtDTO> {
    const { data } = await api.get<CourtDTO>(`/api/v1/courts/${id}`, { signal });
    return data;
  },

  async getReservedCourtSlots(courtId: number, date: string, signal?: AbortSignal): Promise<string[]> {
    const { data } = await api.get<string[]>(`/api/v1/bookings/courts/${courtId}/availability`, {
      params: { date },
      signal,
    });
    return data;
  },

  async bookCourt(
    courtId: number,
    userId: number,
    date: string,
    time: string,
  ): Promise<BookingDTO> {
    const [hour, minute] = time.split(':').map(Number);
    const booking = {
      userId,
      courtId,
      bookingDate: date,
      startTime: `${time}:00`,
      endTime: `${String(hour + 1).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      bookingPrice: null,
      type: 'MATCH',
      status: 'PENDING',
    };
    const { data } = await api.post<BookingDTO>('/api/v1/bookings', booking);
    return data;
  },
};
