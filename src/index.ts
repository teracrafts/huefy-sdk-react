// Components
export { HuefyProvider } from './components';

// Hooks
export { useHuefy } from './hooks';

// Context
export { useHuefyContext, getOrCreateContext } from './context';

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

// Email form hook
export { useEmailForm } from './hooks/useEmailForm';
