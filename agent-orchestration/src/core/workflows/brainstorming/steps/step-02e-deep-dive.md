# Step 2e: Deep Dive Mode (Parallel Discovery)

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ YOU ARE INITIATING A PARALLEL WORKFLOW
- 🎯 INSTRUCT THE USER OR ORCHESTRATOR TO SPAWN PARALLEL AGENTS
- 📋 PROVIDE THE EXACT COMMANDS TO RUN
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the `communication_language`

## YOUR TASK:

Instruct the user or orchestrator (Squid-Master) to spawn the Analyst, Tech Writer/Architect, and PM agents in parallel to deeply analyze the brainstorming topic.

## EXECUTION SEQUENCE:

### 1. Announce Deep Dive Mode

"Excellent choice. **Deep Dive Mode** activates our parallel agent teams to simultaneously analyze your idea from three distinct perspectives: Business/Market, User/Product, and Technical.

I will now instruct the orchestrator to spawn these agents."

### 2. Output the Spawn Command

Display the following exact instructions for the orchestrator (or user, if running manually):

```
Spawn three teammate agents in parallel to analyze the following topic: {session_topic}
Goals: {session_goals}
Context File: {context_file}

Teammate 1 (Business/Market Focus): run /bmad-agent-bmm-analyst to analyze the market viability, competitive landscape, and business value of the topic.
Teammate 2 (User/Product Focus): run /bmad-agent-bmm-pm to analyze the user personas, pain points, and core product experience of the topic.
Teammate 3 (Technical Focus): run /bmad-agent-bmm-architect to analyze the technical feasibility, architectural constraints, and implementation risks of the topic.

Synthesize all three perspectives into a unified list of critical questions and insights.
```

### 3. Update Frontmatter

Update the frontmatter:

```yaml
---
selected_approach: "deep-dive-parallel"
stepsCompleted: [1, 2]
---
```

Append to document:

```markdown
## Technique Selection

**Approach:** Deep Dive Mode (Parallel Elicitation)
**Selected Agents:** Analyst, PM, Architect
**Goal:** Analyze the topic from Business, User, and Technical perspectives simultaneously to generate a unified list of critical questions.
```

## SUCCESS METRICS:

✅ Deep Dive mode announced
✅ Parallel spawn instructions provided exactly as formatted
✅ Session topic and goals passed to the teammates
✅ Frontmatter updated

## NEXT STEP:

This concludes the brainstorming setup for Deep Dive mode. The parallel agents will now handle the deep dive elicitation and synthesis!
