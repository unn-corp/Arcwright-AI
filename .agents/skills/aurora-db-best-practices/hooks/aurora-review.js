#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused reminders and never calls AWS,
// runs SQL, changes a cluster, or blocks the edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksAurora } = require('./aurora-context');

const AURORA_CONFIG = /(?:^|\/)(?:aurora(?:\.[^/]+)?|rds-proxy(?:\.[^/]+)?|database(?:\.[^/]+)?|db-cluster(?:\.[^/]+)?|dbcluster(?:\.[^/]+)?|template(?:\.[^/]+)?\.(?:ya?ml|json)|serverless\.[^/]+|main\.tf)(?:$|\/)/i;
const DATABASE_SOURCE = /(?:^|\/)[^/]+\.(?:sql|tf|ya?ml|json|m?js|c?ts|py|go|java|rb)$/i;
const MIGRATION_SOURCE = /(?:^|\/)(?:migrations?|prisma|drizzle|schema|db)\//i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components)\/[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

function toolInput(payload = {}) { return payload.tool_input || payload.toolInput || payload.input || payload; }

function changedPath(payload = {}) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}

function changedText(payload = {}) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}

function readRepoFile(root, relative) {
  try { return fs.readFileSync(path.join(root, relative), 'utf8'); } catch { return ''; }
}

