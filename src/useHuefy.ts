/**
 * useHuefy Hook
 * Main React hook for sending emails with Huefy
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { HuefyError, EmailData, SendEmailOptions, SendEmailResponse } from '@huefy/sdk';
import { useHuefyContext } from './context.js';
import type { UseHuefyOptions, UseHuefyResult, EmailSendState } from './types.js';

/**
 * Initial state for email sending operations
 */
const initialState: EmailSendState = {
  loading: false,
  error: null,
  data: null,
  success: false,
};

/**
 * Main hook for sending emails with Huefy
 * 
 * Provides a simple interface for sending emails with automatic state management,
 * loading states, error handling, and success callbacks.
 * 
 * @param options - Configuration options for the hook
 * @returns Hook result with send functions and state
 * 
 * @example
 * ```tsx
 * function EmailButton() {
 *   const { sendEmail, loading, error, success } = useHuefy({
 *     onSuccess: (response) => {
 *       toast.success(`Email sent: ${response.messageId}`);
 *     },
 *     onError: (error) => {
 *       toast.error(`Failed to send email: ${error.message}`);
 *     }
 *   });
 * 
 *   const handleSend = async () => {
 *     try {
 *       await sendEmail('welcome-email', {
 *         name: 'John Doe',
 *         company: 'Acme Corp'
 *       }, 'john@example.com');
 *     } catch (error) {
 *       // Error is already handled by onError callback
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleSend} disabled={loading}>
 *       {loading ? 'Sending...' : 'Send Email'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useHuefy(options: UseHuefyOptions = {}): UseHuefyResult {
  const { client } = useHuefyContext();
  const [state, setState] = useState<EmailSendState>(initialState);
  const optionsRef = useRef(options);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update options ref when options change
  optionsRef.current = options;

  // Clear auto-reset timeout on unmount
  useEffect(() => {
    return () => {
      if (autoResetTimeoutRef.current) {
        clearTimeout(autoResetTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Reset the current state
   */
  const reset = useCallback(() => {
    setState(initialState);
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  /**
   * Set up auto-reset if configured
   */
  const setupAutoReset = useCallback(() => {
    const { autoResetDelay } = optionsRef.current;
    if (autoResetDelay && autoResetDelay > 0) {
      autoResetTimeoutRef.current = setTimeout(() => {
        reset();
      }, autoResetDelay);
    }
  }, [reset]);

  /**
   * Send an email using a template
   */
  const sendEmail = useCallback(async (
    templateKey: string,
    data: EmailData,
    recipient: string,
    emailOptions?: SendEmailOptions,
  ): Promise<SendEmailResponse> => {
    const currentOptions = optionsRef.current;

    // Set loading state and call onSending callback
    setState(prev => ({ ...prev, loading: true, error: null, success: false }));
    currentOptions.onSending?.();

    try {
      // Send the email
      const response = await client.sendEmail(templateKey, data, recipient, emailOptions);

      // Update state with success
      setState(prev => ({
        ...prev,
        loading: false,
        data: response,
        success: true,
        error: null,
      }));

      // Call success callback
      currentOptions.onSuccess?.(response);

      // Set up auto-reset or manual reset
      if (currentOptions.resetOnSuccess !== false) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          // Reset immediately if no delay specified
          setState(initialState);
        }
      }

      return response;
    } catch (error) {
      const huefyError = error as HuefyError;

      // Update state with error
      setState(prev => ({
        ...prev,
        loading: false,
        error: huefyError,
        success: false,
      }));

      // Call error callback
      currentOptions.onError?.(huefyError);

      // Reset on error if configured
      if (currentOptions.resetOnError) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }

      throw huefyError;
    }
  }, [client, setupAutoReset]);

  /**
   * Send multiple emails in bulk
   */
  const sendBulkEmails = useCallback(async (
    emails: Array<{
      templateKey: string;
      data: EmailData;
      recipient: string;
      options?: SendEmailOptions;
    }>,
  ) => {
    const currentOptions = optionsRef.current;

    // Set loading state
    setState(prev => ({ ...prev, loading: true, error: null, success: false }));
    currentOptions.onSending?.();

    try {
      // Send bulk emails
      const results = await client.sendBulkEmails(emails);

      // Update state with results
      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        error: null,
      }));

      // Call success callback for successful sends
      const successfulResults = results.filter(r => r.success && r.result);
      successfulResults.forEach(result => {
        if (result.result) {
          currentOptions.onSuccess?.(result.result);
        }
      });

      // Call error callback for failed sends
      const failedResults = results.filter(r => !r.success && r.error);
      failedResults.forEach(result => {
        if (result.error) {
          currentOptions.onError?.(result.error);
        }
      });

      // Reset if configured
      if (currentOptions.resetOnSuccess !== false) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }

      return results;
    } catch (error) {
      const huefyError = error as HuefyError;

      // Update state with error
      setState(prev => ({
        ...prev,
        loading: false,
        error: huefyError,
        success: false,
      }));

      // Call error callback
      currentOptions.onError?.(huefyError);

      // Reset on error if configured
      if (currentOptions.resetOnError) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }

      throw huefyError;
    }
  }, [client, setupAutoReset]);

  /**
   * Check API health
   */
  const healthCheck = useCallback(async () => {
    return client.healthCheck();
  }, [client]);

  return {
    ...state,
    sendEmail,
    sendBulkEmails,
    reset,
    healthCheck,
  };
}