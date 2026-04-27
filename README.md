# @teracrafts/huefy-react

Official React SDK for [Huefy](https://huefy.dev) — transactional email delivery made simple.

Wraps `@teracrafts/huefy` with React-idiomatic primitives: a context provider, declarative hooks for sending email, and a form-state hook.

## Installation

```bash
npm install @teracrafts/huefy-react @teracrafts/huefy
# or
yarn add @teracrafts/huefy-react @teracrafts/huefy
# or
pnpm add @teracrafts/huefy-react @teracrafts/huefy
```

`@teracrafts/huefy` is a **peer dependency** and must be installed alongside this package.

## Requirements

- React 18+
- Node.js 18+
- TypeScript 5.0+ (optional but recommended)

## Quick Start

Wrap your application with `HuefyProvider`, then use the `useHuefy` hook to send emails from any component.

```tsx
// App.tsx
import { HuefyProvider } from '@teracrafts/huefy-react';

export default function App() {
  return (
    <HuefyProvider config={{ apiKey: process.env.HUEFY_API_KEY! }}>
      <WelcomeForm />
    </HuefyProvider>
  );
}
```

```tsx
// WelcomeForm.tsx
import { useHuefy } from '@teracrafts/huefy-react';

export function WelcomeForm() {
  const { execute, loading, error, data } = useHuefy(
    async (client) =>
      client.sendEmail(
        'welcome-email',
        { firstName: 'Alice' },
        'alice@example.com',
      ),
  );

  return (
    <div>
      <button onClick={() => execute()} disabled={loading}>
        {loading ? 'Sending…' : 'Send welcome email'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && <p>Sent! ID: {data.data.emailId}</p>}
    </div>
  );
}
```

For imperative sends, `useSendEmail` also accepts the richer recipient object supported by the core SDK:

```tsx
import { useSendEmail } from '@teracrafts/huefy-react';

const { send } = useSendEmail();

await send('welcome-email', { firstName: 'Alice' }, {
  email: 'reviewer@example.com',
  type: 'cc',
  data: { locale: 'en' },
});
```

## Key Features

- **`HuefyProvider`** — shares a single `HuefyEmailClient` instance across the React tree; closes it automatically on unmount
- **`useHuefy`** — generic action hook; pass an async function that receives the client, returns `{ execute, loading, error, data, success, reset }`
- **`useEmailForm`** — managed form-state hook for building email send forms with validation
- **`useHuefyContext`** — access the raw context (`client`, `isReady`, `isLoading`, `error`) for advanced use
- **Retry with exponential backoff** — inherited from the core SDK
- **Circuit breaker** — inherited from the core SDK; opens after 5 consecutive failures
- **HMAC-SHA256 signing** — pass `enableRequestSigning: true` in the provider config
- **Key rotation** — pass `secondaryApiKey` in the provider config
- **Rate limit callbacks** — pass `onRateLimitUpdate` in the provider config

## Configuration Reference

All configuration is passed to `HuefyProvider` as the `config` prop. It accepts the same options as `HuefyConfig` from `@teracrafts/huefy`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | **Required.** Must have prefix `sdk_`, `srv_`, or `cli_` |
| `baseUrl` | `string` | `https://api.huefy.dev/api/v1/sdk` | Override the API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retryConfig.maxAttempts` | `number` | `3` | Total attempts including the first |
| `retryConfig.baseDelayMs` | `number` | `500` | Exponential backoff base delay |
| `retryConfig.maxDelayMs` | `number` | `10000` | Maximum backoff delay |
| `retryConfig.jitter` | `number` | `0.2` | Random jitter factor (0–1) |
| `circuitBreakerConfig.failureThreshold` | `number` | `5` | Consecutive failures before circuit opens |
| `circuitBreakerConfig.resetTimeoutMs` | `number` | `30000` | Milliseconds before half-open probe |
| `secondaryApiKey` | `string` | — | Backup key used during key rotation |
| `enableRequestSigning` | `boolean` | `false` | Enable HMAC-SHA256 request signing |
| `onRateLimitUpdate` | `(info: RateLimitInfo) => void` | — | Callback fired on rate-limit header changes |

## Hook API

### `useHuefy(actionFn, options?)`

A generic hook that executes any async operation against the Huefy client.

```ts
function useHuefy<T>(
  actionFn: (client: HuefyEmailClient, ...args: unknown[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): {
  execute: (...args: unknown[]) => Promise<T | undefined>
  loading: boolean
  error: Error | null
  data: T | null
  success: boolean
  reset: () => void
}
```

### `useEmailForm(options?)`

A managed form-state hook for building email send UIs.

```ts
function useEmailForm(options?: {
  defaultTemplate?: string
  defaultData?: EmailData
  defaultRecipient?: SingleRecipient
  defaultProvider?: EmailProvider
  validate?: (formData: EmailFormData) => string[] | null
  onSuccess?: (response: SendEmailResponse) => void
  onError?: (error: Error) => void
  onSending?: () => void
}): {
  formData: EmailFormData
  setFormData: (data: Partial<EmailFormData>) => void
  setTemplateData: (data: EmailData) => void
  sendEmail: () => Promise<SendEmailResponse | undefined>
  reset: () => void
  loading: boolean
  error: Error | null
  data: SendEmailResponse | null
  success: boolean
  validationErrors: string[]
  isValid: boolean
}
```

### `useHuefyContext()`

```ts
const { client, isReady, isLoading, error } = useHuefyContext();
```

Access the raw context for advanced or imperative use.

## Error Handling

```tsx
import { useHuefy } from '@teracrafts/huefy-react';
import { RateLimitError, CircuitOpenError } from '@teracrafts/huefy';

function SendButton() {
  const { execute, error } = useHuefy(
    async (client) =>
      client.sendEmail('notification', {}, 'user@example.com'),
    {
      onError: (err) => {
        if (err instanceof RateLimitError) {
          alert(`Rate limited. Retry after ${err.retryAfter}s`);
        } else if (err instanceof CircuitOpenError) {
          alert('Email service temporarily unavailable');
        }
      },
    },
  );

  return <button onClick={() => execute()}>Notify</button>;
}
```

## Local Development

Set `baseUrl` in the provider config to point at a local Huefy server:

```tsx
<HuefyProvider
  config={{
    apiKey: 'sdk_local_key',
    baseUrl: 'https://api.huefy.on/api/v1/sdk',
  }}
>
  {children}
</HuefyProvider>
```

Or set `HUEFY_MODE=local` before starting your dev server to target `https://api.huefy.on/api/v1/sdk`. If you need to bypass Caddy, set `baseUrl` to `http://localhost:8080/api/v1/sdk` explicitly.

## Developer Guide

Full documentation, advanced patterns, and provider configuration are in the [React Developer Guide](../../docs/spec/guides/react.guide.md).

## License

MIT
