# Step 3: Context Completion & Finalization

## Context:

- All rule categories from step-2 are complete; technology stack and versions are documented.
- This is the final step — optimize and finalize the GENERATED sections inside `{memory_file}` for
  AI agent consumption.

## YOUR TASK:

Finalize the GENERATED sections (`## Setup & commands`, `## Architecture`,
`## Gotchas / project context`) inside the native memory file `{memory_file}`, optimize them for LLM
efficiency, and provide guidance for usage and maintenance. Do not touch hand-authored sections.

## COMPLETION SEQUENCE:

### 1. Review the Memory File

Read the entire native memory file `{memory_file}` and analyze (focus only on the GENERATED
sections; leave hand-authored sections alone):

**Content Analysis:**

- Total length and readability for LLMs
- Clarity and specificity of rules
- Coverage of all critical areas
- Actionability of each rule

**Structure Analysis:**

- Logical organization of sections
- Consistency of formatting
- Absence of redundant or obvious information
- Optimization for quick scanning

### 2. Optimize for LLM Context

Ensure the file is lean and efficient:

**Content Optimization:**

- Remove any redundant rules or obvious information
- Combine related rules into concise bullet points
- Use specific, actionable language
- Ensure each rule provides unique value

**Formatting Optimization:**

- Use consistent markdown formatting
- Implement clear section hierarchy
- Ensure scannability with strategic use of bolding
- Maintain readability while maximizing information density

### 3. Final Content Structure

Ensure the GENERATED sections sit correctly inside the unified memory-file template. The full file
follows this section order (hand-authored sections left intact; only the three GENERATED sections are
authored by this workflow):

```markdown
# <Project Name>

## Project overview            <!-- hand-authored — DO NOT TOUCH -->

## Setup & commands            <!-- GENERATED -->

{{concise_technology_list}}
{{install_dev_build_test_lint_commands}}

## Architecture                <!-- GENERATED, hand-trimmed -->

{{module_and_directory_map_with_structural_rules}}

## Conventions                 <!-- hand-authored — DO NOT TOUCH -->
## Testing                     <!-- mixed: commands generated, discipline hand-authored -->
## Commit & PR rules           <!-- hand-authored — DO NOT TOUCH -->
## Security                    <!-- hand-authored — DO NOT TOUCH -->

## Gotchas / project context   <!-- GENERATED -->

{{specific_language_rules}}
{{framework_patterns}}
{{testing_requirements}}
{{style_and_quality_patterns}}
{{workflow_patterns}}
{{anti_patterns_and_edge_cases}}
```

**Maintenance notes (state to the user, don't write into the file unless a `## Usage` convention
already exists):**

- The memory file loads in full every session — keep it under ~200 lines, lean and scannable.
- Agents read it before implementing; humans hand-author overview/conventions/commit/security.
- Re-run this workflow when the stack, commands, or architecture change; it re-merges only the
  GENERATED sections.

### 4. Present Completion Summary

Based on user skill level, present the completion:

**Expert Mode:**
"Project context complete. GENERATED sections merged into the native memory file, optimized for LLM consumption with {{rule_count}} critical rules.

Memory file updated: `{memory_file}`

Ready for AI agent integration."

**Intermediate Mode:**
"Your project context is complete and optimized for AI agents!

**What we created:**

- {{rule_count}} critical implementation rules
- Technology stack with exact versions
- Framework-specific patterns and conventions
- Testing and quality guidelines
- Workflow and anti-pattern rules

**Key benefits:**

- AI agents will implement consistently with your standards
- Reduced context switching and implementation errors
- Clear guidance for unobvious project requirements

**Next steps:**

- AI agents should read this file before implementing
- Update as your project evolves
- Review periodically for optimization"

**Beginner Mode:**
"Excellent! Your project context guide is ready! 🎉

**What this does:**
Think of this as a 'rules of the road' guide for AI agents working on your project. It ensures they all follow the same patterns and avoid common mistakes.

**What's included:**

- Exact technology versions to use
- Critical coding rules they might miss
- Testing and quality standards
- Workflow patterns to follow

**How AI agents use it:**
They read this file before writing any code, ensuring everything they create follows your project's standards perfectly.

Your project context is saved and ready to help agents implement consistently!"

### 5. Final File Updates

Finalize the GENERATED sections inside `{memory_file}`:

- Confirm the three GENERATED sections (`## Setup & commands`, `## Architecture`,
  `## Gotchas / project context`) are present, in unified-template order, and trimmed for LLM
  efficiency.
- Confirm hand-authored sections are untouched.
- The native memory file does **not** carry generator frontmatter — do not add YAML frontmatter to
  it. (Track completion state only in your working notes / the workflow's run summary.)
- If the memory file was newly scaffolded, leave the hand-authored sections as clear stubs prompting
  the user to fill them.

### 6. Completion Validation

Final checks before completion:

**Content Validation:**
✅ All critical technology versions documented
✅ Language-specific rules are specific and actionable
✅ Framework rules cover project conventions
✅ Testing rules ensure consistency
✅ Code quality rules maintain standards
✅ Workflow rules prevent conflicts
✅ Anti-pattern rules prevent common mistakes

**Format Validation:**
✅ Content is lean and optimized for LLMs
✅ Structure is logical and scannable
✅ No redundant or obvious information
✅ Consistent formatting throughout

### 7. Completion Message

Present final completion to user:

"✅ **Project Context Generation Complete!**

The GENERATED sections are merged into your native memory file at:
`{memory_file}`

**📊 Context Summary:**

- {{rule_count}} critical rules for AI agents
- {{section_count}} comprehensive sections
- Optimized for LLM context efficiency
- Ready for immediate agent integration

**🎯 Key Benefits:**

- Consistent implementation across all AI agents
- Reduced common mistakes and edge cases
- Clear guidance for project-specific patterns
- Minimal LLM context usage

**📋 Next Steps:**

1. AI agents will automatically read this file when implementing
2. Update this file when your technology stack or patterns evolve
3. Review quarterly to optimize and remove outdated rules

Your project context will help ensure high-quality, consistent implementation across all development work. Great work capturing your project's critical implementation requirements!"

