/**
 * Tests for useEmailForm hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { HuefyClient } from '@huefy/sdk';
import { HuefyProvider } from '../src/context.js';
import { useEmailForm } from '../src/useEmailForm.js';
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

describe('useEmailForm', () => {
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
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.formData).toEqual({
        templateKey: '',
        data: {},
        recipient: '',
        provider: undefined,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
      expect(result.current.validationErrors).toEqual([
        'Template key is required',
        'Recipient email is required',
        'Template data is required',
      ]);
      expect(result.current.isValid).toBe(false);
    });

    it('should initialize with provided defaults', () => {
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'welcome-email',
        defaultData: { name: 'John', company: 'Acme' },
        defaultRecipient: 'john@example.com',
        defaultProvider: 'sendgrid',
      }), {
        wrapper: TestWrapper,
      });

      expect(result.current.formData).toEqual({
        templateKey: 'welcome-email',
        data: { name: 'John', company: 'Acme' },
        recipient: 'john@example.com',
        provider: 'sendgrid',
      });
      expect(result.current.validationErrors).toEqual([]);
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('form data management', () => {
    it('should update form data with setFormData', () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setFormData({
          recipient: 'john@example.com',
          templateKey: 'test-template',
        });
      });

      expect(result.current.formData.recipient).toBe('john@example.com');
      expect(result.current.formData.templateKey).toBe('test-template');
      expect(result.current.formData.data).toEqual({});
    });

    it('should merge template data with setTemplateData', () => {
      const { result } = renderHook(() => useEmailForm({
        defaultData: { name: 'John' },
      }), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTemplateData({ company: 'Acme Corp' });
      });

      expect(result.current.formData.data).toEqual({
        name: 'John',
        company: 'Acme Corp',
      });
    });

    it('should merge nested data objects in setFormData', () => {
      const { result } = renderHook(() => useEmailForm({
        defaultData: { name: 'John', age: 30 },
      }), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setFormData({
          data: { company: 'Acme Corp', name: 'Jane' },
        });
      });

      expect(result.current.formData.data).toEqual({
        name: 'Jane', // Should override
        age: 30, // Should keep existing
        company: 'Acme Corp', // Should add new
      });
    });
  });

  describe('validation', () => {
    it('should validate empty form', () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.validationErrors).toEqual([
        'Template key is required',
        'Recipient email is required',
        'Template data is required',
      ]);
      expect(result.current.isValid).toBe(false);
    });

    it('should validate email format', () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setFormData({
          templateKey: 'test',
          recipient: 'invalid-email',
          data: { name: 'John' },
        });
      });

      expect(result.current.validationErrors).toContain('Invalid email address');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate complete valid form', () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setFormData({
          templateKey: 'test-template',
          recipient: 'john@example.com',
          data: { name: 'John' },
        });
      });

      expect(result.current.validationErrors).toEqual([]);
      expect(result.current.isValid).toBe(true);
    });

    it('should use custom validation function', () => {
      const customValidate = jest.fn().mockReturnValue(['Custom error']);
      
      const { result } = renderHook(() => useEmailForm({
        validate: customValidate,
      }), {
        wrapper: TestWrapper,
      });

      expect(customValidate).toHaveBeenCalledWith(result.current.formData);
      expect(result.current.validationErrors).toEqual(['Custom error']);
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('email sending', () => {
    it('should send email successfully with valid form', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'test-template',
        defaultRecipient: 'john@example.com',
        defaultData: { name: 'John' },
        onSuccess,
      }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const response = await result.current.sendEmail();
        expect(response).toEqual(mockSuccessResponse);
      });

      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        {}
      );
      expect(onSuccess).toHaveBeenCalledWith(mockSuccessResponse);
    });

    it('should send email with provider option', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'test-template',
        defaultRecipient: 'john@example.com',
        defaultData: { name: 'John' },
        defaultProvider: 'sendgrid',
      }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.sendEmail();
      });

      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        { provider: 'sendgrid' }
      );
    });

    it('should throw error when form is invalid', async () => {
      const { result } = renderHook(() => useEmailForm(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.sendEmail();
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toEqual(new Error('Form validation failed'));
        }
      });

      expect(mockClient.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      mockClient.sendEmail.mockRejectedValueOnce(mockError);
      
      const onError = jest.fn();
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'test-template',
        defaultRecipient: 'john@example.com',
        defaultData: { name: 'John' },
        onError,
      }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.sendEmail();
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('reset', () => {
    it('should reset form to default values', async () => {
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'default-template',
        defaultData: { name: 'Default' },
        defaultRecipient: 'default@example.com',
      }), {
        wrapper: TestWrapper,
      });

      // Change some values
      act(() => {
        result.current.setFormData({
          templateKey: 'changed-template',
          recipient: 'changed@example.com',
          data: { name: 'Changed' },
        });
      });

      expect(result.current.formData.templateKey).toBe('changed-template');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.formData).toEqual({
        templateKey: 'default-template',
        data: { name: 'Default' },
        recipient: 'default@example.com',
        provider: undefined,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should call onSending callback', async () => {
      mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
      
      const onSending = jest.fn();
      const { result } = renderHook(() => useEmailForm({
        defaultTemplate: 'test-template',
        defaultRecipient: 'john@example.com',
        defaultData: { name: 'John' },
        onSending,
      }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.sendEmail();
      });

      expect(onSending).toHaveBeenCalled();
    });
  });
});