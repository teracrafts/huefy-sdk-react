import type { HuefyEmailClient, HuefyConfig } from '@teracrafts/huefy';

/**
 * Props for the HuefyProvider component.
 */
export interface HuefyProviderProps {
  /** Configuration for the Huefy client. */
  config: HuefyConfig;
  /** Callback invoked when the client is ready. */
  onReady?: () => void;
  /** Callback invoked when client initialization fails. */
  onError?: (error: Error) => void;
  /** Child components that will have access to the Huefy context. */
  children: React.ReactNode;
}

/**
 * Value provided by the Huefy React context.
 */
export interface HuefyContextValue {
  /** The initialized Huefy client instance, or null if not yet ready. */
  client: HuefyEmailClient | null;
  /** Whether the client has been successfully initialized. */
  isReady: boolean;
  /** Whether the client is currently initializing. */
  isLoading: boolean;
  /** Error that occurred during initialization, if any. */
  error: Error | null;
}

/**
 * Options for the useHuefy hook.
 */
export interface UseHuefyOptions {
  /** Callback invoked on successful action execution. */
  onSuccess?: (data: unknown) => void;
  /** Callback invoked when an action fails. */
  onError?: (error: Error) => void;
}

/**
 * Result returned by the useHuefy hook.
 */
export interface UseHuefyResult<T> {
  /** The data returned by the action, or null if not yet executed. */
  data: T | null;
  /** Error that occurred during action execution, if any. */
  error: Error | null;
  /** Whether the action is currently executing. */
  loading: boolean;
  /** Whether the action completed successfully. */
  success: boolean;
  /** Execute the action with optional arguments. */
  execute: (...args: unknown[]) => Promise<T | undefined>;
  /** Reset the hook state to its initial values. */
  reset: () => void;
}
