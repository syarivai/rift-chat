const mockGet = jest.fn();
const mockPost = jest.fn();

// jest.mock is hoisted above the const declarations above, so the factory must not read
// mockGet/mockPost at module-load time — `api` is constructed during import, and they would
// still be undefined. Delegating defers the reference to call time.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      interceptors: { response: { use: jest.fn() } },
    }),
  },
}));

// Must come after jest.mock: `api` is constructed at module load, so it has to be built
// against the mocked axios.
// eslint-disable-next-line import/first
import { api } from './rift-api';

const contact = {
  id: 1,
  name: 'Alice Johnson',
  username: 'alicej',
  email: 'alice.johnson@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  phone: '+1-202-555-0101',
  website: 'https://alicejohnson.dev',
  address: { street: '123 Maple St', city: 'Springfield', zipcode: '62704' },
};

const post = {
  id: 1,
  userId: 5,
  title: 'Exploring REST APIs in 2025',
  body: 'REST APIs continue to be the backbone...',
  tags: ['1'],
  category: 'API Design',
  createdAt: '2025-07-01T10:12:00Z',
};

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('getContacts', () => {
  it('returns the envelope and passes paging through as params', async () => {
    mockGet.mockResolvedValue({ total: 60, limit: 20, offset: 0, results: [contact] });

    const result = await api.getContacts({ limit: 20, offset: 0 });

    expect(result.total).toBe(60);
    expect(result.results).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('/api/users', { params: { limit: 20, offset: 0 } });
  });

  it('throws when the envelope is malformed', async () => {
    mockGet.mockResolvedValue({ results: [contact] });
    await expect(api.getContacts({ limit: 20, offset: 0 })).rejects.toThrow(/Malformed envelope/);
  });
});

describe('getContact', () => {
  it('reads a bare object, not an envelope', async () => {
    mockGet.mockResolvedValue(contact);
    await expect(api.getContact({ id: 1 })).resolves.toEqual(contact);
    expect(mockGet).toHaveBeenCalledWith('/api/users/1', undefined);
  });

  it('throws when the payload is not a contact', async () => {
    mockGet.mockResolvedValue({ nope: true });
    await expect(api.getContact({ id: 1 })).rejects.toThrow(/Malformed contact/);
  });
});

describe('getMessages', () => {
  it('filters server-side by userId', async () => {
    mockGet.mockResolvedValue({ total: 3, limit: 20, offset: 0, results: [post] });

    await api.getMessages({ userId: 5, limit: 20, offset: 0 });

    expect(mockGet).toHaveBeenCalledWith('/api/posts', {
      params: { userId: 5, limit: 20, offset: 0 },
    });
  });
});

describe('sendMessage', () => {
  const input = { userId: 5, title: 'hi', body: 'test message' };

  it('posts the message and returns the response', async () => {
    mockPost.mockResolvedValue({ ...post, id: 101, createdAt: '2026-09-10T00:00:00.000Z' });

    const result = await api.sendMessage(input);

    expect(mockPost).toHaveBeenCalledWith('/api/posts', input, undefined);
    expect(result.createdAt).toBe('2026-09-10T00:00:00.000Z');
  });

  it('tolerates the id always being 101 — only createdAt is read downstream', async () => {
    mockPost.mockResolvedValue({ ...post, id: 101, createdAt: '2026-09-10T00:00:00.000Z' });
    const result = await api.sendMessage(input);
    expect(result.id).toBe(101);
  });

  it('throws when the response carries no createdAt', async () => {
    mockPost.mockResolvedValue({ id: 101 });
    await expect(api.sendMessage(input)).rejects.toThrow(/Malformed response/);
  });
});
