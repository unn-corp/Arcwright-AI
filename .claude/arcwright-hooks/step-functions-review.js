#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused Step Functions reminders; it never
// runs a build, calls AWS, starts/stops an execution, changes ASL, or blocks an edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksStepFunctions } = require('./step-functions-context');

const WORKFLOW_PATH = /(?:^|\/)(?:step[-_]?functions?|stepfunctions|state[-_]?machines?|statemachine|asl|workflow|workflows|sfn|orchestrat|infra|infrastructure|cdk|serverless)\b/i;
const CONFIG_PATH = /(?:^|\/)(?:asl\.(?:json|ya?ml)|state[-_]?machine[^/]*\.(?:json|ya?ml)|template\.ya?ml|serverless\.ya?ml|cdk\.json|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
const SOURCE_PATH = /(?:^|\/)(?:src|app|api|backend|functions?|services|workflows?|step[-_]?functions?|state[-_]?machines?|infra|infrastructure)\/(?:[^/]+\/)*[^/]+\.(?:[cm]?[jt]sx?|json|ya?ml|py|java|go|rs)$/i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components|frontend|client)\/(?:[^/]+\/)*[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

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
  return WORKFLOW_PATH.test(normalized) || CONFIG_PATH.test(normalized) ||
    (SOURCE_PATH.test(normalized) && (repoLooksStepFunctions(root) || /(?:step.?functions|state.?machine|startExecution|TaskToken|arn:aws:states)/i.test(content))) ||
    (UI_SOURCE.test(normalized) && repoLooksStepFunctions(root) && /(?:startExecution|executionArn|workflow|status)/i.test(content));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];
  const looksAsl = /(?:\"Type\"\s*:\s*\"(?:Task|Map|Parallel|Choice|Wait)|\bStartAt\b|\bStates\b|arn:aws:states)/i.test(fullText);

  if (looksAsl && /\"Type\"\s*:\s*\"Task\"/i.test(fullText) && !/\"TimeoutSeconds\"\s*:/i.test(fullText)) {
    findings.push('A Step Functions Task appears without an evident TimeoutSeconds; set a business deadline/heartbeat and define cancellation or reconciliation for timeout-after-commit.');
  }

  if (/(?:\"Retry\"|\bRetry\b)\s*[:=][\s\S]{0,500}(?:States\.ALL|\"States\.ALL\")/i.test(fullText) &&
      !/(?:MaxAttempts|BackoffRate|IntervalSeconds|JitterStrategy)/i.test(fullText)) {
    findings.push('A broad States.ALL retry appears without bounded attempts/backoff; retry only transient errors and keep the retry budget below the business deadline.');
  }

  if (/(?:\"Type\"\s*:\s*\"EXPRESS\"|StateMachineType\s*[:=]\s*[\"']EXPRESS[\"'])/i.test(fullText) &&
      /(?:waitForTaskToken|TaskToken|\.sync|human|approval|payment|charge|long.?running)/i.test(fullText)) {
    findings.push('Express workflow semantics appear alongside callback/.sync, human, payment, or long-running work; verify duration/integration limits and at-least-once/idempotency before using Express, or choose Standard.');
  }

  if (/(?:\"Type\"\s*:\s*\"Map\"|\bMap\b)/i.test(fullText) && !/(?:\"MaxConcurrency\"|maxConcurrency|MaxConcurrencyPath)/i.test(fullText)) {
    findings.push('Map/parallel fan-out appears without an evident MaxConcurrency; bound it from downstream and per-tenant capacity instead of allowing an unbounded burst.');
  }

  if (/(?:StartExecution|startExecution|StartExecutionCommand)/i.test(fullText) &&
      !/(?:executionName|execution_name|\bname\s*[:=]|idempot|businessKey|clientRequestToken)/i.test(fullText)) {
    findings.push('A workflow start path appears without an evident execution name/idempotency key; make duplicate clicks, caller retries, and timeout-after-start safe.');
  }

  if (/(?:Resource|resource)\s*[:=]\s*[\"']\*[\"']|(?:Action|actions)\s*[:=][\s\S]{0,180}[\"']\*[\"']|AdministratorAccess/i.test(fullText) &&
      (WORKFLOW_PATH.test(normalized) || /arn:aws:states|step.?functions/i.test(fullText))) {
    findings.push('Broad IAM action/resource or administrator access appears near workflow configuration; narrow the state-machine execution role and each task/resource trust boundary.');
  }

  if (/(?:TaskToken|taskToken|waitForTaskToken)/i.test(fullText) &&
      /(?:console\.|logger\.|log\(|URL|url|query|searchParams|path)/i.test(fullText)) {
    findings.push('A Step Functions task token appears near logging or URL/query construction; treat it as an expiring bearer secret, bind/authenticate the callback, and never expose or log it.');
  }

  if (/(?:tenant|multi.?tenant|organization|workspace|tenantId|orgId)/i.test(fullText) &&
      (WORKFLOW_PATH.test(normalized) || looksAsl) &&
      !/(?:membership|entitlement|authorize|authorization|permission|object.?owner|tenant.?check|tenant.?predicate|current.?user)/i.test(fullText)) {
    findings.push('Tenant concepts appear without an evident server-side authorization check; validate membership/status/action/resource at workflow start and sensitive task/data boundaries.');
  }

  if (looksAsl && /(?:ResultPath\"\s*:\s*\"\$\"|OutputPath\"\s*:\s*\"\$\")/i.test(fullText) &&
      /(?:large|payload|body|items|records|results|event)/i.test(fullText)) {
    findings.push('The workflow appears to carry whole task results through state; bound input/output with paths or JSONata and pass large artifacts through encrypted/versioned S3 references.');
  }

  if (UI_SOURCE.test(normalized) && /(?:startExecution|executionArn|workflow)/i.test(fullText)) {
    findings.push('The UI starts or observes a workflow; treat StartExecution as accepted/pending rather than completion, use bounded tenant-authorized status updates, and preserve retry/cancel/error states.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The step-functions-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a workflow, state-data, IAM, tenancy, deployment, or performance decision; this hook is advisory and read-only.',
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
