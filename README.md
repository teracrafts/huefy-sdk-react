# Huefy React SDK

The official React SDK for Huefy - App Mail Templates. Provides React hooks, context providers, and components for seamless template-based email integration in React applications.

## Installation

Install the SDK using npm or yarn:

```bash
npm install @teracrafts/huefy-react
# or
yarn add @teracrafts/huefy-react
```

## Quick Start

### 1. Setup the Provider

Wrap your app with the `HuefyProvider`:

```tsx
import React from 'react';
import { HuefyProvider } from '@teracrafts/huefy-react';
import App from './App';

function Root() {
  return (
    <HuefyProvider apiKey="your-huefy-api-key">
      <App />
    </HuefyProvider>
  );
}

export default Root;
```

### 2. Use the Hook

Use the `useHuefy` hook in your components:

```tsx
import React, { useState } from 'react';
import { useHuefy, EmailProvider } from '@teracrafts/huefy-react';

function WelcomeEmailForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const { sendEmail, loading, error, success } = useHuefy({
    onSuccess: (messageId) => {
      console.log('Email sent:', messageId);
      alert('Welcome email sent successfully!');
    },
    onError: (error) => {
      console.error('Failed to send email:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await sendEmail(
      'welcome-email',
      {
        name: name,
        company: 'Your Company',
        activationLink: 'https://app.example.com/activate'
      },
      email,
      {
        provider: EmailProvider.SENDGRID
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <button type="submit" disabled={loading || !email || !name}>
        {loading ? 'Sending...' : 'Send Welcome Email'}
      </button>
      {error && <div className="error">Error: {error.message}</div>}
      {success && <div className="success">Email sent successfully!</div>}
    </form>
  );
}
```

## Features

- ✅ **React Hooks** - `useHuefy` hook for email operations
- ✅ **Context Provider** - Global configuration and state management
- ✅ **TypeScript Support** - Full type safety with TypeScript
- ✅ **Loading States** - Built-in loading and error state management
- ✅ **Multiple Providers** - Support for SendGrid, Mailgun, SES, Mailchimp
- ✅ **Bulk Operations** - Send multiple emails efficiently
- ✅ **Health Monitoring** - API health check functionality
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Retry Logic** - Automatic retries with exponential backoff

## API Reference

### HuefyProvider

The context provider that wraps your application:

```tsx
interface HuefyProviderProps {
  apiKey: string;
  config?: HuefyConfig;
  children: React.ReactNode;
}

interface HuefyConfig {
  baseUrl?: string;
  timeout?: number;
  retryOptions?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}
```

**Example:**
```tsx
<HuefyProvider 
  apiKey="your-api-key"
  config={{
    baseUrl: 'https://api.huefy.com',
    timeout: 30000,
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  }}
>
  <App />
</HuefyProvider>
```

### useHuefy Hook

The main hook for email operations:

```tsx
interface UseHuefyOptions {
  onSuccess?: (messageId: string) => void;
  onError?: (error: Error) => void;
  onLoadingChange?: (loading: boolean) => void;
}

interface UseHuefyResult {
  sendEmail: (
    templateKey: string,
    data: Record<string, any>,
    recipient: string,
    options?: SendEmailOptions
  ) => Promise<SendEmailResponse>;
  
  sendBulkEmails: (
    emails: BulkEmailRequest[]
  ) => Promise<BulkEmailResponse>;
  
  healthCheck: () => Promise<HealthResponse>;
  
  loading: boolean;
  error: Error | null;
  success: boolean;
  lastResponse: SendEmailResponse | BulkEmailResponse | null;
}
```

### SendEmailOptions

```tsx
interface SendEmailOptions {
  provider?: EmailProvider;
}

enum EmailProvider {
  SES = 'ses',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  MAILCHIMP = 'mailchimp'
}
```

## Usage Examples

### Single Email with Form

```tsx
import React, { useState } from 'react';
import { useHuefy, EmailProvider } from '@teracrafts/huefy-react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const { sendEmail, loading, error } = useHuefy({
    onSuccess: () => {
      setFormData({ name: '', email: '', message: '' });
      alert('Message sent successfully!');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await sendEmail(
      'contact-form',
      {
        senderName: formData.name,
        senderEmail: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString()
      },
      'contact@yourcompany.com',
      { provider: EmailProvider.MAILGUN }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        required
      />
      <input
        type="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        required
      />
      <textarea
        placeholder="Your Message"
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {error && <div className="error">Failed to send: {error.message}</div>}
    </form>
  );
}
```

### Bulk Email Newsletter

```tsx
import React, { useState } from 'react';
import { useHuefy } from '@teracrafts/huefy-react';

function NewsletterSender() {
  const [subscribers] = useState([
    { email: 'user1@example.com', name: 'Alice' },
    { email: 'user2@example.com', name: 'Bob' },
    { email: 'user3@example.com', name: 'Carol' }
  ]);

  const { sendBulkEmails, loading, error } = useHuefy({
    onSuccess: (result) => {
      const { successfulEmails, totalEmails } = result;
      alert(`Newsletter sent to ${successfulEmails}/${totalEmails} subscribers`);
    }
  });

  const sendNewsletter = async () => {
    const emails = subscribers.map(subscriber => ({
      templateKey: 'newsletter',
      recipient: subscriber.email,
      data: {
        subscriberName: subscriber.name,
        newsletterTitle: 'Weekly Updates',
        unsubscribeLink: 'https://app.example.com/unsubscribe'
      }
    }));

    await sendBulkEmails(emails);
  };

  return (
    <div>
      <h2>Send Newsletter</h2>
      <p>Recipients: {subscribers.length} subscribers</p>
      <button onClick={sendNewsletter} disabled={loading}>
        {loading ? 'Sending Newsletter...' : 'Send Newsletter'}
      </button>
      {error && <div className="error">Failed to send newsletter: {error.message}</div>}
    </div>
  );
}
```

