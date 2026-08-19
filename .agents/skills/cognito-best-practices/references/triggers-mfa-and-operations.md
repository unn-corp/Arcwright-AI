# Triggers, MFA, passkeys, and operational controls

## Triggers

Cognito invokes many Lambda triggers synchronously or as part of an authentication
workflow. Keep pre-sign-up, pre-authentication, custom auth, and pre-token generation
handlers small and bounded. A slow or unavailable entitlement, email, billing, or
analytics dependency can make sign-in slow or fail.

- Give each trigger least-privilege permissions and a bounded timeout.
- Avoid network calls in the critical path; if unavoidable, set short timeouts,
  failure policy, and a tested fallback.
- Make post-confirmation/post-auth side effects idempotent and preferably enqueue
  durable work rather than performing slow work inline.
- Keep pre-token claims minimal. Claims can be stale, increase token size, and are
  not a durable policy database.
- Test malformed attributes, federated users, retries, concurrent sign-ins, cold
  starts, timeout/error responses, and rollback of trigger versions.
- Log correlation IDs and outcome categories, never passwords, tokens, IdP assertions,
  MFA codes, or unnecessary personal data.

## MFA and passkeys

Choose required, optional, or disabled MFA explicitly for each environment and user
population. Prefer phishing-resistant passkeys/WebAuthn or TOTP when appropriate;
SMS has delivery, SIM-swap, availability, enumeration, and cost concerns. Recovery
and factor replacement are part of the authentication boundary: require appropriate
proof, rate limit attempts, avoid account enumeration, and test lost-device paths.

Passkeys depend on relying-party/domain configuration and user verification. Test
browser, mobile, platform-authenticator, security-key, recovery, and cross-domain
behavior before making them the only recovery path.

## Threat protection and operations

For public auth surfaces, assess AWS WAF, Cognito threat protection, rate controls,
bot/credential-stuffing signals, and account enumeration behavior. Monitor:

- sign-up/sign-in/refresh/token-endpoint throttles and error categories;
- trigger duration, errors, timeouts, concurrency, and cold-start impact;
- MFA/SMS/email delivery, bounces, complaints, and spend;
- unusual refresh, failed-login, recovery, disabled-user, or tenant concentration;
- API 401/403 and cross-tenant denial tests; and
- config/IAM/IdP/domain/secret changes in CloudTrail and deployment logs.

## Official references

- [Authentication flows](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [User pool security features](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-security.html)
- [User pool security best practices](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-security-best-practices.html)
- [All Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html)
- [Pre-token generation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html)
