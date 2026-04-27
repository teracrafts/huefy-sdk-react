import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOrCreateContext } from '../context';
import { useSendEmail } from '../hooks/useSendEmail';
import type { HuefyContextValue } from '../types';

const CONTEXT_KEY = '__HUEFY_REACT_CONTEXT__';

function createWrapper(contextValue: Partial<HuefyContextValue> = {}) {
  const Context = getOrCreateContext();

  const defaultValue: HuefyContextValue = {
    client: {
      sendEmail: vi.fn().mockResolvedValue({
        success: true,
        correlationId: 'corr-123',
        data: {
          emailId: 'email-1',
          status: 'queued',
          recipients: [{ email: 'ops@example.com', status: 'queued' }],
        },
      }),
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

describe('useSendEmail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    delete globalRegistry[CONTEXT_KEY];
  });

  it('passes recipient objects through to the client', async () => {
    const sendEmail = vi.fn().mockResolvedValue({
      success: true,
      correlationId: 'corr-123',
      data: {
        emailId: 'email-1',
        status: 'queued',
        recipients: [{ email: 'ops@example.com', status: 'queued' }],
      },
    });

    const { result } = renderHook(() => useSendEmail(), {
      wrapper: createWrapper({
        client: {
          sendEmail,
        } as unknown as HuefyContextValue['client'],
      }),
    });

    await act(async () => {
      await result.current.send('welcome-email', { firstName: 'Ada' }, {
        email: 'ops@example.com',
        type: 'cc',
        data: { locale: 'en' },
      });
    });

    expect(sendEmail).toHaveBeenCalledWith({
      templateKey: 'welcome-email',
      data: { firstName: 'Ada' },
      recipient: {
        email: 'ops@example.com',
        type: 'cc',
        data: { locale: 'en' },
      },
      provider: undefined,
    });
  });
});
