import { createContext, useContext } from 'react';
import type { HuefyContextValue } from './types';

/**
 * Unique key used to store the context on the global window object.
 * This prevents issues with module duplication in monorepos (pnpm, yalc, etc.)
 * where multiple copies of this package might be loaded.
 */
const CONTEXT_KEY = '__HUEFY_REACT_CONTEXT__';

/**
 * Default context value when no provider is present.
 */
const defaultContextValue: HuefyContextValue = {
  client: null,
  isReady: false,
  isLoading: false,
  error: null,
};

/**
 * Gets or creates the Huefy React context using a global registry pattern.
 *
 * This ensures that even if multiple copies of the SDK are loaded (common in
 * monorepo setups with pnpm, yalc, or similar tools), they all share the same
 * React context instance.
 *
 * @returns The shared React context for Huefy.
 */
export function getOrCreateContext(): React.Context<HuefyContextValue> {
  // Use globalThis for cross-environment compatibility (browser, Node, workers)
  const globalRegistry = globalThis as unknown as Record<
    string,
    React.Context<HuefyContextValue> | undefined
  >;

  if (!globalRegistry[CONTEXT_KEY]) {
    globalRegistry[CONTEXT_KEY] = createContext<HuefyContextValue>(defaultContextValue);
    globalRegistry[CONTEXT_KEY]!.displayName = 'HuefyContext';
  }

  return globalRegistry[CONTEXT_KEY]!;
}

/**
 * Hook to access the Huefy context.
 *
 * Must be used within a HuefyProvider. Throws an error if used
 * outside of the provider tree.
 *
 * @returns The current Huefy context value.
 * @throws Error if used outside of a HuefyProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, isReady, error } = useHuefyContext();
 *
 *   if (!isReady) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>Client ready!</div>;
 * }
 * ```
 */
export function useHuefyContext(): HuefyContextValue {
  const context = useContext(getOrCreateContext());

  if (context === undefined) {
    throw new Error(
      'useHuefyContext must be used within a HuefyProvider. ' +
        'Wrap your component tree with <HuefyProvider config={...}>.',
    );
  }

  return context;
}
