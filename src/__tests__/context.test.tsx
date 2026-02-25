import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOrCreateContext, useHuefyContext } from '../context';

const CONTEXT_KEY = '__HUEFY_REACT_CONTEXT__';

describe('getOrCreateContext', () => {
  afterEach(() => {
    // Clean up global registry between tests
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    delete globalRegistry[CONTEXT_KEY];
  });

  it('should create a new context on first call', () => {
    const context = getOrCreateContext();
    expect(context).toBeDefined();
    expect(context.displayName).toBe('HuefyContext');
  });

  it('should return the same context on subsequent calls', () => {
    const context1 = getOrCreateContext();
    const context2 = getOrCreateContext();
    expect(context1).toBe(context2);
  });

  it('should store context in global registry', () => {
    const context = getOrCreateContext();
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    expect(globalRegistry[CONTEXT_KEY]).toBe(context);
  });

  it('should reuse existing context from global registry', () => {
    // Simulate another module having already created the context
    const existingContext = React.createContext(null);
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    globalRegistry[CONTEXT_KEY] = existingContext;

    const context = getOrCreateContext();
    expect(context).toBe(existingContext);
  });
});

describe('useHuefyContext', () => {
  afterEach(() => {
    const globalRegistry = globalThis as unknown as Record<string, unknown>;
    delete globalRegistry[CONTEXT_KEY];
  });

  it('should return default context value when no provider is present', () => {
    const { result } = renderHook(() => useHuefyContext());

    expect(result.current).toEqual({
      client: null,
      isReady: false,
      isLoading: false,
      error: null,
    });
  });

  it('should return provided context value', () => {
    const Context = getOrCreateContext();
    const mockValue = {
      client: { close: vi.fn() } as unknown as ReturnType<typeof useHuefyContext>['client'],
      isReady: true,
      isLoading: false,
      error: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Context.Provider value={mockValue}>{children}</Context.Provider>
    );

    const { result } = renderHook(() => useHuefyContext(), { wrapper });

    expect(result.current.isReady).toBe(true);
    expect(result.current.client).toBe(mockValue.client);
  });
});
