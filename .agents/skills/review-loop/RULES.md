# Review Loop: quick rules

Read `SKILL.md` before execution.

- Ask the user which model to use before the first review; an explicit choice for this run counts. Wait for the answer and keep it across rounds/resumptions.
- Use available native or Arcwright Code/T3 Code tools with the chosen provider/model. No silent model fallback.
- Use one read-only reviewer, no nested agents; the coordinator fixes findings.
- Preserve scope and unrelated work. Record acceptance criteria, exact source, findings/closure conditions, model choice, evidence, and task IDs privately.
- Follow `subagent-protocol` for dispatch and recovery; T3 rounds use fresh tasks with stable retry IDs.
- Default to three rounds; extend to five for substantive issues showing progress.
- Fix valid defects minimally; dismiss with evidence. Reopen only with material evidence. Verify changed behavior; budget exhaustion never means approval.
- Avoid routine human approvals and unchanged test reruns. Publication requires existing authority after agreement.
- Report results and limits without AI attribution or reviewer credits.
