# Identity Pools and temporary AWS access

Identity Pools federate a trusted identity into short-lived AWS credentials. They
are appropriate when a client must directly use a supported AWS service, such as a
narrow S3 upload or an approved real-time client path. They are not a substitute for
an API's tenant/resource authorization model.

## Role review

- Disable unauthenticated identities unless guest access is a deliberate product
  feature. A guest role should allow only the minimum public action on specific
  resource ARNs.
- Authenticated roles must be least privilege, resource-scoped, and reviewed for
  every action, condition, provider trust, session duration, and tag mapping.
  `Resource: "*"`, administrative actions, wildcard `sts:AssumeRole`, or an identity
  pool role that can read all tenant data are high-risk findings.
- Role mappings and ABAC/session tags can reduce policy duplication, but they are
  safe only when claims are verified, the mapping is explicit, tags cannot be
  client-selected, and resource policies constrain the result. A tag is not a
  replacement for checking tenant membership and object ownership.
- Temporary credentials should not be logged, embedded in URLs, persisted longer
  than required, or treated as immediately invalid after User Pool sign-out. Model
  credential expiry and refresh in the client state machine.

## Prefer server-side access when possible

If the client only needs application data, use a backend that verifies a User Pool
access token and authorizes each request. The backend can keep AWS permissions out of
the browser, apply consistent tenant/database checks, rate limit per user/tenant,
and make auditing easier. Do not add an Identity Pool solely because Amplify can
provision one.

## Official references

- [Cognito IAM integration](https://docs.aws.amazon.com/cognito/latest/developerguide/security_iam_service-with-iam.html)
- [Cognito identity pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [Identity pools and ABAC](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)
- [Group-based role mapping](https://docs.aws.amazon.com/cognito/latest/developerguide/group-based-multi-tenancy.html)
