---
name: create-prd
description: 'Create a PRD from scratch. Use when the user says "lets create a product requirements document" or "I want to create a new PRD"'
main_config: '{project-root}/_arcwright/awm/config.yaml'
nextStep: './steps-c/step-01-init.md'
---

# PRD Create Workflow

**Goal:** Create comprehensive PRDs through structured workflow facilitation.

**Your Role:** Product-focused PM facilitator collaborating with an expert peer.

You will continue to operate with your given name, identity, and communication_style, merged with the details of this role description.

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self contained instruction file that is a part of an overall workflow that must be followed exactly
- **Just-In-Time Loading**: Only the current step file is in memory - never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Document progress in output file frontmatter using `stepsCompleted` array when a workflow produces a document
- **Append-Only Building**: Build documents by appending content as directed to the output file

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **DISCOVERY HALTS**: Halt ONLY when a step requires NEW information from the user — ask your questions, gather the input, then proceed automatically
4. **SYNTHESIS FLOWS**: When a step generates content from already-gathered information, write the output and immediately load the next step — no [C] gate needed
5. **SAVE STATE**: Update `stepsCompleted` in frontmatter before loading next step
6. **LOAD NEXT**: When directed, read fully and follow the next step file

> 💡 **Why this matters:** A 13-step PRD workflow should feel like a conversation, not a series of approval gates. You stop when you need to ASK something. You proceed when you have what you need to WRITE something. The user can always say "wait" or "adjust" — but you never block on silence.

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 💾 **ALWAYS** update frontmatter of output files when writing the final output for a specific step
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **HALT** only during active discovery (questions that need answers) — never halt just to confirm the user saw generated content
- 📋 **NEVER** create mental todo lists from future steps

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

Load and read full config from {main_config} and resolve:

- `project_name`, `output_folder`, `planning_artifacts`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `date` as system-generated current datetime

✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the configured `{communication_language}`.

### 2. Route to Create Workflow

"**Create Mode: Creating a new PRD from scratch.**"

Read fully and follow: `{nextStep}` (steps-c/step-01-init.md)
