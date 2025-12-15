import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('ApiService', () => {
  let mockAxiosInstance: {
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as unknown as ReturnType<typeof axios.create>);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', async () => {
      // Re-import to trigger constructor
      await import('../../services/api');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request interceptor', async () => {
      await import('../../services/api');

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptor', async () => {
      await import('../../services/api');

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    it('should add auth token from localStorage when available', async () => {
      localStorage.setItem('accessToken', 'test-token-123');

      await import('../../services/api');

      // Get the request interceptor callback
      const requestInterceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = requestInterceptorCall[0];

      const config = {
        headers: {} as Record<string, string>,
      };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('should not add auth token when not in localStorage', async () => {
      localStorage.removeItem('accessToken');

      vi.resetModules();
      await import('../../services/api');

      const requestInterceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = requestInterceptorCall[0];

      const config = {
        headers: {} as Record<string, string>,
      };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request and extract data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: { id: 1, name: 'Test' }, success: true },
      });

      const { api } = await import('../../services/api');
      const result = await api.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params: undefined });
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should make GET request with params', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [], success: true },
      });

      const { api } = await import('../../services/api');
      await api.get('/test', { page: 1, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
        params: { page: 1, limit: 10 },
      });
    });

    it('should make POST request and extract data', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { data: { id: 1, created: true }, success: true },
      });

      const { api } = await import('../../services/api');
      const result = await api.post('/test', { name: 'Test' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', { name: 'Test' });
      expect(result).toEqual({ id: 1, created: true });
    });

    it('should make PUT request and extract data', async () => {
      mockAxiosInstance.put.mockResolvedValue({
        data: { data: { id: 1, updated: true }, success: true },
      });

      const { api } = await import('../../services/api');
      const result = await api.put('/test/1', { name: 'Updated' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', { name: 'Updated' });
      expect(result).toEqual({ id: 1, updated: true });
    });

    it('should make DELETE request and extract data', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: { data: { deleted: true }, success: true },
      });

      const { api } = await import('../../services/api');
      const result = await api.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1');
      expect(result).toEqual({ deleted: true });
    });

    it('should return full response with getWithMeta', async () => {
      const fullResponse = {
        data: [{ id: 1 }, { id: 2 }],
        success: true,
        meta: { total: 100, page: 1 },
      };
      mockAxiosInstance.get.mockResolvedValue({ data: fullResponse });

      const { api } = await import('../../services/api');
      const result = await api.getWithMeta('/test');

      expect(result).toEqual(fullResponse);
    });
  });
});
