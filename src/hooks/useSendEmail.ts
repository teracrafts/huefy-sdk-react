import { useCallback } from 'react';
import type { EmailData, EmailProvider, SingleRecipient } from '@teracrafts/huefy';
import { useHuefy } from './useHuefy';
import type { SendEmailResponse } from '../types/email';

export interface UseSendEmailOptions {
  onSuccess?: (response: SendEmailResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseSendEmailResult {
  send: (
    templateKey: string,
    data: EmailData,
    recipient: SingleRecipient,
    provider?: EmailProvider,
  ) => Promise<SendEmailResponse | undefined>;
  loading: boolean;
  error: Error | null;
  data: SendEmailResponse | null;
  success: boolean;
  reset: () => void;
}

/**
 * Hook for sending a single email with a clean, ergonomic API.
 *
 * Wraps `useHuefy` with a typed `send` function — no need to handle the
 * client instance directly.
 *
 * @example
 * ```tsx
 * const { send, loading, error, data } = useSendEmail({
 *   onSuccess: (res) => toast('Email sent!'),
 *   onError: (err) => toast(err.message),
 * });
 *
 * await send('welcome-email', { firstName: 'Alice' }, 'alice@example.com');
 * await send('welcome-email', { firstName: 'Alice' }, {
 *   email: 'ops@example.com',
 *   type: 'cc',
 *   data: { locale: 'en' },
 * });
 * ```
 */
export function useSendEmail(options: UseSendEmailOptions = {}): UseSendEmailResult {
  const { execute, loading, error, data, success, reset } = useHuefy<SendEmailResponse>(
    (client, templateKey, emailData, recipient, provider) =>
      client.sendEmail({
        templateKey: templateKey as string,
        data: emailData as EmailData,
        recipient: recipient as SingleRecipient,
        provider: provider as EmailProvider | undefined,
      }),
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    },
  );

  const send = useCallback(
    (templateKey: string, emailData: EmailData, recipient: SingleRecipient, provider?: EmailProvider) =>
      execute(templateKey, emailData, recipient, provider) as Promise<SendEmailResponse | undefined>,
    [execute],
  );

  return { send, loading, error, data, success, reset };
}
