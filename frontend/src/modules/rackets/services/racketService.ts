import api from '../../../service/api';

export interface RacketDTO {
  id: number;
  brand: string;
  name: string;
  description: string;
  pricePerDay: number;
  stock: number | null;
}

export interface RacketListDTO {
  id: number;
  brand: string;
  name: string;
  stock: number | null;
}

export interface RacketPage {
  content: RacketListDTO[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface RacketRentalUser {
  id: number;
  racketId: number | null;
}

export const racketService = {
  async getRackets(page = 0, size = 10, signal?: AbortSignal): Promise<RacketPage> {
    const { data } = await api.get<RacketPage>('/api/v1/rackets', {
      params: { page, size },
      signal,
    });
    return data;
  },

  async getRacketById(id: number, signal?: AbortSignal): Promise<RacketDTO> {
    const { data } = await api.get<RacketDTO>(`/api/v1/rackets/${id}`, { signal });
    return data;
  },

  async rentRacket(userId: number, racketId: number): Promise<void> {
    await api.patch<void>(
      `/api/v1/users/${userId}/racket/${racketId}`,
    );
  },

  async returnRacket(userId: number): Promise<RacketRentalUser> {
    const { data } = await api.delete<RacketRentalUser>(`/api/v1/users/${userId}/racket`);
    return data;
  },
};
