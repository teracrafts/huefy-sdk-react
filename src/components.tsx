/**
 * Huefy React Components
 * Ready-to-use React components for common email sending scenarios
 */

import React, { useState } from 'react';
import { useHuefy } from './useHuefy.js';
import { useEmailForm } from './useEmailForm.js';
import type { 
  SendEmailButtonProps,
  EmailFormProps,
} from './types.js';

/**
 * Button component for sending emails
 * 
 * A simple button that sends an email when clicked. Handles loading states
 * and provides callbacks for success and error handling.
 * 
 * @example
 * ```tsx
 * <SendEmailButton
 *   templateKey="welcome-email"
 *   data={{ name: 'John Doe', company: 'Acme Corp' }}
 *   recipient="john@example.com"
 *   onSuccess={(response) => toast.success('Email sent!')}
 *   onError={(error) => toast.error(error.message)}
 * >
 *   Send Welcome Email
 * </SendEmailButton>
 * ```
 */
export function SendEmailButton({
  templateKey,
  data,
  recipient,
  provider,
  children = 'Send Email',
  loadingText = 'Sending...',
  onSuccess,
  onError,
  disabled = false,
  className = '',
  style,
  type = 'button',
}: SendEmailButtonProps) {
  const { sendEmail, loading } = useHuefy({
    onSuccess,
    onError,
  });

  const handleClick = async () => {
    try {
      await sendEmail(templateKey, data, recipient, provider ? { provider } : undefined);
    } catch (error) {
      // Error is handled by the onError callback in useHuefy
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      style={style}
    >
      {loading ? loadingText : children}
    </button>
  );
}

/**
 * Complete email form component
 * 
 * A form component that handles email template data input, recipient selection,
 * validation, and sending. Provides a complete email sending interface.
 * 
 * @example
 * ```tsx
 * <EmailForm
 *   templateKey="contact-form"
 *   initialData={{ subject: 'Contact Form Submission' }}
 *   onSuccess={(response) => {
 *     toast.success('Message sent successfully!');
 *     router.push('/thank-you');
 *   }}
 *   onError={(error) => {
 *     toast.error(`Failed to send: ${error.message}`);
 *   }}
 *   showMessages={true}
 * />
 * ```
 */
export function EmailForm({
  templateKey,
  initialData = {},
  initialRecipient = '',
  provider,
  onSuccess,
  onError,
  onSending,
  validate,
  className = '',
  showLoading = true,
  showMessages = true,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  successComponent: SuccessComponent,
}: EmailFormProps) {
  const {
    formData,
    setFormData,
    setTemplateData,
    sendEmail,
    loading,
    error,
    success,
    data,
    validationErrors,
    isValid,
    reset,
  } = useEmailForm({
    defaultTemplate: templateKey,
    defaultData: initialData,
    defaultRecipient: initialRecipient,
    defaultProvider: provider,
    validate,
    onSuccess,
    onError,
    onSending,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      try {
        await sendEmail();
      } catch (error) {
        // Error is handled by the onError callback
      }
    }
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ recipient: e.target.value });
  };

  const handleDataChange = (key: string, value: string) => {
    setTemplateData({ [key]: value });
  };

  // Show success message if configured
  if (success && showMessages) {
    if (SuccessComponent && data) {
      return <SuccessComponent response={data} />;
    }
    return (
      <div className="huefy-success" style={{ color: 'green', padding: '16px' }}>
        ✅ Email sent successfully! Message ID: {data?.messageId}
        <button 
          onClick={reset}
          style={{ marginLeft: '16px', padding: '4px 8px' }}
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`huefy-form ${className}`}>
      {/* Recipient Input */}
      <div className="huefy-field" style={{ marginBottom: '16px' }}>
        <label htmlFor="recipient" style={{ display: 'block', marginBottom: '4px' }}>
          Recipient Email *
        </label>
        <input
          id="recipient"
          type="email"
          value={formData.recipient}
          onChange={handleRecipientChange}
          placeholder="Enter recipient email"
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Dynamic Template Data Fields */}
      <div className="huefy-template-data">
        <h4 style={{ marginBottom: '8px' }}>Template Data</h4>
        {Object.entries(formData.data).map(([key, value]) => (
          <div key={key} className="huefy-field" style={{ marginBottom: '12px' }}>
            <label htmlFor={key} style={{ display: 'block', marginBottom: '4px' }}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              id={key}
              type="text"
              value={value}
              onChange={(e) => handleDataChange(key, e.target.value)}
              placeholder={`Enter ${key}`}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
        
        {/* Add new field button */}
        <AddFieldButton
          onAdd={(key) => setTemplateData({ [key]: '' })}
          existingKeys={Object.keys(formData.data)}
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="huefy-errors" style={{ 
          color: 'red', 
          marginBottom: '16px',
          padding: '8px',
          border: '1px solid red',
          borderRadius: '4px',
          backgroundColor: '#fee',
        }}>
          <strong>Please fix the following errors:</strong>
          <ul style={{ margin: '4px 0 0 20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* API Error */}
      {error && showMessages && (
        <div className="huefy-error" style={{ 
          color: 'red', 
          marginBottom: '16px',
          padding: '8px',
          border: '1px solid red',
          borderRadius: '4px',
          backgroundColor: '#fee',
        }}>
          {ErrorComponent ? (
            <ErrorComponent error={error} />
          ) : (
            <>
              <strong>Error:</strong> {error.message}
              {error.code && <div><small>Code: {error.code}</small></div>}
            </>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && showLoading && (
        <div className="huefy-loading" style={{ 
          marginBottom: '16px',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
        }}>
          {LoadingComponent ? (
            <LoadingComponent />
          ) : (
            '📧 Sending email...'
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="huefy-actions">
        <button
          type="submit"
          disabled={!isValid || loading}
          style={{
            padding: '12px 24px',
            backgroundColor: isValid && !loading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid && !loading ? 'pointer' : 'not-allowed',
            marginRight: '8px',
          }}
        >
          {loading ? 'Sending...' : 'Send Email'}
        </button>
        
        <button
          type="button"
          onClick={reset}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #6c757d',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

/**
 * Component for adding new template data fields
 */
function AddFieldButton({ 
  onAdd, 
  existingKeys 
}: { 
  onAdd: (key: string) => void; 
  existingKeys: string[];
}) {
  const [newKey, setNewKey] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    if (newKey.trim() && !existingKeys.includes(newKey.trim())) {
      onAdd(newKey.trim());
      setNewKey('');
      setShowInput(false);
    }
  };

  const handleCancel = () => {
    setNewKey('');
    setShowInput(false);
  };

  if (!showInput) {
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        style={{
          padding: '6px 12px',
          backgroundColor: 'transparent',
          color: '#007bff',
          border: '1px dashed #007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Field
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        placeholder="Field name"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
        }}
        autoFocus
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!newKey.trim() || existingKeys.includes(newKey.trim())}
        style={{
          padding: '4px 8px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Add
      </button>
      <button
        type="button"
        onClick={handleCancel}
        style={{
          padding: '4px 8px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Cancel
      </button>
    </div>
  );
}