function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return AURORA_CONFIG.test(normalized) || MIGRATION_SOURCE.test(normalized) ||
    (DATABASE_SOURCE.test(normalized) && repoLooksAurora(root)) ||
    (UI_SOURCE.test(normalized) && repoLooksAurora(root));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];

  if (/(?:PubliclyAccessible|publiclyAccessible)\s*[:=]\s*true/i.test(fullText) ||
      /(?:0\.0\.0\.0\/0|::\/0)[^\n]*(?:5432|3306)|(?:5432|3306)[^\n]*(?:0\.0\.0\.0\/0|::\/0)/i.test(fullText)) {
    findings.push('Review public database exposure: keep Aurora private and restrict security-group ingress to known application identities rather than broad CIDRs.');
  }
  if (/(?:DeletionProtection|deletionProtection)\s*[:=]\s*false/i.test(fullText) ||
      /(?:RemovalPolicy\.DESTROY|deletionPolicy[^\n]*(?:Delete|delete))/i.test(fullText)) {
    findings.push('Destructive cluster deletion is configured; verify production deletion protection, retain policy, snapshot ownership, and an approved recovery path.');
  }
  if (/(?:StorageEncrypted|storageEncrypted|encryption|encrypted)\s*[:=]\s*false/i.test(fullText)) {
    findings.push('Encryption at rest is explicitly disabled; review KMS/encryption requirements before preserving this setting.');
  }
  if (/(?:password|masterUserPassword|DB_PASSWORD)\s*[:=]\s*["'][^$<{][^"']+["']/i.test(fullText)) {
    findings.push('A plaintext database credential may be present; use Secrets Manager or an approved secret reference and keep it out of templates, logs, and source.');
  }
  if (/(?:SELECT\s+\*|select\s+\*)/i.test(fullText)) {
    findings.push('Review SELECT * on a request path; bound columns and payload size, then validate the plan and UI/API latency.');
  }
  if (/(?:new\s+(?:Pool|Client)|createConnection\s*\()/i.test(fullText) &&
      /(?:handler|lambda|request|invocation|exports\.)/i.test(fullText)) {
    findings.push('Review connection creation scope and pool limits; do not create an unbounded database pool per request or serverless invocation.');
  }
  if (/(?:ServerlessV2ScalingConfiguration|MinCapacity|minCapacity)\s*[:=]\s*0(?:\.5)?/i.test(fullText)) {
    findings.push('Serverless v2 minimum capacity is very low; verify auto-pause/resume latency, working-set eviction, connection limits, failover capacity, and latency SLOs.');
  }
  if (/(?:offset\s+pagination|\bOFFSET\s+\d+)/i.test(fullText)) {
    findings.push('Review offset pagination against result size and data churn; use bounded deterministic keyset/cursor pagination for large or changing datasets.');
  }
  if (/(?:reader|promotionTier|promotion_tier)/i.test(fullText) && /(?:Aurora|DBCluster|rds|reader)/i.test(fullText)) {
    findings.push('Review reader AZ placement, promotion tier, capacity, connection distribution, and failover evidence before treating a reader as adequate failover capacity.');
  }
  if (/(?:RDSProxy|rds.?proxy|DBProxy)/i.test(fullText) && !/(?:pin|borrow|target.?health|DatabaseConnections|metric|monitor)/i.test(fullText)) {
    findings.push('Add RDS Proxy evidence: client/database connections, borrow latency, target health, timeout/errors, and session-pinning metrics.');
  }
  if (/(?:engine(?:Version|_version)?|EngineVersion)[\s:=]+[^\n]*(?:[0-9]+\.[0-9]+|major)/i.test(fullText) &&
      /(?:parameter.?group|schema|migration|upgrade)/i.test(fullText)) {
    findings.push('Split and stage major engine, parameter-group, schema, and application changes unless compatibility evidence justifies coupling; inspect replacement/reboot behavior.');
  }
  if (/(?:backupRetention|BackupRetention|automated.?backup|PITR|point.?in.?time)/i.test(fullText) &&
      !/(?:restore|snapshot.*test|recovery.*test|restore.*drill)/i.test(fullText)) {
    findings.push('Backups configured without visible restore evidence are not a recovery proof; require an isolated snapshot/PITR restore drill before risky upgrades or destructive changes.');
  }
  if (/(?:lambda|Function|handler)/i.test(fullText) && /(?:Pool|pool|connection)/i.test(fullText) &&
      !/(?:reserved.?concurrency|max.?concurrency|concurrency.?limit)/i.test(fullText)) {
    findings.push('Budget Lambda/serverless concurrency against database and proxy connections; configure or verify a bounded concurrency plan.');
  }
  if (/(?:rds\.force_ssl|force_ssl)\s*[:=]\s*["']?0|sslmode\s*=\s*(?:disable|allow|prefer)/i.test(fullText)) {
    findings.push('TLS enforcement may be disabled or weak; verify client certificate validation and the engine/version-specific force-SSL behavior.');
  }
  if (/(?:multi[- ]?tenant|tenant[_ -]?id|tenantId|tenant isolation|SaaS)/i.test(fullText) &&
      !/(?:row[- ]?level security|\bRLS\b|tenant[- ]?(?:scope|context|boundary)|tenant[- ]?leading|schema[- ]?per[- ]?tenant|database[- ]?per[- ]?tenant|cluster[- ]?per[- ]?tenant|isolation[- ]?(?:model|policy|enforcement))/i.test(fullText)) {
    findings.push('Multi-tenant Aurora code is visible without an obvious storage isolation control; review the pool/bridge/silo model, server-side membership, tenant context, RLS or an Aurora MySQL equivalent, and cross-tenant negative tests.');
  }
  if (/(?:search_path|schema|database).*(?:tenant|tenantId|tenant_id)|(?:tenant|tenantId|tenant_id).*(?:search_path|schema|database)/i.test(fullText) &&
      !/(?:allow[- ]?list|catalog|validated|quote_ident|identifier.*quote|server[- ]?owned)/i.test(fullText)) {
    findings.push('Tenant-derived schema/database routing may be unsafe; resolve identifiers through a server-owned catalog/allow-list and use safe identifier handling rather than client input.');
  }
  if (MIGRATION_SOURCE.test(normalized) || /(?:ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE|CREATE\s+INDEX)/i.test(fullText)) {
    findings.push('Treat schema DDL as a production rollout: check locks, table size, replication/WAL or binlog growth, compatibility, cancellation, backfill rate, and rollback.');
  }
  if (/(?:retry|retries)[\s\S]{0,160}(?:all|any|write|mutation|transaction)/i.test(fullText)) {
    findings.push('Classify transaction/mutation commit state before retrying; failover and network errors can leave the outcome ambiguous.');
  }
  if (UI_SOURCE.test(normalized)) {
    findings.push('For UI/API changes backed by Aurora, verify bounded/paginated reads, request waterfalls, p95/p99 latency, loading/error states, and authorization-aware caching.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The aurora-db-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a database, migration, performance, or recovery decision; this hook is advisory and read-only.',
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

module.exports = { changedPath, inspect, relevantPath };
