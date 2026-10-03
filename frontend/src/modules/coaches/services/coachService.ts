import api from '../../../service/api';

export interface PreCoachDTO {
  id: number;
  name: string;
  skillLevel: 1 | 2 | 3 | null;
  sessionPrice: number | null;
}

export type CoachDTO = PreCoachDTO;

export interface CoachPage {
  content: PreCoachDTO[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CoachBookingDTO {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingPrice: number;
  userId: number;
  coachId: number;
}

export const coachService = {
  getCoachImageUrl(coachId: number): string {
    return api.getUri({ url: `/api/v1/users/coaches/${coachId}/image` });
  },

  async getCoaches(page = 0, size = 10, signal?: AbortSignal): Promise<CoachPage> {
    const { data } = await api.get<CoachPage>('/api/v1/users/coaches', {
      params: { page, size },
      signal,
    });
    return data;
  },

  async getCoachById(id: number, signal?: AbortSignal): Promise<CoachDTO> {
    const { data } = await api.get<CoachDTO>(`/api/v1/users/coaches/${id}`, { signal });
    return data;
  },

  async getReservedCoachSlots(coachId: number, date: string, signal?: AbortSignal): Promise<string[]> {
    const { data } = await api.get<string[]>(`/api/v1/bookings/coaches/${coachId}/availability`, {
      params: { date },
      signal,
    });
    return data;
  },

  async bookCoach(
    coachId: number,
    userId: number,
    date: string,
    time: string,
  ): Promise<CoachBookingDTO> {
    const [hour, minute] = time.split(':').map(Number);
    const endHour = hour + 2;
    const { data } = await api.post<CoachBookingDTO>('/api/v1/bookings', {
      userId,
      coachId,
      bookingDate: date,
      startTime: `${time}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      bookingPrice: null,
      type: 'TRAINING',
      status: 'PENDING',
    });
    return data;
  },
};
