import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useEmailForm } from '../hooks/useEmailForm';
import { getOrCreateContext } from '../context';
import type { HuefyContextValue } from '../types';
import type { SendEmailResponse } from '../types/email';

const CONTEXT_KEY = '__HUEFY_REACT_CONTEXT__';

const mockResponse: SendEmailResponse = {
  success: true,
  correlationId: 'corr-123',
  data: {
    emailId: 'email-1',
    status: 'sent',
    recipients: [{ email: 'john@example.com', status: 'delivered' }],
  },
};

function createWrapper(contextValue: Partial<HuefyContextValue> = {}) {
  const Context = getOrCreateContext();

  const defaultValue: HuefyContextValue = {
    client: {
      sendEmail: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as HuefyContextValue['client'],
    isReady: true,
    isLoading: false,
    error: null,
    ...contextValue,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Context.Provider value={defaultValue}>{children}</Context.Provider>;
  };
}

describe('useEmailForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    delete globalRegistry[CONTEXT_KEY];
  });

  it('throws a clear error when used outside HuefyProvider', () => {
    expect(() =>
      renderHook(() => useEmailForm()),
    ).toThrow('useHuefyContext must be used within a HuefyProvider');
  });

  it('returns initial state within provider', () => {
    const { result } = renderHook(
      () => useEmailForm({ defaultTemplate: 'welcome', defaultRecipient: 'a@b.com' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.formData.templateKey).toBe('welcome');
    expect(result.current.formData.recipient).toBe('a@b.com');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('reflects validation errors reactively', () => {
    const { result } = renderHook(() => useEmailForm(), { wrapper: createWrapper() });

    // Initial state: all fields empty — should have errors
    expect(result.current.isValid).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);

    act(() => {
      result.current.setFormData({
        templateKey: 'welcome',
        recipient: 'john@example.com',
        data: { name: 'John' },
      });
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('sends email successfully and updates state', async () => {
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
          onSuccess,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.success).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('blocks send and sets error when client is not initialized', async () => {
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
          onError,
        }),
      { wrapper: createWrapper({ client: null, isReady: false }) },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.error?.message).toContain('not initialized');
    expect(result.current.success).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it('blocks send and sets error when form is invalid', async () => {
    const onError = vi.fn();

    const { result } = renderHook(
      () => useEmailForm({ onError }), // no defaults — form is invalid
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.error?.message).toContain('Validation failed');
    expect(result.current.success).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it('handles send errors and calls onError', async () => {
    const sendError = new Error('Network failure');
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
          onError,
        }),
      {
        wrapper: createWrapper({
          client: {
            sendEmail: vi.fn().mockRejectedValue(sendError),
          } as unknown as HuefyContextValue['client'],
        }),
      },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.error).toEqual(sendError);
    expect(result.current.success).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(onError).toHaveBeenCalledWith(sendError);
  });

  it('calls onSending callback before sending', async () => {
    const onSending = vi.fn();

    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
          onSending,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(onSending).toHaveBeenCalledTimes(1);
  });

  it('resets state to defaults', async () => {
    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.success).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.formData.templateKey).toBe('welcome');
  });

  it('supports custom validate function', async () => {
    const customValidate = vi.fn().mockReturnValue(['Custom error']);
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useEmailForm({
          defaultTemplate: 'welcome',
          defaultRecipient: 'john@example.com',
          defaultData: { name: 'John' },
          validate: customValidate,
          onError,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isValid).toBe(false);
    expect(result.current.validationErrors).toEqual(['Custom error']);

    await act(async () => {
      await result.current.sendEmail();
    });

    expect(result.current.error?.message).toContain('Custom error');
    expect(onError).toHaveBeenCalled();
  });

  it('setTemplateData updates only data field', () => {
    const { result } = renderHook(
      () => useEmailForm({ defaultTemplate: 'welcome' }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setTemplateData({ name: 'Alice', city: 'Berlin' });
    });

    expect(result.current.formData.data).toEqual({ name: 'Alice', city: 'Berlin' });
    expect(result.current.formData.templateKey).toBe('welcome');
  });
});
