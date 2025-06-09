/**
 * Tests for useHuefy hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { HuefyClient } from '@huefy/sdk';
import { HuefyProvider } from '../src/context.js';
import { useHuefy } from '../src/useHuefy.js';
import type { SendEmailResponse, HuefyError } from '@huefy/sdk';

// Mock the SDK client
jest.mock('@huefy/sdk');
const MockedHuefyClient = jest.mocked(HuefyClient);

// Mock responses
const mockSuccessResponse: SendEmailResponse = {
  messageId: 'test-message-id',
  status: 'sent',
  provider: 'ses',
  timestamp: new Date().toISOString(),
};

const mockError: HuefyError = {
  name: 'HuefyError',
  message: 'Test error',
  code: 'TEST_ERROR',
} as HuefyError;

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <HuefyProvider
      config={{
        apiKey: 'test-key',
        baseURL: 'https://test.huefy.com',
      }}
    >
      {children}
    </HuefyProvider>
  );
}

describe('useHuefy', () => {
  let mockClient: jest.Mocked<HuefyClient>;

  beforeEach(() => {
    mockClient = {
      sendEmail: jest.fn(),
      sendBulkEmails: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    MockedHuefyClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useHuefy(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(result.current.success).toBe(false);
      expect(typeof result.current.sendEmail).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useHuefy({ onSuccess }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const response = await result.current.sendEmail(
          'test-template',
          { name: 'John' },
          'john@example.com'
        );
        expect(response).toEqual(mockSuccessResponse);
      });

      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        undefined
      );
      expect(onSuccess).toHaveBeenCalledWith(mockSuccessResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false); // Reset after success
      expect(result.current.error).toBe(null);
    });

    it('should handle email sending errors', async () => {
      mockClient.sendEmail.mockRejectedValueOnce(mockError);
      
      const onError = jest.fn();
      const { result } = renderHook(() => useHuefy({ onError }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.sendEmail(
            'test-template',
            { name: 'John' },
            'john@example.com'
          );
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.success).toBe(false);
    });

    it('should manage loading state correctly', async () => {
      let resolvePromise: (value: SendEmailResponse) => void;
      const promise = new Promise<SendEmailResponse>((resolve) => {
        resolvePromise = resolve;
      });
      mockClient.sendEmail.mockReturnValueOnce(promise);
      
      const { result } = renderHook(() => useHuefy(), {
        wrapper: TestWrapper,
      });

      // Start sending
      act(() => {
        result.current.sendEmail('test-template', { name: 'John' }, 'john@example.com');
      });

      // Should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockSuccessResponse);
        await promise;
      });

      // Should be done loading
      expect(result.current.loading).toBe(false);
    });

    it('should call onSending callback', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const onSending = jest.fn();
      const { result } = renderHook(() => useHuefy({ onSending }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.sendEmail(
          'test-template',
          { name: 'John' },
          'john@example.com'
        );
      });

      expect(onSending).toHaveBeenCalled();
    });

    it('should not reset on success when resetOnSuccess is false', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const { result } = renderHook(() => useHuefy({ resetOnSuccess: false }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.sendEmail(
          'test-template',
          { name: 'John' },
          'john@example.com'
        );
      });

      expect(result.current.success).toBe(true);
      expect(result.current.data).toEqual(mockSuccessResponse);
    });
  });

  describe('sendBulkEmails', () => {
    it('should send bulk emails successfully', async () => {
      const mockBulkResponse = [
        { success: true, result: mockSuccessResponse, error: null },
        { success: true, result: { ...mockSuccessResponse, messageId: 'test-2' }, error: null },
      ];
      mockClient.sendBulkEmails.mockResolvedValueOnce(mockBulkResponse);
      
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useHuefy({ onSuccess }), {
        wrapper: TestWrapper,
      });

      const emails = [
        { templateKey: 'test1', data: { name: 'John' }, recipient: 'john@example.com' },
        { templateKey: 'test2', data: { name: 'Jane' }, recipient: 'jane@example.com' },
      ];

      await act(async () => {
        const response = await result.current.sendBulkEmails(emails);
        expect(response).toEqual(mockBulkResponse);
      });

      expect(mockClient.sendBulkEmails).toHaveBeenCalledWith(emails);
      expect(onSuccess).toHaveBeenCalledTimes(2); // Called for each successful email
    });

    it('should handle bulk email errors', async () => {
      const mockBulkResponse = [
        { success: true, result: mockSuccessResponse, error: null },
        { success: false, result: null, error: mockError },
      ];
      mockClient.sendBulkEmails.mockResolvedValueOnce(mockBulkResponse);
      
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result } = renderHook(() => useHuefy({ onSuccess, onError }), {
        wrapper: TestWrapper,
      });

      const emails = [
        { templateKey: 'test1', data: { name: 'John' }, recipient: 'john@example.com' },
        { templateKey: 'test2', data: { name: 'Jane' }, recipient: 'jane@example.com' },
      ];

      await act(async () => {
        await result.current.sendBulkEmails(emails);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockClient.sendEmail.mockRejectedValueOnce(mockError);
      
      const { result } = renderHook(() => useHuefy({ resetOnError: false }), {
        wrapper: TestWrapper,
      });

      // Cause an error
      await act(async () => {
        try {
          await result.current.sendEmail(
            'test-template',
            { name: 'John' },
            'john@example.com'
          );
        } catch {}
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.success).toBe(false);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should call client healthCheck', async () => {
      const mockHealthResponse = { status: 'healthy', timestamp: new Date().toISOString() };
      mockClient.healthCheck.mockResolvedValueOnce(mockHealthResponse);
      
      const { result } = renderHook(() => useHuefy(), {
        wrapper: TestWrapper,
      });

      const response = await act(async () => {
        return await result.current.healthCheck();
      });

      expect(response).toEqual(mockHealthResponse);
      expect(mockClient.healthCheck).toHaveBeenCalled();
    });
  });

  describe('auto-reset', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-reset after success with delay', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const { result } = renderHook(() => useHuefy({ 
        resetOnSuccess: true,
        autoResetDelay: 1000 
      }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.sendEmail(
          'test-template',
          { name: 'John' },
          'john@example.com'
        );
      });

      // Should have success state
      expect(result.current.success).toBe(true);
      expect(result.current.data).toEqual(mockSuccessResponse);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should be reset
      expect(result.current.success).toBe(false);
      expect(result.current.data).toBe(null);
    });
  });
});