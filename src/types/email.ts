export type EmailProvider = 'ses' | 'sendgrid' | 'mailgun' | 'mailchimp';
export type RecipientType = 'to' | 'cc' | 'bcc';

export interface EmailData {
  [key: string]: unknown;
}

export interface EmailRecipient {
  email: string;
  type?: RecipientType;
  data?: Record<string, unknown>;
}

export type SingleRecipient = string | EmailRecipient;

export interface SendEmailOptions {
  provider?: EmailProvider;
}

export interface RecipientStatus {
  email: string;
  status: string;
  messageId?: string;
  error?: string;
  sentAt?: string | null;
}

export interface SendEmailResponseData {
  emailId: string;
  status: string;
  recipients: RecipientStatus[];
  scheduledAt?: string | null;
  sentAt?: string | null;
}

export interface SendEmailResponse {
  success: boolean;
  data: SendEmailResponseData;
  correlationId: string;
}

export interface EmailFormData {
  templateKey: string;
  data: EmailData;
  recipient: SingleRecipient;
  provider?: EmailProvider;
}

export interface UseEmailFormOptions {
  defaultTemplate?: string;
  defaultData?: EmailData;
  defaultRecipient?: SingleRecipient;
  defaultProvider?: EmailProvider;
  validate?: (formData: EmailFormData) => string[] | null;
  onSuccess?: (response: SendEmailResponse) => void;
  onError?: (error: Error) => void;
  onSending?: () => void;
}

export interface UseEmailFormResult {
  formData: EmailFormData;
  setFormData: (data: Partial<EmailFormData>) => void;
  setTemplateData: (data: EmailData) => void;
  sendEmail: () => Promise<SendEmailResponse | undefined>;
  reset: () => void;
  loading: boolean;
  error: Error | null;
  data: SendEmailResponse | null;
  success: boolean;
  validationErrors: string[];
  isValid: boolean;
}

export interface BulkRecipient {
  email: string;
  type?: RecipientType;
  data?: Record<string, unknown>;
}

export interface SendBulkEmailsResponseData {
  batchId: string;
  status: string;
  templateKey: string;
  totalRecipients: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  suppressedCount: number;
  startedAt: string;
  completedAt?: string | null;
  recipients: RecipientStatus[];
  errors?: Array<{ code: string; message: string; recipient?: string }>;
  metadata?: Record<string, unknown>;
}

export interface SendBulkEmailsResponse {
  success: boolean;
  data: SendBulkEmailsResponseData;
  correlationId: string;
}

// Legacy alias kept for backwards compatibility
export interface BulkEmailResult {
  email: string;
  success: boolean;
  error?: { message: string; code: string };
}
