import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HuefyClient } from '@teracrafts/huefy';
import { getOrCreateContext } from '../context';
import type { HuefyProviderProps } from '../types';

/**
 * Provider component that initializes the Huefy client and makes it
 * available to all child components via React context.
 *
 * @example
 * ```tsx
 * import { HuefyProvider } from '@teracrafts/huefy-react';
 *
 * function App() {
 *   return (
 *     <HuefyProvider
 *       config={{ apiKey: 'your-api-key' }}
 *       onReady={() => console.log('Client ready')}
 *       onError={(err) => console.error('Init failed:', err)}
 *     >
 *       <YourApp />
 *     </HuefyProvider>
 *   );
 * }
 * ```
 */
export function HuefyProvider({
  config,
  onReady,
  onError,
  children,
}: HuefyProviderProps) {
  const Context = getOrCreateContext();

  const [client, setClient] = useState<HuefyClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Prevent double initialization in React StrictMode
  const initRef = useRef(false);
  const clientRef = useRef<HuefyClient | null>(null);

  // Stable reference to callbacks to avoid re-triggering effects
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  // Stable config serialization for dependency tracking
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  const initializeClient = useCallback(async () => {
    // Guard against double initialization in StrictMode
    if (initRef.current) return;
    initRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const newClient = new HuefyClient(config);

      // If the client has an async initialization method, await it
      if (typeof newClient.initialize === 'function') {
        await newClient.initialize();
      }

      clientRef.current = newClient;
      setClient(newClient);
      setIsReady(true);
      setIsLoading(false);
      onReadyRef.current?.();
    } catch (err) {
      const initError =
        err instanceof Error ? err : new Error('Failed to initialize Huefy client');
      setError(initError);
      setIsLoading(false);
      setIsReady(false);
      onErrorRef.current?.(initError);
    }
  }, [configKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initRef.current = false;
    initializeClient();

    return () => {
      // Cleanup on unmount or config change
      const currentClient = clientRef.current;
      if (currentClient && typeof currentClient.close === 'function') {
        currentClient.close();
      }
      clientRef.current = null;
      initRef.current = false;
    };
  }, [initializeClient]);

  const contextValue = useMemo(
    () => ({
      client,
      isReady,
      isLoading,
      error,
    }),
    [client, isReady, isLoading, error],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
