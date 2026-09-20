# Security Notes

## Ionic migration
- Hard-coded administrator credentials must not be committed to source.
- Google Drive OAuth credentials are read from environment variables.
- TLS certificate verification must remain enabled.
- Electron renderer isolation is retained.
- Capacitor cleartext traffic and mixed content are disabled.
- OAuth loopback callbacks use a random state value.
- Client-side licensing is not a trusted hardware attestation.

## Production recommendation
License issuance/verification and sensitive secrets should be handled by a trusted backend. A distributed client cannot keep a secret cryptographic signing key confidential.
