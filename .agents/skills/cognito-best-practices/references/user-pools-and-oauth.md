# User Pools, OAuth/OIDC, and session design

## Boundary

User Pools are the Cognito OIDC issuer and user directory. The application receives
JWTs and must enforce authorization at the API/resource boundary. The browser should
not treat a successful redirect as proof that every API request is authorized.

For a SPA or mobile public client, use authorization code + PKCE. The client ID is
not a secret; a client secret is only for a confidential server-side client. Keep
the code verifier, state, nonce, and callback handling inside a maintained OIDC or
Amplify implementation. Exact redirect and sign-out URLs reduce code-injection,
mix-up, and environment-confusion risk.

## Verification contract

At the API boundary, verify:

1. JWS signature using the pool's rotating JWKS.
2. Issuer equals the exact expected pool issuer for the environment and Region.
3. Token use is correct (`access` for API authorization, `id` for client identity
   where appropriate).
4. Expiration and not-before are valid with a narrowly documented clock-skew window.
5. Audience/client ID is correct for the token type and API contract.
6. Required scopes, groups, and claims are present and have the expected type.
7. The subject is mapped to a current user and tenant membership in the server-side
   authorization source of truth.

Use a maintained verifier such as [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify)
or the equivalent supported library. Cache JWKS safely and refresh on an unknown key
ID; never accept a token merely because its payload decodes as JSON.

## Session lifecycle

Design access-token, ID-token, and refresh-token lifetimes together with the threat
model. Access tokens should not be made long-lived to hide a refresh bug. Refresh
operations need one-flight deduplication so several components do not race and log
the user out or overwhelm the token endpoint. On invalid refresh, clear the session
and return to an intentional sign-in state; on network failure, use bounded retry and
preserve user work.

UI logout, redirecting to `/logout`, revoking a refresh token, and global sign-out
have different effects. Document which one the product promises, how long already
issued access tokens remain usable, and what high-risk events trigger revocation or
forced reauthentication.

Do not store passwords or password hashes in web storage. A backend-for-frontend can
exchange the callback for a server session represented by a secure, HTTP-only,
SameSite cookie plus CSRF protection. Native apps should use platform-secure storage.
If a browser token cache is used, document its XSS and multi-tab threat model, keep
the lifetime bounded, and never print values during debugging.

## Managed login and federation

Use a Cognito domain or a custom domain with managed login/Hosted UI for browser
authentication when it fits the product. Configure TLS, exact callbacks, provider
metadata, state/nonce/PKCE, scopes, and logout behavior as a single tested contract.
For SAML/OIDC/social providers, verify issuer and audience, signing metadata/key
rotation, redirect endpoints, attribute mapping, verified contact semantics, and
account linking. External IdP authentication does not automatically make a mapped
email or group an application permission.

Useful official references:

- [App clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [Federation endpoints](https://docs.aws.amazon.com/cognito/latest/developerguide/federation-endpoints.html)
- [Verify JWTs](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
- [Cache tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-caching-tokens.html)
