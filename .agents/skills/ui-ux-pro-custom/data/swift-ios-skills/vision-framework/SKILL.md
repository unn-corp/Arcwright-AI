---
name: vision-framework
description: "Implement OCR, face/barcode detection, segmentation, tracking, document scanning, or Core ML vision requests on Apple platforms. Choose API generations for the deployment target; live scanner UI uses VisionKit availability checks."
---

# Vision and VisionKit

Identify the input (still image, video frames, or live scanner), desired result,
latency/quality target, and minimum OS. Prefer the Swift-native request APIs
when supported, with legacy VNRequest implementations for older targets;
the newer API generation is not available merely because Vision is installed.

## Correctness constraints

- Select the actual request: OCR, face/barcode detection, person/instance masks,
  object tracking, document analysis, or a Core ML request. Limit languages,
  symbologies, regions, and quality levels to the feature's needs rather than
  requesting every possible detector for each frame.
- Keep analysis off the UI-critical execution path using supported async APIs
  or a controlled worker. Bound frames in flight and cancel/drop stale work
  so slow analysis does not build an unbounded camera backlog. Keep mutable
  requests/framework objects in their supported isolation domain.
- Preserve image orientation and crop/scale information. Vision coordinates
  are generally normalized with a bottom-left origin; transform them into the
  displayed image's geometry, including rotation, aspect fit/fill, and offsets.
  Pixel-to-point conversion alone does not place overlays correctly.
- Choose OCR accuracy/languages from the input and response budget. Filter or
  communicate confidence according to the task; an arbitrary universal threshold
  does not establish usable recognition. Handle empty results as a normal case.
- For tracking, retain sequence state across frames using the appropriate
  modern tracking context or legacy `VNSequenceRequestHandler`. Reset it when
  the stream/object changes. Do not create an unrelated per-frame detector and
  claim temporal tracking.
- For segmentation, handle mask resolution/pixel format and align composition
  to the original image. For Core ML requests, match preprocessing and model
  input/output schemas rather than double-normalizing or guessing labels.
- For VisionKit live scanning, check both hardware support and current
  availability before presentation, configure camera usage descriptions, and
  handle permission denial and lifecycle interruption. UIKit/SwiftUI wrappers
  must clean up delegates and keep UI work on the required actor.
- New document scanning/request APIs are conditional on the installed SDK and
  runtime; preserve supported older-device fallbacks where the app needs them.

## Validation and completion

Build against supported targets and exercise representative inputs with
independent expected results. Check orientation/crop overlays, empty/low-quality
input, and cancellation for the affected request. For video, measure relevant
throughput/latency and frame backlog on a device. A still-image unit example or
simulator preview does not prove live camera/scanner behavior.

Stop when the requested result and input/lifecycle constraints work. State
unavailable device/model checks; do not add unrelated detectors, train a model,
or process every video frame without an unresolved requirement.

## Conditional recipes

- [API generations](references/implementation-guide.md#two-api-generations),
  [request pattern](references/implementation-guide.md#request-pattern-modern-api),
  [OCR](references/implementation-guide.md#text-recognition-ocr),
  [faces](references/implementation-guide.md#face-detection),
  [barcodes](references/implementation-guide.md#barcode-detection),
  [documents](references/implementation-guide.md#document-scanning-ios-26),
  [segmentation](references/implementation-guide.md#image-segmentation), and
  [tracking](references/implementation-guide.md#object-tracking).
- [Detailed Vision requests and mask/model integration](references/vision-requests.md).
- [VisionKit scanner UI](references/visionkit-scanner.md) only for interactive scanning.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
