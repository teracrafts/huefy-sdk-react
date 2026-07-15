// Components
export { HuefyProvider } from './components';

// Hooks
export { useHuefy } from './hooks';

// Context
export { useHuefyContext, getOrCreateContext } from './context';

// Core SDK errors
export {
  HuefyError,
  ErrorCode,
  HuefyDomainError,
  AuthenticationError,
  TemplateNotFoundError,
  InvalidTemplateDataError,
  InvalidRecipientError,
  ProviderError,
  RateLimitError,
  InsufficientQuotaError,
  HuefyErrorCode,
  createHuefyErrorFromResponse,
  isHuefyDomainError,
} from '@teracrafts/huefy';

// Types
export type {
  HuefyProviderProps,
  HuefyContextValue,
  UseHuefyOptions,
  UseHuefyResult,
} from './types';

// Email domain types
export type {
  EmailProvider,
  EmailData,
  RecipientType,
  EmailRecipient,
  SingleRecipient,
  SendEmailOptions,
  RecipientStatus,
  SendEmailResponseData,
  SendEmailResponse,
  EmailFormData,
  UseEmailFormOptions,
  UseEmailFormResult,
  BulkRecipient,
  SendBulkEmailsResponseData,
  SendBulkEmailsResponse,
  BulkEmailResult,
} from './types/email';

// Email hooks
export { useEmailForm } from './hooks/useEmailForm';
export { useSendEmail } from './hooks/useSendEmail';
export type { UseSendEmailOptions, UseSendEmailResult } from './hooks/useSendEmail';
