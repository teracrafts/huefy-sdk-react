# Huefy React SDK Lab

Internal integration verification script. The React SDK wraps the TypeScript SDK — core utilities are imported directly from the TypeScript SDK source.

## Usage

```bash
npm run lab
```

## What it tests

1. Initialization — create `HuefyEmailClient` with a dummy API key
2. Config validation — empty API key throws an error
3. HMAC signing — `signPayload` returns a 64-char hex signature
4. Error sanitization — IP addresses and emails are redacted
5. PII detection — `detectPotentialPII` identifies sensitive fields
6. Circuit breaker state — initial state is `CLOSED`
7. Health check — passes whether the API is reachable or not
8. Cleanup — `close()` runs without error
