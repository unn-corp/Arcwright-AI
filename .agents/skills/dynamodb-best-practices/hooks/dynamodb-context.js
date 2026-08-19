#!/usr/bin/env node
'use strict';

// Read-only UserPromptSubmit router. It never contacts AWS, reads credentials,
// edits files, or authorizes a database operation.

const fs = require('node:fs');

const DYNAMODB_TERMS = /\b(?:dynamodb|dynamo\s*db|ddb|dynamoose|dynamodbclient|dynamodbdocumentclient|cfn(table|globaltable)|global\s+secondary\s+index|local\s+secondary\s+index|partition\s+key|sort\s+key|single[- ]table)\b/i;
const AWS_TERMS = /\b(?:aws|amazon\s+web\s+services|cdk|cloudformation|sam|serverless|lambda|bedrock|strands|cloudwatch|iam|global\s+table)\b/i;
const DATA_TERMS = /\b(?:database|datastore|storage|persistence|schema|table|index|query|scan|migration|backfill|stream|ttl|capacity|item|record)\b/i;

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function isRelevant(prompt) {
  const text = String(prompt || '');
  return DYNAMODB_TERMS.test(text) || (AWS_TERMS.test(text) && DATA_TERMS.test(text));
}

function context() {
  return [
    'The dynamodb-best-practices skill is relevant to this request.',
    'Load its RULES.md before planning; load the full SKILL.md for DynamoDB/AWS data design, review, or migration work.',
    'Start from access-pattern and deployed-state evidence, preserve existing key/read/write/stream/TTL/IAM behavior, and classify changes before editing.',
    'This hook is a routing signal only: it performs no AWS or database writes and does not authorize live mutations.',
  ].join('\n');
}

const payload = readPayload();
const prompt = payload.prompt || payload.user_prompt || payload.message || '';
if (isRelevant(prompt)) {
  const event = payload.hook_event_name || 'UserPromptSubmit';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: context(),
    },
  }) + '\n');
}

module.exports = { isRelevant, context };
