/**
 * Squidhub-specific content that must never ship in the generic Arcwright
 * package. Single source of truth — required by BOTH:
 *
 *   - build/build.js               verifyNoLeaks(), the hard build-time gate
 *   - .claude/arcwright-hooks/gate-leak.js  the advisory per-edit gate
 *
 * These were previously duplicated in the two files with a "keep in sync"
 * comment; a pattern added to one and not the other meant the fast local gate
 * silently stopped mirroring the gate that actually fails the build.
 */
'use strict';

module.exports = {
  LEAK_PATTERNS: [
    /squidhub/i,
    /unnportal\.io/i,
    /nautilus/i,
    /squid-master/i,
    /UNN-\d+/,
    /mcp__squidhub__/i,
    /SquidAI/,
  ],
};
