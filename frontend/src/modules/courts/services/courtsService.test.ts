import AxiosMockAdapter from 'axios-mock-adapter';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import api from '../../../service/api';
import { courtService, type CourtDTO, type CourtPage } from './courtService';

const apiMock = new AxiosMockAdapter(api);

const court: CourtDTO = {
  id: 4,
  name: 'Central court',
  courtPrice: 15,
  type: 'INDOOR',
  surface: 'GLASS',
  isAvailable: true,
};

describe('courtService REST API integration', () => {
  beforeEach(() => {
    apiMock.reset();
    window.history.replaceState({}, '', '/');
  });

  afterAll(() => {
    apiMock.restore();
  });

  it('retrieves the paginated court catalogue', async () => {
    const catalogue: CourtPage = {
      content: [court],
      number: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    apiMock.onGet('/api/v1/courts', { params: { page: 0, size: 10 } }).reply(200, catalogue);

    await expect(courtService.getCourts()).resolves.toEqual(catalogue);

    expect(apiMock.history.get).toHaveLength(1);
    expect(apiMock.history.get[0].url).toBe('/api/v1/courts');
    expect(apiMock.history.get[0].params).toEqual({ page: 0, size: 10 });
  });

  it('throws the server error when the catalogue request returns HTTP 500', async () => {
    window.history.replaceState({}, '', '/500');
    apiMock.onGet('/api/v1/courts', { params: { page: 0, size: 10 } }).reply(500, {
      message: 'Internal server error',
    });

    await expect(courtService.getCourts()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('updates a court with the expected payload', async () => {
    apiMock.onPut('/api/v1/courts/4', court).reply(200, court);

    await expect(courtService.updateCourt(court)).resolves.toEqual(court);

    expect(apiMock.history.put).toHaveLength(1);
    expect(apiMock.history.put[0].url).toBe('/api/v1/courts/4');
    expect(JSON.parse(apiMock.history.put[0].data)).toEqual(court);
  });

  it('creates and updates a court including coordinates', async () => {
    const courtWithCoords: CourtDTO = {
      ...court,
      latitude: 40.3358,
      longitude: -3.8767,
    };
    apiMock.onPost('/api/v1/courts').reply(201, courtWithCoords);
    apiMock.onPut('/api/v1/courts/4', courtWithCoords).reply(200, courtWithCoords);

    const created = await courtService.createCourt({
      name: courtWithCoords.name,
      courtPrice: courtWithCoords.courtPrice,
      type: courtWithCoords.type,
      surface: courtWithCoords.surface,
      latitude: courtWithCoords.latitude,
      longitude: courtWithCoords.longitude,
    });
    expect(created).toEqual(courtWithCoords);

    const updated = await courtService.updateCourt(courtWithCoords);
    expect(updated).toEqual(courtWithCoords);
  });
});
