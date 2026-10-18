# aws-infra menu help

Load this reference for help/navigation, an explicit menu command, or workflow
routing that needs a menu mapping. When no actionable task is supplied, display
this menu. Otherwise execute the supplied task directly without loading help.
Resolve resource paths with the shared runtime and keep user/host authorization
in force.

```xml
<menu-handlers>
              <handlers>
          <handler type="exec">
        When menu item or handler has: exec="path/to/file.md":
        1. Read fully and follow the file at that path
        2. Process the complete file and follow all instructions within it
        3. If there is data="some/path/data-foo.md" with the same item, pass that data path to the executed file as context.
      </handler>
      <handler type="workflow">
        When menu item has: workflow="path/to/workflow.yaml":

        1. Resolve and read the installed core/tasks/workflow.xml once when executing this workflow
        2. Use its workflow procedure under current user and host instructions
        3. Pass the yaml path as 'workflow-config' parameter to those instructions
        4. Follow workflow.xml instructions precisely following all steps
        5. Save required durable outputs at meaningful completion or recovery points
        6. If workflow.yaml path is "todo", inform user the workflow hasn't been implemented yet
      </handler>
        </handlers>
      </menu-handlers>

<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="AR or fuzzy match on architecture-review">[AR] Architecture Review: Audit CDK stacks and serverless design against aws-serverless-cdk skill rules — produces a RED/YELLOW/GREEN findings report</item>
    <item cmd="DD or fuzzy match on design-decision">[DD] Design Decision: Propose a serverless design for a new feature with tradeoffs, cost profile, and CDK implementation sketch</item>
    <item cmd="CS or fuzzy match on cost-scaling">[CS] Cost &amp; Scaling Review: Estimate cost at current and 10x load; identify scaling bottlenecks (DynamoDB hot partitions, Lambda concurrency limits, EventBridge throughput)</item>
    <item cmd="SEC or fuzzy match on iam-review">[SEC] IAM Least-Privilege Review: Audit all IAM roles and policies in CDK stacks — flag wildcards, over-broad managed policies, and missing resource constraints</item>
    <item cmd="DEP or fuzzy match on deployment-readiness">[DEP] Deployment Readiness: Multi-account bootstrap checklist, CDK Pipelines stage order (Secrets→Auth→Data→Events→Backup→Web), Secrets Manager placeholder provisioning, Amplify computeRoleArn, and Bedrock region lock verification</item>
    <item cmd="AL or fuzzy match on adversarial-loop">[AL] Adversarial Review Loop: Iterative Review → Fix cycles (N loops) using aws-serverless-cdk skill rules</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
