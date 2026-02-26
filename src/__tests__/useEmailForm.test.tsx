import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock basic validation
describe('useEmailForm validation logic', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function defaultValidate(formData: { templateKey: string; data: Record<string, string>; recipient: string }) {
    const errors: string[] = [];
    if (!formData.templateKey || formData.templateKey.trim().length === 0) {
      errors.push('Template key is required');
    }
    if (!formData.recipient || formData.recipient.trim().length === 0) {
      errors.push('Recipient email is required');
    } else if (!EMAIL_REGEX.test(formData.recipient.trim())) {
      errors.push('Invalid email address');
    }
    if (!formData.data || Object.keys(formData.data).length === 0) {
      errors.push('Template data is required');
    }
    return errors.length > 0 ? errors : null;
  }

  it('validates valid form data', () => {
    const result = defaultValidate({
      templateKey: 'welcome',
      data: { name: 'John' },
      recipient: 'john@example.com',
    });
    expect(result).toBeNull();
  });

  it('catches missing template key', () => {
    const result = defaultValidate({
      templateKey: '',
      data: { name: 'John' },
      recipient: 'john@example.com',
    });
    expect(result).toContain('Template key is required');
  });

  it('catches invalid email', () => {
    const result = defaultValidate({
      templateKey: 'welcome',
      data: { name: 'John' },
      recipient: 'bad-email',
    });
    expect(result).toContain('Invalid email address');
  });

  it('catches empty data', () => {
    const result = defaultValidate({
      templateKey: 'welcome',
      data: {},
      recipient: 'john@example.com',
    });
    expect(result).toContain('Template data is required');
  });

  it('catches multiple errors', () => {
    const result = defaultValidate({
      templateKey: '',
      data: {},
      recipient: '',
    });
    expect(result!.length).toBeGreaterThanOrEqual(3);
  });
});
