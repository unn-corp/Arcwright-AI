---
name: apple-on-device-ai
description: "Choose and integrate Foundation Models, Core ML, MLX Swift, or llama.cpp for local inference on Apple devices. Use coreml for detailed Swift model integration; hosted model APIs are outside this skill."
---

# On-Device Inference on Apple Platforms

Inspect the task, supported devices, OS/SDK, latency/privacy requirements, and
existing inference backend. Pick one suitable backend; do not install a second
runtime or introduce a multi-backend abstraction without a concrete need.

| Need | Candidate |
|---|---|
| Supported-device text/structured generation | Foundation Models |
| Custom trained vision/audio/text model | Core ML |
| Specific open model on Apple Silicon | MLX Swift |
| Cross-platform GGUF inference | llama.cpp |
| OCR or ordinary linguistic analysis | Vision or NaturalLanguage before an LLM |

Framework and model support depend on the target device and current runtime.
Keep newer APIs conditional and preserve the application's deployment targets.

## Correctness and resource constraints

- Check Foundation Models availability before starting a session and provide
  useful behavior for unsupported devices, disabled features, or unavailable
  model assets. An OS version check alone does not establish availability.
- Serialize requests to a stateful `LanguageModelSession`; budget conversation
  input plus generated output and recover from cancellation, context overflow,
  refusals, and generation failures. Prewarming is optional when startup cost
  merits it, not a mandatory extra request.
- Use supported `@Generable`/`@Guide` constraints for structured output. Validate
  generated values and authorize every tool side effect in application code.
  Keep untrusted input separate from trusted instructions. Generated facts are
  not a substitute for a trusted data source.
- For Core ML conversion, match explicit input shapes/types and deployment
  requirements. Put training models in evaluation mode before export and verify
  representative outputs before and after compression or conversion.
- Reuse loaded models and isolate mutable sessions/tensors in their supported
  execution domain. Keep inference and loading off the UI's critical path;
  Sendable/actor constraints still apply across asynchronous boundaries.
- Select model size and quantization from measured device memory, latency,
  thermal behavior, and quality. Release resources when their owner no longer
  needs them; background execution and GPU access have additional restrictions.
  Do not assume a fixed RAM percentage proves safe operation.

## Validation and completion

Build against the installed SDK and exercise the requested feature on relevant
hardware. Compare output quality with an independent expected task outcome;
check unavailable-model and cancellation behavior. Measure cold/warm latency
and memory only as needed for the change. Simulator success does not establish
hardware acceleration, resource fit, or production model availability.

Stop when one backend meets the requested behavior and relevant constraints.
Report unsupported devices or unmeasured performance explicitly instead of
expanding into model training or a backend benchmark project.

## Conditional recipes

- [Backend overview](references/implementation-guide.md#framework-selection-router)
  and [multi-backend example](references/implementation-guide.md#multi-backend-architecture)
  only when more than one backend is justified.
- [Foundation Models sessions, structured output, tools](references/foundation-models.md).
- [Core ML conversion](references/coreml-conversion.md) and
  [optimization](references/coreml-optimization.md).
- [MLX Swift and llama.cpp](references/mlx-swift.md).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
