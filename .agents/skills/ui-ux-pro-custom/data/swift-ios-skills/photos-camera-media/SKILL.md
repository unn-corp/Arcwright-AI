---
name: photos-camera-media
description: "Implement photo selection, camera capture, image loading, or media playback in iOS apps. Use for picker/capture permissions, limited-library handling, async loading, downsampling, and capture lifecycle."
---

# Photos, Camera, and Media

Choose the narrowest system interaction: user-selected assets, direct library
management, camera capture, remote images, or playback. Inspect the existing
media owner, supported OS, permissions, and retention requirements first.

## Correctness constraints

- Prefer `PhotosPicker`/`PHPickerViewController` for choosing assets. The picker
  grants access to selected results without broad library authorization; request
  library access only for the actual direct-library operation. Handle limited,
  denied, restricted, and add-only states as appropriate.
- Check camera/microphone authorization before capture and include accurate
  usage descriptions for the capabilities used. Provide a useful denied state
  rather than repeatedly requesting a system prompt that cannot reappear.
- Load selected assets asynchronously with supported Transferable APIs. Handle
  cancellation, unavailable cloud assets, failed decoding, and partial
  multi-selection. Verify the resulting content type instead of assuming every
  selected item is a local image of the same format.
- Downsample large images for their display target before decoding/rendering
  full resolution. Respect orientation, color/scale requirements, and memory
  cost. Use suitable caching for remote images without retaining sensitive
  user media beyond the feature's contract.
- Own `AVCaptureSession` outside transient SwiftUI rendering. Serialize capture
  configuration/start/stop on a supported queue or actor, away from blocking
  the main thread, and keep session handles in that domain. A detached task
  is not automatically safe for non-Sendable capture objects.
- Synchronize preview and UI updates on the required actor. Handle interruptions,
  unavailable hardware, capture errors, and view/app lifecycle; stop running
  sessions and release observers/delegates when the owner no longer needs them.
  Choose session presets/output formats from actual image/video requirements.
- For recordings and playback, preserve audio-session/lifecycle ownership,
  cancellation, temporary-file cleanup, and completion semantics. A successful
  preview does not establish that the resulting file can be read or exported.

## Validation and completion

Build with actual concurrency settings and exercise the changed flow on
relevant hardware. Inspect representative orientation/size/media types, denied
or limited access, async cancellation, and capture stop/re-entry when relevant.
For thumbnail work, compare decoded memory to the intended display size; for
capture, inspect the produced asset, not only the preview. Simulator checks do
not establish camera behavior or permission state on a device.

Stop when the requested selection/capture/display/playback behavior and resource
cleanup are verified. Reuse existing media/test infrastructure; do not request
broader access or build a new media pipeline for an isolated picker change.

## Conditional recipes

- [Picker recipes](references/photospicker-patterns.md) and
  [permissions](references/implementation-guide.md#privacy-and-permissions).
- [Camera sessions and previews](references/camera-capture.md).
- [Image loading/downsampling/caching](references/image-loading-caching.md).
- [Audio/video playback](references/av-playback.md).
- [Overview examples](references/implementation-guide.md#image-loading-and-display)
  when a short integration example is needed.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
