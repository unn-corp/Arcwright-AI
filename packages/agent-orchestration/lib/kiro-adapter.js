'use strict';

/**
 * Rewrites generic Arcwright references for Kiro's skill and agent layout.
 *
 * This is used both while building Kiro agent prompts and while installing
 * generic skills into `.kiro/skills`, keeping those two representations in
 * sync without shipping a second skill tree.
 */
function adaptKiroContent(content) {
  let adapted = content;
  adapted = adapted.replace(/\.agents\/skills\//g, '.kiro/skills/');
  adapted = adapted.replace(/\.claude\/commands\//g, '.kiro/agents/');
  adapted = adapted.replace(
    /claude\s+--dangerously-skip-permissions/g,
    'kiro-cli chat --trust-all-tools --agent'
  );
  return adapted.replace(/,?\s*--dangerously-skip-permissions/g, '');
}

module.exports = { adaptKiroContent };