### Health Check Component

```tsx
import React, { useEffect, useState } from 'react';
import { useHuefy } from '@teracrafts/huefy-react';

function ApiHealthStatus() {
  const [healthData, setHealthData] = useState(null);
  const { healthCheck, loading, error } = useHuefy();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await healthCheck();
        setHealthData(health);
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [healthCheck]);

  if (loading) return <div>Checking API health...</div>;
  if (error) return <div>Health check failed: {error.message}</div>;
  if (!healthData) return <div>No health data available</div>;

  return (
    <div className={`health-status ${healthData.status}`}>
      <h3>API Health Status</h3>
      <div>Status: {healthData.status}</div>
      <div>Version: {healthData.version}</div>
      <div>Uptime: {Math.floor(healthData.uptime / 3600)} hours</div>
    </div>
  );
}
```

### Email Form with Validation

```tsx
import React, { useState } from 'react';
import { useHuefy, EmailProvider } from '@teracrafts/huefy-react';

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
}

function UserRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { sendEmail, loading, error } = useHuefy({
    onSuccess: () => {
      setFormData({ name: '', email: '', company: '' });
      setErrors({});
      alert('Registration email sent!');
    }
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    await sendEmail(
      'user-registration',
      {
        userName: formData.name,
        userEmail: formData.email,
        userCompany: formData.company || 'Individual',
        activationLink: `https://app.example.com/activate/${Date.now()}`,
        welcomeMessage: 'Welcome to our platform!'
      },
      formData.email,
      { provider: EmailProvider.SENDGRID }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="field">
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={loading}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className="field">
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={loading}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="field">
        <label>Company</label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading || Object.keys(errors).length > 0}>
        {loading ? 'Sending Registration Email...' : 'Register'}
      </button>

      {error && (
        <div className="error-message">
          Registration failed: {error.message}
        </div>
      )}
    </form>
  );
}
```

## Error Handling

The SDK provides comprehensive error handling:

```tsx
import { useHuefy } from '@teracrafts/huefy-react';

function EmailComponent() {
  const { sendEmail, error } = useHuefy({
    onError: (error) => {
      // Handle different error types
      switch (error.name) {
        case 'ValidationError':
          console.error('Validation failed:', error.message);
          break;
        case 'AuthenticationError':
          console.error('Invalid API key');
          break;
        case 'NetworkError':
          console.error('Network issue:', error.message);
          break;
        case 'TimeoutError':
          console.error('Request timed out');
          break;
        default:
          console.error('Unknown error:', error.message);
      }
    }
  });

  // Component implementation...
}
```

## TypeScript Support

The SDK is fully typed. Import types as needed:

```tsx
import {
  HuefyProvider,
  useHuefy,
  EmailProvider,
  SendEmailResponse,
  BulkEmailResponse,
  HealthResponse,
  HuefyConfig,
  UseHuefyOptions
} from '@teracrafts/huefy-react';
```

## Testing

The SDK includes comprehensive testing utilities:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HuefyProvider } from '@teracrafts/huefy-react';
import YourComponent from './YourComponent';

// Mock the Huefy client for testing
jest.mock('@teracrafts/huefy-react', () => ({
  ...jest.requireActual('@teracrafts/huefy-react'),
  useHuefy: () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
    loading: false,
    error: null,
    success: true
  })
}));

test('sends email when form is submitted', async () => {
  render(
    <HuefyProvider apiKey="test-key">
      <YourComponent />
    </HuefyProvider>
  );

  fireEvent.click(screen.getByText('Send Email'));

  await waitFor(() => {
    expect(screen.getByText('Email sent successfully!')).toBeInTheDocument();
  });
});
```

## Performance Tips

1. **Memoize email data** to prevent unnecessary re-renders:
```tsx
const emailData = useMemo(() => ({
  name: user.name,
  email: user.email
}), [user.name, user.email]);
```

2. **Use callback functions** for event handlers:
```tsx
const handleSendEmail = useCallback(async () => {
  await sendEmail(templateKey, data, recipient);
}, [sendEmail, templateKey, data, recipient]);
```

3. **Debounce form submissions** to prevent accidental double-sends:
```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSendEmail = useDebouncedCallback(
  (templateKey, data, recipient) => {
    sendEmail(templateKey, data, recipient);
  },
  1000
);
```

## Requirements

- React 16.8+ (hooks support)
- TypeScript 4.0+ (optional but recommended)
- Modern browser with Fetch API support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

## License

This SDK is released under the MIT License. See [LICENSE](../../LICENSE) for details.

## Support

- **Documentation**: [https://docs.huefy.dev/sdk/react](https://docs.huefy.dev/sdk/react)
- **Examples**: [./examples/](./examples/)
- **Issues**: [GitHub Issues](https://github.com/teracrafts/huefy-sdk-react/issues)
- **Email**: [hello@huefy.dev](mailto:hello@huefy.dev)