---
name: nimbalyst-tracking
description: Nimbalyst structured item tracking syntax. Use when identifying tasks, bugs, ideas, or decisions.
---

# SKILL: Nimbalyst Structured Tracking

## Goal
Integrate structured item tracking across all AI agent interactions using YAML frontmatter blocks.

## Tracked Item Types
- `task`: Actionable items to be completed.
- `bug`: Defects found in code or design.
- `idea`: Potential improvements or new concepts.
- `decision`: Key architectural or product decisions.
- `feature-request`: User or stakeholder requested features.
- `technical-debt`: Identified code or architecture smells.
- `user-feedback`: Feedback gathered from users.
- `user-story`: Agile user stories generated during planning.
- `plan`: Planning items.

## Rules
1. **Structured YAML Blocks**: Output trackable items as `trackingStatus` YAML frontmatter in markdown files.
2. **Capture Aggressively**: Every time you identify a bug, make a decision, or propose an idea, create a tracker.
3. **File Placement**: Write tracker files to `nimbalyst-local/tracker/[type]-[id].md`
4. **MCP Bridge**: If you have access to `tracker_create` or `tracker_update` MCP tools (Nimbalyst environment), call them directly IN ADDITION to writing the file. This ensures items appear immediately on the Nimbalyst Trackers page.
5. **Status Updates**: When updating an existing item's status:
   - Update the `status` and `updated` fields in the file's YAML frontmatter
   - If `nimbalystId` is present in frontmatter, call `tracker_update(id: nimbalystId, status: mapped_status)`
   - If `nimbalystId` is NOT present, search `tracker_list(search: title)` to find the item, then call `tracker_update`

### MCP Tool Field Mapping

| YAML Field | MCP `tracker_create` Param | Notes |
|------------|---------------------------|-------|
| `title`    | `title`                   | Required |
| `type`     | `type`                    | task, bug, idea, decision |
| `priority` | `priority`                | low, medium, high, critical |
| `status`   | `status`                  | See status mapping below |
| `tags`     | `tags`                    | Pass as array |
| body       | `description`             | Markdown description |

### Status Mapping (File -> Nimbalyst MCP)

| File Status    | Nimbalyst Status |
|---------------|-----------------|
| Draft          | to-do           |
| Ready          | to-do           |
| In Development | in-progress     |
| In Review      | in-progress     |
| Completed      | done            |
| Rejected       | to-do           |
| Blocked        | to-do           |

## Item Structure

Each tracker item is a markdown file with this frontmatter:

```yaml
---
trackingStatus:
  itemId: [type]-[unique-id]
  nimbalystId: [nimbalyst-id]    # Set by sync automation or MCP bridge - enables direct updates
  title: [Short Description]
  type: [task|bug|idea|decision]
  status: [Draft|Ready|In Development|In Review|Completed|Rejected|Blocked]
  priority: [None|Low|Medium|High|Critical]
  assignee: [username]
  tags:
    - [tag1]
    - [tag2]
  created: "YYYY-MM-DD"
  updated: "YYYY-MM-DDTHH:MM:SS.sssZ"
---

Description and details here.
```

## Example Usage

If you are the Architect and you just decided to use Redis for pub/sub:

"I have decided to use Redis for the WebSocket pub/sub implementation. Here is the recorded decision:

```yaml
---
trackingStatus:
  itemId: decision-pubsub-01
  title: "Use Redis for WebSocket Pub/Sub"
  type: decision
  status: Completed
  priority: Medium
  assignee: []
  tags:
    - architecture
    - websockets
    - redis
  created: "2026-03-11"
  updated: "2026-03-11T12:00:00.000Z"
---
```

"
