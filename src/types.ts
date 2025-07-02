/**
 * React SDK Types
 * Type definitions specific to the React SDK
 */

import type {
  HuefyConfig,
  EmailData,
  SendEmailOptions,
  SendEmailResponse,
  HuefyError,
} from '@teracrafts/huefy';

/**
 * Configuration for the Huefy React Provider
 */
export interface HuefyProviderConfig extends Omit<HuefyConfig, 'apiKey'> {
  /** Your Huefy API key */
  apiKey: string;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * State for email sending operations
 */
export interface EmailSendState {
  /** Whether an email send operation is in progress */
  loading: boolean;
  /** Error from the last send operation, if any */
  error: HuefyError | null;
  /** Response from the last successful send operation, if any */
  data: SendEmailResponse | null;
  /** Whether the last operation was successful */
  success: boolean;
}

/**
 * Options for the useHuefy hook
 */
export interface UseHuefyOptions {
  /** Called when an email is sent successfully */
  onSuccess?: (response: SendEmailResponse) => void;
  /** Called when an email send fails */
  onError?: (error: HuefyError) => void;
  /** Called when an email send operation starts */
  onSending?: () => void;
  /** Reset state after successful send (default: true) */
  resetOnSuccess?: boolean;
  /** Reset state after error (default: false) */
  resetOnError?: boolean;
  /** Auto-reset delay in milliseconds (default: 0, no auto-reset) */
  autoResetDelay?: number;
}

/**
 * Return type for the useHuefy hook
 */
export interface UseHuefyResult extends EmailSendState {
  /** Send an email */
  sendEmail: (
    templateKey: string,
    data: EmailData,
    recipient: string,
    options?: SendEmailOptions,
  ) => Promise<SendEmailResponse>;
  /** Send multiple emails */
  sendBulkEmails: (
    emails: Array<{
      templateKey: string;
      data: EmailData;
      recipient: string;
      options?: SendEmailOptions;
    }>,
  ) => Promise<Array<{
    email: string;
    success: boolean;
    result?: SendEmailResponse;
    error?: HuefyError;
  }>>;
  /** Reset the current state */
  reset: () => void;
  /** Check if the API is healthy */
  healthCheck: () => Promise<any>;
}

/**
 * Options for the useEmailForm hook
 */
export interface UseEmailFormOptions extends UseHuefyOptions {
  /** Default template key */
  defaultTemplate?: string;
  /** Default email data */
  defaultData?: EmailData;
  /** Default recipient */
  defaultRecipient?: string;
  /** Default provider */
  defaultProvider?: SendEmailOptions['provider'];
  /** Validate form before sending */
  validate?: (formData: EmailFormData) => string[] | null;
}

/**
 * Form data for email sending
 */
export interface EmailFormData {
  templateKey: string;
  data: EmailData;
  recipient: string;
  provider?: SendEmailOptions['provider'];
}

/**
 * Return type for the useEmailForm hook
 */
export interface UseEmailFormResult extends EmailSendState {
  /** Current form data */
  formData: EmailFormData;
  /** Update form data */
  setFormData: (data: Partial<EmailFormData>) => void;
  /** Update template data */
  setTemplateData: (data: EmailData) => void;
  /** Send email with current form data */
  sendEmail: () => Promise<SendEmailResponse>;
  /** Reset form and state */
  reset: () => void;
  /** Validation errors */
  validationErrors: string[];
  /** Whether the form is valid */
  isValid: boolean;
}

/**
 * Context value for the Huefy Provider
 */
export interface HuefyContextValue {
  /** Huefy client instance */
  client: import('@huefy/sdk').HuefyClient;
  /** Whether the provider is configured */
  isReady: boolean;
  /** Configuration used */
  config: HuefyProviderConfig;
}

/**
 * Props for email form components
 */
export interface EmailFormProps {
  /** Template key to use */
  templateKey: string;
  /** Initial template data */
  initialData?: EmailData;
  /** Initial recipient */
  initialRecipient?: string;
  /** Email provider to use */
  provider?: SendEmailOptions['provider'];
  /** Called when email is sent successfully */
  onSuccess?: (response: SendEmailResponse) => void;
  /** Called when email send fails */
  onError?: (error: HuefyError) => void;
  /** Called when sending starts */
  onSending?: () => void;
  /** Custom validation function */
  validate?: (data: EmailFormData) => string[] | null;
  /** Custom styling class */
  className?: string;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Whether to show success/error messages */
  showMessages?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ComponentType;
  /** Custom error component */
  errorComponent?: React.ComponentType<{ error: HuefyError }>;
  /** Custom success component */
  successComponent?: React.ComponentType<{ response: SendEmailResponse }>;
}

/**
 * Props for the SendEmailButton component
 */
export interface SendEmailButtonProps {
  /** Template key to use */
  templateKey: string;
  /** Template data */
  data: EmailData;
  /** Recipient email */
  recipient: string;
  /** Email provider to use */
  provider?: SendEmailOptions['provider'];
  /** Button text when not loading */
  children?: React.ReactNode;
  /** Button text when loading */
  loadingText?: string;
  /** Called when email is sent successfully */
  onSuccess?: (response: SendEmailResponse) => void;
  /** Called when email send fails */
  onError?: (error: HuefyError) => void;
  /** Button disabled state */
  disabled?: boolean;
  /** Button class name */
  className?: string;
  /** Button style */
  style?: React.CSSProperties;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Bulk email operation state
 */
export interface BulkEmailState {
  /** Whether bulk operation is in progress */
  loading: boolean;
  /** Results from bulk operation */
  results: Array<{
    email: string;
    success: boolean;
    result?: SendEmailResponse;
    error?: HuefyError;
  }> | null;
  /** Overall error if operation failed */
  error: HuefyError | null;
  /** Progress information */
  progress: {
    total: number;
    completed: number;
    successful: number;
    failed: number;
  };
}