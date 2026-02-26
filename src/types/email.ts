export type EmailProvider = 'ses' | 'sendgrid' | 'mailgun' | 'mailchimp';

export interface EmailData {
  [key: string]: string;
}

export interface SendEmailOptions {
  provider?: EmailProvider;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId: string;
  provider: EmailProvider;
}

export interface EmailFormData {
  templateKey: string;
  data: EmailData;
  recipient: string;
  provider?: EmailProvider;
}

export interface UseEmailFormOptions {
  defaultTemplate?: string;
  defaultData?: EmailData;
  defaultRecipient?: string;
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

export interface BulkEmailResult {
  email: string;
  success: boolean;
  result?: SendEmailResponse;
  error?: { message: string; code: string };
}
