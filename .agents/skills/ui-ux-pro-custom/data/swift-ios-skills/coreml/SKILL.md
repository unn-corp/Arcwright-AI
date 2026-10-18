---
name: coreml
description: "Load, run, profile, or deploy Core ML models in Swift, including tensor/image inputs, Vision integration, compute units, and model lifecycle. Use apple-on-device-ai to choose between inference frameworks."
---

# Core ML Swift Integration

Inspect the existing model format/version, feature schema, deployment target,
and inference owner. Use the generated model interface when suitable; use
`MLFeatureProvider` for dynamic schemas. Framework selection or conversion
across runtimes belongs to the on-device inference task, not every prediction fix.

## Correctness and resource constraints

- Load/compile models away from UI-critical synchronous work. Prefer supported
  asynchronous loading, cache compiled downloads with version-aware ownership,
  and reuse loaded instances rather than recompiling or loading per prediction.
- Match every input's declared name, type, shape, ordering, and range. For
  `MLMultiArray`, respect strides and element types rather than assuming a
  contiguous Float buffer. Preserve the trained model's preprocessing contract.
- For image models, match orientation, crop/scale, channel format, and
  normalization. Vision can handle appropriate image preprocessing, but its
  configuration must still match training. Do not preprocess twice.
- Choose generated, feature-provider, batch, async, or stateful prediction APIs
  according to the installed SDK and model. Keep stateful sessions isolated per
  logical stream; do not share mutable recurrent state across unrelated users
  or requests.
- Let appropriate compute units participate by default, then measure actual
  dispatch and resource use. `.all` does not promise every operation runs on
  the Neural Engine. Respect execution/background restrictions before selecting
  GPU/Neural Engine work; keep a supported fallback for load/prediction failures.
- Keep model, tensor, and prediction objects in their supported isolation
  domain. Use an actor or existing owner for mutable lifecycle, without making
  non-Sendable framework instances cross domains unchecked. New `MLTensor`
  features require matching runtime availability.
- Account for model download integrity/versioning, disk use, activation, and
  rollback when models are delivered separately. Release unused models on
  memory pressure or lifecycle transitions when safe for active work.

## Validation and completion

Build with the target SDK and actual concurrency settings. Compare representative
predictions against independent known outputs using the same preprocessing;
include relevant shape/type errors and unavailable resources. After conversion
or compression, check quality as well as latency/size. Measure cold/warm loading,
peak memory, and compute dispatch on relevant hardware when performance is the
requested behavior; do not infer acceleration from simulator results.

Stop when the requested inference path is correct and its resource constraints
are met or a specific limitation is documented. Do not add a model benchmark
suite or alternate backend without an unresolved requirement.

## Conditional recipes

- [Loading](references/implementation-guide.md#loading-models),
  [configuration](references/implementation-guide.md#model-configuration),
  [prediction APIs](references/implementation-guide.md#making-predictions),
  [multi-arrays](references/implementation-guide.md#working-with-mlmultiarray),
  and [image preprocessing](references/implementation-guide.md#image-preprocessing).
- [Pipelines](references/implementation-guide.md#multi-model-pipelines),
  [Vision](references/implementation-guide.md#vision-integration),
  [profiling](references/implementation-guide.md#performance-profiling),
  [deployment](references/implementation-guide.md#model-deployment), and
  [memory](references/implementation-guide.md#memory-management).
- [Extended Swift model/tensor and lifecycle recipes](references/coreml-swift-integration.md).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
