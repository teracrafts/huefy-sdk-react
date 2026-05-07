# Huefy React SDK Lab

Verifies the wrapped email client contract used by the React SDK without sending live email.

## Run

```bash
npm run lab
```

from `sdks/react/`.

## Scenarios

1. Initialization
2. Single email contract
3. Bulk email contract
4. Validation rejects invalid single recipient
5. Validation rejects invalid bulk request
6. Health check path
7. Cleanup

## Notes

- The React lab exercises the underlying TypeScript email client behavior.
- It uses a local stubbed transport and checks request/response contract fidelity.
