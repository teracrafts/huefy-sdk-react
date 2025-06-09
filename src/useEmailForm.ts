/**
 * useEmailForm Hook
 * Specialized hook for form-based email sending with validation
 */

import { useState, useCallback, useMemo } from 'react';
import type { EmailData, SendEmailOptions } from '@huefy/sdk';
import { useHuefy } from './useHuefy.js';
import type { 
  UseEmailFormOptions, 
  UseEmailFormResult, 
  EmailFormData 
} from './types.js';

/**
 * Default validation function
 */
const defaultValidate = (formData: EmailFormData): string[] | null => {
  const errors: string[] = [];

  if (!formData.templateKey?.trim()) {
    errors.push('Template key is required');
  }

  if (!formData.recipient?.trim()) {
    errors.push('Recipient email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      errors.push('Invalid email address');
    }
  }

  if (!formData.data || Object.keys(formData.data).length === 0) {
    errors.push('Template data is required');
  }

  return errors.length > 0 ? errors : null;
};

/**
 * Hook for form-based email sending with validation
 * 
 * Provides form state management, validation, and email sending functionality
 * in a single hook. Perfect for building email forms.
 * 
 * @param options - Configuration options for the hook
 * @returns Hook result with form state and actions
 * 
 * @example
 * ```tsx
 * function EmailForm() {
 *   const {
 *     formData,
 *     setFormData,
 *     setTemplateData,
 *     sendEmail,
 *     loading,
 *     error,
 *     success,
 *     validationErrors,
 *     isValid,
 *     reset
 *   } = useEmailForm({
 *     defaultTemplate: 'welcome-email',
 *     defaultData: { company: 'Acme Corp' },
 *     onSuccess: (response) => {
 *       toast.success('Email sent successfully!');
 *     }
 *   });
 * 
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       if (isValid) {
 *         sendEmail();
 *       }
 *     }}>
 *       <input
 *         type="email"
 *         value={formData.recipient}
 *         onChange={(e) => setFormData({ recipient: e.target.value })}
 *         placeholder="Recipient email"
 *       />
 *       
 *       <input
 *         value={formData.data.name || ''}
 *         onChange={(e) => setTemplateData({ name: e.target.value })}
 *         placeholder="Name"
 *       />
 * 
 *       {validationErrors.length > 0 && (
 *         <div className="errors">
 *           {validationErrors.map(error => (
 *             <div key={error}>{error}</div>
 *           ))}
 *         </div>
 *       )}
 * 
 *       <button type="submit" disabled={!isValid || loading}>
 *         {loading ? 'Sending...' : 'Send Email'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useEmailForm(options: UseEmailFormOptions = {}): UseEmailFormResult {
  const {
    defaultTemplate = '',
    defaultData = {},
    defaultRecipient = '',
    defaultProvider,
    validate = defaultValidate,
    ...huefyOptions
  } = options;

  // Initialize form data
  const [formData, setFormDataState] = useState<EmailFormData>(() => ({
    templateKey: defaultTemplate,
    data: { ...defaultData },
    recipient: defaultRecipient,
    provider: defaultProvider,
  }));

  // Use the main Huefy hook for email sending
  const huefyResult = useHuefy(huefyOptions);

  /**
   * Update form data partially
   */
  const setFormData = useCallback((updates: Partial<EmailFormData>) => {
    setFormDataState(prev => ({
      ...prev,
      ...updates,
      // Merge data objects if both exist
      ...(updates.data && prev.data ? {
        data: { ...prev.data, ...updates.data }
      } : updates.data ? { data: updates.data } : {}),
    }));
  }, []);

  /**
   * Update only template data
   */
  const setTemplateData = useCallback((data: EmailData) => {
    setFormDataState(prev => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  /**
   * Validate current form data
   */
  const validationErrors = useMemo(() => {
    return validate(formData) || [];
  }, [formData, validate]);

  /**
   * Check if form is valid
   */
  const isValid = useMemo(() => {
    return validationErrors.length === 0;
  }, [validationErrors]);

  /**
   * Send email with current form data
   */
  const sendEmail = useCallback(async () => {
    if (!isValid) {
      throw new Error('Form validation failed');
    }

    const emailOptions: SendEmailOptions = {};
    if (formData.provider) {
      emailOptions.provider = formData.provider;
    }

    return huefyResult.sendEmail(
      formData.templateKey,
      formData.data,
      formData.recipient,
      emailOptions,
    );
  }, [formData, isValid, huefyResult.sendEmail]);

  /**
   * Reset form and state
   */
  const reset = useCallback(() => {
    setFormDataState({
      templateKey: defaultTemplate,
      data: { ...defaultData },
      recipient: defaultRecipient,
      provider: defaultProvider,
    });
    huefyResult.reset();
  }, [defaultTemplate, defaultData, defaultRecipient, defaultProvider, huefyResult.reset]);

  return {
    // Form state
    formData,
    setFormData,
    setTemplateData,
    validationErrors,
    isValid,
    
    // Email sending state from useHuefy
    loading: huefyResult.loading,
    error: huefyResult.error,
    data: huefyResult.data,
    success: huefyResult.success,
    
    // Actions
    sendEmail,
    reset,
  };
}