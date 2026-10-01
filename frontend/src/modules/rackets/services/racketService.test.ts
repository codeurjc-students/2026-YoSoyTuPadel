import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../../../service/api';
import { racketService } from './racketService';

vi.mock('../../../service/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('racketService', () => {
  beforeEach(() => vi.clearAllMocks());

  test('gets a paginated racket list using the requested page and size', async () => {
    const page = {
      content: [{ id: 1, brand: 'Nox', name: 'AT10', stock: 2 }],
      number: 2,
      size: 5,
      totalElements: 11,
      totalPages: 3,
      last: false,
    };
    const signal = new AbortController().signal;
    vi.mocked(api.get).mockResolvedValue({ data: page });

    await expect(racketService.getRackets(2, 5, signal)).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith('/api/v1/rackets', {
      params: { page: 2, size: 5 },
      signal,
    });
  });

  test('gets racket details from the backend API', async () => {
    const racket = {
      id: 9,
      brand: 'Nox',
      name: 'AT10',
      description: 'Test racket',
      pricePerDay: 7,
      stock: 2,
    };
    vi.mocked(api.get).mockResolvedValue({ data: racket });

    await expect(racketService.getRacketById(9)).resolves.toEqual(racket);
    expect(api.get).toHaveBeenCalledWith('/api/v1/rackets/9', { signal: undefined });
  });

  test('rents a racket using PATCH and REST path parameters', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined });

    await expect(racketService.rentRacket(4, 9)).resolves.toBeUndefined();
    expect(api.patch).toHaveBeenCalledWith('/api/v1/users/4/racket/9');
  });

  test('returns a racket using DELETE on the user racket resource', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { id: 4, racketId: null } });

    await expect(racketService.returnRacket(4)).resolves.toEqual({ id: 4, racketId: null });
    expect(api.delete).toHaveBeenCalledWith('/api/v1/users/4/racket');
  });
});
