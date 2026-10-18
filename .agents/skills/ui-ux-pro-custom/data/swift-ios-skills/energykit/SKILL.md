---
name: energykit
description: "Integrate EnergyKit electricity forecasts and load events for household energy features. Use for authorization, supported regions/devices, forecast queries, load submission, and energy-aware scheduling."
---

# EnergyKit

Provide grid electricity forecasts to help users choose when to use electricity.
EnergyKit identifies times when there is relatively cleaner or less expensive
electricity on the grid, enabling apps to shift or reduce load accordingly.
Targets Swift 6.2 / iOS 26+.

## Essential constraints

- Check entitlement, supported region, permission, and available venues before querying guidance.
- Preserve the guidance token and the begin/active/end load-event lifecycle.
- Handle service/rate-limit failures, match suggested actions to the device, and interpret ratings using the retained reference.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Setup | [recipe-01-setup.md](references/recipe-01-setup.md) |
| Core Concepts | [recipe-02-core-concepts.md](references/recipe-02-core-concepts.md) |
| Querying Electricity Guidance | [recipe-03-querying-electricity-guidance.md](references/recipe-03-querying-electricity-guidance.md) |
| Working with Guidance Values | [recipe-04-working-with-guidance-values.md](references/recipe-04-working-with-guidance-values.md) |
| Energy Venues | [recipe-05-energy-venues.md](references/recipe-05-energy-venues.md) |
| Submitting Load Events | [recipe-06-submitting-load-events.md](references/recipe-06-submitting-load-events.md) |
| Electricity Insights | [recipe-07-electricity-insights.md](references/recipe-07-electricity-insights.md) |
| Common Mistakes | [recipe-08-common-mistakes.md](references/recipe-08-common-mistakes.md) |
| Review Checklist | [recipe-09-review-checklist.md](references/recipe-09-review-checklist.md) |
| References | [recipe-10-references.md](references/recipe-10-references.md) |
