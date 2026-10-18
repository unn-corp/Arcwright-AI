<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

# Amazon Cognito best practices

Treat Cognito as an identity boundary, not as the complete authorization model.
First identify which Cognito primitive is in use, who the token or temporary
credential is for, what resource the caller is accessing, and where the server
enforces authorization. Optimize the user experience and auth path, but never
trade away issuer/signature validation, least privilege, tenant isolation, or
safe recovery for a faster-looking flow.
