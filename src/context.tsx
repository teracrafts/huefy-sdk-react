/**
 * Huefy React Context
 * Provides Huefy client instance throughout the React component tree
 */

import React, { createContext, useContext, useMemo, useRef } from 'react';
import { HuefyClient } from '@huefy/sdk';
import type { HuefyContextValue, HuefyProviderConfig } from './types.js';

/**
 * React Context for Huefy client
 */
const HuefyContext = createContext<HuefyContextValue | null>(null);

/**
 * Props for the HuefyProvider component
 */
export interface HuefyProviderProps {
  /** Huefy configuration */
  config: HuefyProviderConfig;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Huefy Provider component
 * 
 * Provides Huefy client instance to all child components via React Context.
 * 
 * @example
 * ```tsx
 * import { HuefyProvider } from '@huefy/react';
 * 
 * function App() {
 *   return (
 *     <HuefyProvider config={{ apiKey: 'your-api-key' }}>
 *       <EmailForm />
 *     </HuefyProvider>
 *   );
 * }
 * ```
 */
export function HuefyProvider({ config, children }: HuefyProviderProps) {
  // Use ref to ensure client is only created once
  const clientRef = useRef<HuefyClient | null>(null);

  // Create client instance with memoization
  const contextValue = useMemo<HuefyContextValue>(() => {
    // Create client if it doesn't exist or config changed
    if (!clientRef.current) {
      if (config.debug) {
        console.log('[Huefy] Creating new client with config:', {
          baseUrl: config.baseUrl,
          timeout: config.timeout,
          retryAttempts: config.retryAttempts,
        });
      }

      clientRef.current = new HuefyClient(config, {
        onSendStart: config.debug ? (request) => {
          console.log('[Huefy] Starting email send:', request.template_key);
        } : undefined,
        onSendSuccess: config.debug ? (response) => {
          console.log('[Huefy] Email sent successfully:', response.message_id);
        } : undefined,
        onSendError: config.debug ? (error) => {
          console.error('[Huefy] Email send failed:', error.message);
        } : undefined,
        onRetry: config.debug ? (attempt, error) => {
          console.log(`[Huefy] Retry attempt ${attempt}:`, error.message);
        } : undefined,
      });
    }

    return {
      client: clientRef.current,
      isReady: true,
      config,
    };
  }, [config]);

  return (
    <HuefyContext.Provider value={contextValue}>
      {children}
    </HuefyContext.Provider>
  );
}

/**
 * Hook to access the Huefy context
 * 
 * @returns Huefy context value
 * @throws Error if used outside of HuefyProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, isReady } = useHuefyContext();
 *   
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   // Use client...
 * }
 * ```
 */
export function useHuefyContext(): HuefyContextValue {
  const context = useContext(HuefyContext);
  
  if (!context) {
    throw new Error(
      'useHuefyContext must be used within a HuefyProvider. ' +
      'Please wrap your component tree with <HuefyProvider>.'
    );
  }

  return context;
}

/**
 * HOC to inject Huefy client as props
 * 
 * @param Component - Component to wrap
 * @returns Wrapped component with Huefy client props
 * 
 * @example
 * ```tsx
 * interface Props {
 *   huefyClient: HuefyClient;
 *   huefyConfig: HuefyProviderConfig;
 * }
 * 
 * const MyComponent = withHuefy<Props>(({ huefyClient }) => {
 *   // Use huefyClient...
 * });
 * ```
 */
export function withHuefy<P extends object>(
  Component: React.ComponentType<P & {
    huefyClient: HuefyClient;
    huefyConfig: HuefyProviderConfig;
  }>
) {
  const WrappedComponent = (props: P) => {
    const { client, config } = useHuefyContext();
    
    return (
      <Component 
        {...props} 
        huefyClient={client} 
        huefyConfig={config}
      />
    );
  };

  WrappedComponent.displayName = `withHuefy(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}