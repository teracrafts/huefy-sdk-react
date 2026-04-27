import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useHuefyContext } from '../context';
import type {
  EmailFormData,
  EmailData,
  EmailRecipient,
  SendEmailResponse,
  UseEmailFormOptions,
  UseEmailFormResult,
} from '../types/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function defaultValidate(formData: EmailFormData): string[] | null {
  const errors: string[] = [];
  if (!formData.templateKey || formData.templateKey.trim().length === 0) {
    errors.push('Template key is required');
  }
  const recipientError = validateRecipient(formData.recipient);
  if (recipientError) {
    errors.push(recipientError);
  }
  if (!formData.data) {
    errors.push('Template data is required');
  }
  return errors.length > 0 ? errors : null;
}

function validateRecipient(recipient: EmailFormData['recipient']): string | null {
  if (typeof recipient === 'string') {
    const trimmed = recipient.trim();
    if (trimmed.length === 0) {
      return 'Recipient email is required';
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Invalid email address';
    }
    return null;
  }

  return validateRecipientObject(recipient);
}

function validateRecipientObject(recipient: EmailRecipient): string | null {
  const trimmedEmail = recipient.email.trim();
  if (trimmedEmail.length === 0) {
    return 'Recipient email is required';
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return 'Invalid email address';
  }

  const normalizedType = recipient.type?.trim().toLowerCase();
  if (normalizedType && !['to', 'cc', 'bcc'].includes(normalizedType)) {
    return 'Recipient type must be one of: to, cc, bcc';
  }

  return null;
}

export function useEmailForm(options: UseEmailFormOptions = {}): UseEmailFormResult {
  const { client } = useHuefyContext();
  const abortRef = useRef(false);

  // Stable reference to options to avoid stale closures and dependency churn
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [formData, setFormDataState] = useState<EmailFormData>({
    templateKey: options.defaultTemplate ?? '',
    data: options.defaultData ?? {},
    recipient: options.defaultRecipient ?? '',
    provider: options.defaultProvider,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<SendEmailResponse | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  const validationErrors = useMemo(() => {
    const validate = optionsRef.current.validate ?? defaultValidate;
    return validate(formData) ?? [];
  }, [formData]);
  const isValid = validationErrors.length === 0;

  const setFormData = useCallback((partial: Partial<EmailFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setTemplateData = useCallback((newData: EmailData) => {
    setFormDataState((prev) => ({ ...prev, data: newData }));
  }, []);

  const sendEmail = useCallback(async (): Promise<SendEmailResponse | undefined> => {
    if (!client) {
      const clientError = new Error(
        'Huefy client is not initialized. Ensure the HuefyProvider has finished loading before sending emails.',
      );
      setError(clientError);
      optionsRef.current.onError?.(clientError);
      return undefined;
    }

    const validate = optionsRef.current.validate ?? defaultValidate;
    const errors = validate(formData);
    if (errors && errors.length > 0) {
      const validationError = new Error(`Validation failed: ${errors.join(', ')}`);
      setError(validationError);
      optionsRef.current.onError?.(validationError);
      return undefined;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    optionsRef.current.onSending?.();

    try {
      const response = await client.sendEmail({
        templateKey: formData.templateKey,
        data: formData.data,
        recipient: formData.recipient,
        provider: formData.provider,
      });
      if (!abortRef.current) {
        setData(response);
        setSuccess(true);
        setLoading(false);
        optionsRef.current.onSuccess?.(response);
      }
      return response;
    } catch (err) {
      const sendError = err instanceof Error ? err : new Error(String(err));
      if (!abortRef.current) {
        setError(sendError);
        setLoading(false);
        optionsRef.current.onError?.(sendError);
      }
      return undefined;
    }
  }, [client, formData]);

  const reset = useCallback(() => {
    setFormDataState({
      templateKey: optionsRef.current.defaultTemplate ?? '',
      data: optionsRef.current.defaultData ?? {},
      recipient: optionsRef.current.defaultRecipient ?? '',
      provider: optionsRef.current.defaultProvider,
    });
    setLoading(false);
    setError(null);
    setData(null);
    setSuccess(false);
  }, []);

  return {
    formData,
    setFormData,
    setTemplateData,
    sendEmail,
    reset,
    loading,
    error,
    data,
    success,
    validationErrors,
    isValid,
  };
}
