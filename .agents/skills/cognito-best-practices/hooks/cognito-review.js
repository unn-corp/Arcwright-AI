#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused Cognito/auth reminders; it never
// runs a build, calls AWS, changes a file, sends auth messages, or blocks an edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksCognito } = require('./cognito-context');

const AUTH_PATH = /(?:^|\/)(?:amplify\/auth|auth|authentication|cognito|user[-_]?pool|identity[-_]?pool|oidc|oauth|sso|federat|middleware|api|server|lambda|functions?)\b/i;
const CONFIG_PATH = /(?:^|\/)(?:amplify_outputs\.json|amplify\.ya?ml|cdk\.json|serverless\.ya?ml|template\.ya?ml|terraform|main\.tf|package\.json|pnpm-lock\.yaml|yarn\.lock|package-lock\.json)$/i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components|frontend|client)\/(?:[^/]+\/)*[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;
const IAC_OR_FUNCTION = /(?:^|\/)(?:amplify\/|cdk|infra|infrastructure|terraform|serverless|functions?|lambdas?)\//i;

function toolInput(payload = {}) {
  return payload.tool_input || payload.toolInput || payload.input || payload;
}

function changedPath(payload = {}) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}

function changedText(payload = {}) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}

function readRepoFile(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), 'utf8');
  } catch {
    return '';
  }
}

