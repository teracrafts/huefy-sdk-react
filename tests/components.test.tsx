/**
 * Tests for React components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HuefyClient } from '@huefy/sdk';
import { HuefyProvider } from '../src/context.js';
import { SendEmailButton, EmailForm } from '../src/components.js';
import type { SendEmailResponse, HuefyError } from '@huefy/sdk';

// Mock the SDK client
jest.mock('@huefy/sdk');
const MockedHuefyClient = jest.mocked(HuefyClient);

// Mock responses
const mockSuccessResponse: SendEmailResponse = {
  messageId: 'test-message-id',
  status: 'sent',
  provider: 'ses',
  timestamp: new Date().toISOString(),
};

const mockError: HuefyError = {
  name: 'HuefyError',
  message: 'Test error',
  code: 'TEST_ERROR',
} as HuefyError;

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <HuefyProvider
      config={{
        apiKey: 'test-key',
        baseURL: 'https://test.huefy.com',
      }}
    >
      {children}
    </HuefyProvider>
  );
}

describe('SendEmailButton', () => {
  let mockClient: jest.Mocked<HuefyClient>;

  beforeEach(() => {
    mockClient = {
      sendEmail: jest.fn(),
      sendBulkEmails: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    MockedHuefyClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default text', () => {
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
        />
      </TestWrapper>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Send Email');
  });

  it('should render with custom children', () => {
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
        >
          Custom Text
        </SendEmailButton>
      </TestWrapper>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Custom Text');
  });

  it('should send email when clicked', async () => {
    mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
    
    const onSuccess = jest.fn();
    
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          onSuccess={onSuccess}
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        undefined
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(mockSuccessResponse);
  });

  it('should send email with provider option', async () => {
    mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
    
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          provider="sendgrid"
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        { provider: 'sendgrid' }
      );
    });
  });

  it('should show loading state', async () => {
    let resolvePromise: (value: SendEmailResponse) => void;
    const promise = new Promise<SendEmailResponse>((resolve) => {
      resolvePromise = resolve;
    });
    mockClient.sendEmail.mockReturnValueOnce(promise);
    
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          loadingText="Sending..."
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Should show loading text
    expect(button).toHaveTextContent('Sending...');
    expect(button).toBeDisabled();

    // Resolve the promise
    resolvePromise!(mockSuccessResponse);
    await promise;

    await waitFor(() => {
      expect(button).toHaveTextContent('Send Email');
      expect(button).not.toBeDisabled();
    });
  });

  it('should handle errors', async () => {
    mockClient.sendEmail.mockRejectedValueOnce(mockError);
    
    const onError = jest.fn();
    
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          onError={onError}
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  it('should respect disabled prop', () => {
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          disabled={true}
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply custom className and style', () => {
    render(
      <TestWrapper>
        <SendEmailButton
          templateKey="test-template"
          data={{ name: 'John' }}
          recipient="john@example.com"
          className="custom-class"
          style={{ backgroundColor: 'red' }}
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveStyle({ backgroundColor: 'red' });
  });
});

describe('EmailForm', () => {
  let mockClient: jest.Mocked<HuefyClient>;
  const user = userEvent.setup();

  beforeEach(() => {
    mockClient = {
      sendEmail: jest.fn(),
      sendBulkEmails: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    MockedHuefyClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with recipient field', () => {
    render(
      <TestWrapper>
        <EmailForm templateKey="test-template" />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('should render with initial data', () => {
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John', company: 'Acme' }}
          initialRecipient="john@example.com"
        />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(
      <TestWrapper>
        <EmailForm templateKey="test-template" />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/recipient email/i);
    await user.type(emailInput, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /send email/i });
    expect(submitButton).toBeDisabled();
  });

  it('should add new template data fields', async () => {
    render(
      <TestWrapper>
        <EmailForm templateKey="test-template" />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', { name: /add field/i });
    await user.click(addButton);

    const nameInput = screen.getByPlaceholderText('Field name');
    await user.type(nameInput, 'customField');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByLabelText(/custom field/i)).toBeInTheDocument();
    });
  });

  it('should cancel adding new field with Escape', async () => {
    render(
      <TestWrapper>
        <EmailForm templateKey="test-template" />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', { name: /add field/i });
    await user.click(addButton);

    const nameInput = screen.getByPlaceholderText('Field name');
    await user.type(nameInput, 'customField');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Field name')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
    });
  });

  it('should prevent duplicate field names', async () => {
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
        />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', { name: /add field/i });
    await user.click(addButton);

    const nameInput = screen.getByPlaceholderText('Field name');
    await user.type(nameInput, 'name'); // Duplicate field name

    const addFieldButton = screen.getByRole('button', { name: 'Add' });
    expect(addFieldButton).toBeDisabled();
  });

  it('should submit valid form', async () => {
    mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
    
    const onSuccess = jest.fn();
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
          onSuccess={onSuccess}
        />
      </TestWrapper>
    );

    const form = screen.getByRole('form') || screen.getByText(/send email/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockClient.sendEmail).toHaveBeenCalledWith(
        'test-template',
        { name: 'John' },
        'john@example.com',
        {}
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(mockSuccessResponse);
  });

  it('should show success message after sending', async () => {
    mockClient.sendEmail.mockResolvedValueOnce(mockSuccessResponse);
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
          showMessages={true}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /send email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email sent successfully/i)).toBeInTheDocument();
      expect(screen.getByText(mockSuccessResponse.messageId)).toBeInTheDocument();
    });

    // Should show "Send Another" button
    expect(screen.getByRole('button', { name: /send another/i })).toBeInTheDocument();
  });

  it('should show error message on failure', async () => {
    mockClient.sendEmail.mockRejectedValueOnce(mockError);
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
          showMessages={true}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /send email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error:/i)).toBeInTheDocument();
      expect(screen.getByText(mockError.message)).toBeInTheDocument();
      expect(screen.getByText(mockError.code!)).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    let resolvePromise: (value: SendEmailResponse) => void;
    const promise = new Promise<SendEmailResponse>((resolve) => {
      resolvePromise = resolve;
    });
    mockClient.sendEmail.mockReturnValueOnce(promise);
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
          showLoading={true}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /send email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/sending email/i)).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Sending...');
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!(mockSuccessResponse);
    await promise;

    await waitFor(() => {
      expect(screen.queryByText(/sending email/i)).not.toBeInTheDocument();
    });
  });

  it('should reset form when reset button is clicked', async () => {
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
        />
      </TestWrapper>
    );

    // Change email field
    const emailInput = screen.getByLabelText(/recipient email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'changed@example.com');

    // Reset form
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });
  });

  it('should use custom validation function', () => {
    const customValidate = jest.fn().mockReturnValue(['Custom validation error']);
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          validate={customValidate}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Custom validation error')).toBeInTheDocument();
    expect(customValidate).toHaveBeenCalled();
  });

  it('should render custom error component', async () => {
    mockClient.sendEmail.mockRejectedValueOnce(mockError);
    
    const CustomErrorComponent = ({ error }: { error: HuefyError }) => (
      <div data-testid="custom-error">Custom: {error.message}</div>
    );
    
    render(
      <TestWrapper>
        <EmailForm
          templateKey="test-template"
          initialData={{ name: 'John' }}
          initialRecipient="john@example.com"
          showMessages={true}
          errorComponent={CustomErrorComponent}
        />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /send email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByText(`Custom: ${mockError.message}`)).toBeInTheDocument();
    });
  });
});