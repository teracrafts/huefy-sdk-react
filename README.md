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
  const { send, loading, error, data } = useHuefy({
    templateKey: 'welcome-email',
    recipient: { email: 'alice@example.com', name: 'Alice' },
    variables: { firstName: 'Alice' },
  });

  return (
    <div>
      <button onClick={send} disabled={loading}>
        {loading ? 'Sending…' : 'Send welcome email'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && <p>Sent! Message ID: {data.messageId}</p>}
    </div>
  );
}
```

## Key Features

- **`HuefyProvider`** — shares a single `HuefyEmailClient` instance across the React tree; closes it automatically on unmount
- **`useHuefy`** — declarative hook for sending a single email with `loading`, `error`, and `data` state
- **`useHuefyBulk`** — hook for sending bulk emails
- **`useHuefyClient`** — access the raw `HuefyEmailClient` for imperative use
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

### `useHuefy(options)`

```ts
interface UseHuefyOptions {
  templateKey: string
  recipient: { email: string; name?: string }
  variables?: Record<string, string | number | boolean>
  provider?: 'ses' | 'sendgrid' | 'mailgun' | 'mailchimp'
}

interface UseHuefyReturn {
  send: () => Promise<void>
  loading: boolean
  error: HuefyError | null
  data: SendEmailResponse | null
  reset: () => void
}
```

### `useHuefyClient()`

```ts
const client = useHuefyClient(); // returns HuefyEmailClient
```

Use this for one-off or imperative calls (e.g. health checks, bulk sends).

## Error Handling

```tsx
import { useHuefy } from '@teracrafts/huefy-react';
import { HuefyRateLimitError, HuefyCircuitOpenError } from '@teracrafts/huefy';

function SendButton() {
  const { send, error } = useHuefy({
    templateKey: 'notification',
    recipient: { email: 'user@example.com' },
  });

  const handleSend = async () => {
    await send();
    if (error instanceof HuefyRateLimitError) {
      alert(`Rate limited. Retry after ${error.retryAfter}s`);
    } else if (error instanceof HuefyCircuitOpenError) {
      alert('Email service temporarily unavailable');
    }
  };

  return <button onClick={handleSend}>Notify</button>;
}
```

## Local Development

Set `baseUrl` in the provider config to point at a local Huefy server:

```tsx
<HuefyProvider
  config={{
    apiKey: 'sdk_local_key',
    baseUrl: 'http://localhost:3000/api/v1/sdk',
  }}
>
  {children}
</HuefyProvider>
```

Or set the `HUEFY_MODE=local` environment variable before starting your dev server.

## Developer Guide

Full documentation, advanced patterns, and provider configuration are in the [React Developer Guide](../../docs/spec/guides/react.guide.md).

## License

MIT
