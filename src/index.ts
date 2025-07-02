/**
 * Huefy React SDK
 * 
 * React hooks and components for the Huefy email sending platform
 * 
 * @packageDocumentation
 */

// Export main components and provider
export { HuefyProvider, useHuefyContext, withHuefy } from './context.js';
export type { HuefyProviderProps } from './context.js';

// Export hooks
export { useHuefy } from './useHuefy.js';
export { useEmailForm } from './useEmailForm.js';

// Export components
export { SendEmailButton, EmailForm } from './components.js';

// Export all types
export type {
  HuefyProviderConfig,
  EmailSendState,
  UseHuefyOptions,
  UseHuefyResult,
  UseEmailFormOptions,
  UseEmailFormResult,
  EmailFormData,
  HuefyContextValue,
  EmailFormProps,
  SendEmailButtonProps,
  BulkEmailState,
} from './types.js';

// Re-export useful types from the base SDK
export type {
  HuefyConfig,
  EmailProvider,
  EmailData,
  SendEmailOptions,
  SendEmailRequest,
  SendEmailResponse,
  ErrorResponse,
  ValidationError as SDKValidationError,
  HealthResponse,
  HuefyResult,
  HuefyError as HuefyErrorType,
  HuefyResponse,
  RetryConfig,
  HttpResponse,
  HuefyEventCallbacks,
} from '@huefy-dev/sdk';

// Re-export error classes from the base SDK
export {
  HuefyError,
  AuthenticationError,
  TemplateNotFoundError,
  InvalidTemplateDataError,
  InvalidRecipientError,
  ProviderError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ErrorCode,
  createErrorFromResponse,
  isHuefyError,
  isErrorCode,
  isRetryableError,
} from '@huefy-dev/sdk';

/**
 * Package version
 */
export const VERSION = '1.0.0-beta.3';

/**
 * Package information
 */
export const SDK_INFO = {
  name: '@huefy-dev/react',
  version: VERSION,
  language: 'React/TypeScript',
  baseSDK: '@huefy-dev/sdk',
  repository: 'https://github.com/huefy/huefy-sdk',
  documentation: 'https://docs.huefy.com/sdk/react',
} as const;