function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return AUTH_PATH.test(normalized) || CONFIG_PATH.test(normalized) ||
    (IAC_OR_FUNCTION.test(normalized) && repoLooksCognito(root)) ||
    (UI_SOURCE.test(normalized) && (repoLooksCognito(root) || /(?:cognito|aws-amplify|fetchAuthSession|signIn|signOut|useAuthenticator|Amplify\.configure)/i.test(content)));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];
  const isPublicSource = UI_SOURCE.test(normalized) || /(?:^|\/)(?:public|static|dist|build)\//i.test(normalized);

  if (isPublicSource && /(?:client[_-]?secret|generate[_-]?secret)/i.test(fullText)) {
    findings.push('A Cognito client secret appears in browser/public code or configuration; public clients must not embed secrets. Use a public client with authorization code + PKCE, or keep a confidential client entirely server-side.');
  }

  if (/(?:AllowedOAuthFlows|allowedOAuthFlows|response_type|responseType)[\s:=\"']*(?:\[?[^\n]*\bimplicit\b|[\"']token[\"'])/i.test(fullText)) {
    findings.push('An OAuth implicit/token response flow appears in the edit; prefer authorization code + PKCE for browser/mobile clients and document any exceptional legacy requirement.');
  }

  if (/(?:oauth2\/authorize|authorization.?code|response_type[=:][\"']?code|allowedOAuthFlows)/i.test(fullText) &&
      !/(?:code_challenge|codeChallenge|pkce|S256)/i.test(fullText) && isPublicSource) {
    findings.push('Review this public OAuth path for authorization-code PKCE: generate a fresh verifier/challenge and validate state/nonce at the callback instead of relying on a client secret.');
  }

  if (/(?:jwtDecode|decodeJwt|atob\s*\(|split\s*\(\s*[\"']\.\s*[\"']\s*\)\s*\[\s*1\s*\]|JSON\.parse\([^\n]*token)/i.test(fullText) &&
      !/(?:aws-jwt-verify|jwtVerify|verify\s*\(|verifyToken|signature)/i.test(fullText)) {
    findings.push('JWT payload decoding is present without an evident verification path; decoding is not authentication. Verify JWKS signature, exact issuer/pool, token use, expiry/not-before, audience/client, scopes, and tenant authorization at the API boundary.');
  }

  if (/localStorage\.(?:setItem|getItem)\s*\([^\n]*(?:password|refresh.?token|access.?token|id.?token|jwt|cognito)/i.test(fullText)) {
    findings.push('A password or Cognito bearer token is being placed in localStorage; review XSS/session exposure and prefer secure, architecture-appropriate storage with bounded lifetime and refresh/revocation handling.');
  }

  if (isPublicSource && /(?:Admin(?:CreateUser|DeleteUser|DisableUser|EnableUser|SetUserPassword|UpdateUserAttributes)|AdminInitiateAuth|AdminRespondToAuthChallenge|@aws-sdk\/client-cognito-identity-provider)/i.test(fullText)) {
    findings.push('Cognito admin APIs or the admin SDK appear in public/client code; move administrative operations behind a least-privilege server boundary and never expose admin credentials.');
  }

  if (/(?:AllowUnauthenticatedIdentities|allowUnauthenticatedIdentities|unauthenticated.?identit(?:y|ies)|unauthenticatedRole)/i.test(fullText) &&
      /(?:true|enabled|allow|role)/i.test(fullText)) {
    findings.push('Identity Pool unauthenticated access is in scope; verify it is intentional and that the guest IAM role is narrowly resource-scoped with no tenant data, admin, or wildcard access.');
  }

  if (/(?:AssumeRole|iam::\*|Resource\s*[:=]\s*[\"']\*[\"']|Action\s*[:=]\s*[\"']\*[\"'])/i.test(fullText) &&
      (IAC_OR_FUNCTION.test(normalized) || /identity.?pool|cognito/i.test(fullText))) {
    findings.push('Broad IAM action/resource or role-assumption access appears near Cognito configuration; inspect the generated authenticated/guest role and reduce actions, resources, conditions, and session tags to the smallest client need.');
  }

  if (/(?:tenant|multi.?tenant|organization|workspace|orgId|tenantId)/i.test(fullText) &&
      (AUTH_PATH.test(normalized) || IAC_OR_FUNCTION.test(normalized)) &&
      !/(?:membership|entitlement|authorize|authorization|permission|object.?owner|tenant.?check|tenant.?predicate|WHERE[^\n]*tenant)/i.test(fullText)) {
    findings.push('Tenant concepts appear without an evident membership/authorization check; resolve tenant from a verified subject plus server-side membership and apply the tenant predicate to every sensitive read/write. Groups/claims/filters are not sufficient boundaries.');
  }

  if (/(?:redirect|callback|logout|signout|return.?url|redirect.?uri)/i.test(fullText) &&
      /(?:\*|https?:\/\/[^\s\"']+\/\*|localhost)/i.test(fullText)) {
    findings.push('Review Cognito callback/sign-out URLs for wildcard or environment-confused entries; use exact allow-listed HTTPS URLs and keep R&D and production domains/clients separate.');
  }

  if (IAC_OR_FUNCTION.test(normalized) && /(?:fetch\s*\(|axios\.|https\.request|https\.get|Invoke|request\s*\()/i.test(fullText) &&
      /(?:trigger|preSignUp|postConfirmation|preAuthentication|preToken|customMessage|userMigration|defineFunction)/i.test(fullText) &&
      !/(?:timeout|AbortController|socketTimeout|connectTimeout)/i.test(fullText)) {
    findings.push('A Cognito trigger appears to call an external dependency without an evident timeout; keep critical auth-path work bounded, least-privileged, and failure-safe, or move slow side effects to durable asynchronous work.');
  }

  if (/(?:Amplify\.configure|configure\s*\()/i.test(fullText) && /(?:auth|cognito|aws-amplify)/i.test(fullText) &&
      /(?:components|pages|src|app)\//i.test(normalized)) {
    findings.push('Amplify Auth configuration appears in UI code; keep one configuration at the application entrypoint and one deduplicated auth bootstrap/refresh state machine to avoid auth waterfalls and redirect loops.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The cognito-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making an authentication, authorization, tenancy, or performance decision; this hook is advisory and read-only.',
      ].join('\n'),
    },
  }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  const root = projectRoot(payload);
  const filePath = changedPath(payload);
  const content = changedText(payload);
  if (filePath && relevantPath(filePath, content, root)) {
    const findings = inspect(filePath, content, root);
    if (findings.length > 0) emit(payload, findings);
  }
}

module.exports = {
  changedPath,
  inspect,
  relevantPath,
};
