---
name: background-processing
description: "Schedule or debug iOS background refresh, processing, continued tasks, and background transfers. Use when handling BGTaskScheduler registration, expiration, rescheduling, and background execution limits."
---

# Background Processing

Register, schedule, and execute background work on iOS using the BackgroundTasks
framework, background URLSession, and background push notifications.

## Choose the execution model

| Work | Choice and limits |
|---|---|
| Small data refresh | `BGAppRefreshTask`, about 30 seconds; the system chooses launch time from usage patterns |
| Maintenance or data processing | `BGProcessingTask`, minutes while idle; configure network and external-power requirements |
| User-started foreground work that continues in background | `BGContinuedProcessingTask`, iOS/iPadOS 26+; report `ProgressReporting` progress through its Live Activity; resource pressure can terminate it, prioritizing tasks with minimal progress |
| Transfers that survive suspension or termination | Background URLSession with a delegate |
| Brief fetch triggered remotely | Silent background push with `content-available: 1` |

## Prerequisites and lifecycle

- Declare every task identifier in Info.plist
  `BGTaskSchedulerPermittedIdentifiers`; otherwise submission throws
  `BGTaskScheduler.Error.Code.notPermitted`. Enable `UIBackgroundModes` `fetch`
  for refresh and `processing` for processing, with the matching Xcode Background
  Modes capabilities.
- Register handlers before app launch completes: UIKit
  `application(_:didFinishLaunchingWithOptions:)` or the SwiftUI `App` initializer.
- Schedule the next refresh/processing task inside its handler before doing work.
  Use at least 15 minutes for refresh; `earliestBeginDate` is a scheduling hint.
- Handle submission and work errors. Mark completion with the correct success
  value on every code path. Set `expirationHandler` to cancel in-flight work and
  mark failure. Make work incremental, save progress, check cancellation, and
  avoid blocking synchronous work in handlers.
- Continued processing starts immediately from a foreground user action. Choose
  its queue/fail submission strategy and check `supportedResources` before
  requesting resources such as the GPU.
- Background URLSession uses delegates, not async/closures. Move downloaded
  temporary files before `didFinishDownloadingTo` returns. On relaunch, store the
  system completion handler; call and clear it on the main actor when session
  events finish, and handle transfer errors.
- For background push, enable Remote notifications in Background Modes and
  register for remote notifications. Call `fetchCompletionHandler` promptly with
  `.newData`, `.noData`, or `.failed` as appropriate.

## Load the relevant topic

| Task | Reference |
|---|---|
| Info.plist, capabilities, UIKit or SwiftUI registration | [Configuration and registration](references/configuration-and-registration.md) |
| Schedule and handle refresh or processing | [Scheduled tasks](references/scheduled-tasks.md) |
| Foreground exports, continued-task progress or resources | [Continued processing](references/continued-processing.md) |
| Background downloads, relaunch completion or silent push | [Transfers and push](references/transfers-and-push.md) |
| Review failure patterns | [Common mistakes](references/common-mistakes.md) |
| Extended edge cases, simulated launches or push practices | [Extended background patterns](references/background-task-patterns.md) |

## Review Checklist

- [ ] All task identifiers listed in `BGTaskSchedulerPermittedIdentifiers`
- [ ] Required `UIBackgroundModes` enabled (`fetch`, `processing`)
- [ ] Tasks registered before app launch completes
- [ ] `setTaskCompleted(success:)` called on every code path
- [ ] `expirationHandler` set and cancels in-flight work
- [ ] Next task scheduled inside the handler (re-schedule pattern)
- [ ] `earliestBeginDate` uses reasonable intervals (15+ min for refresh)
- [ ] Background URLSession uses delegate (not async/closures)
- [ ] Background URLSession file moved in `didFinishDownloadingTo` before return
- [ ] `handleEventsForBackgroundURLSession` stores and calls completion handler
- [ ] Background push payload includes `content-available: 1`
- [ ] `fetchCompletionHandler` called promptly with correct result
- [ ] BGContinuedProcessingTask reports progress via `ProgressReporting`
- [ ] Work is incremental and cancellation-safe (`Task.checkCancellation()`)
- [ ] No blocking synchronous work in task handlers

## References

- See `references/background-task-patterns.md` for extended patterns, background
  URLSession edge cases, debugging with simulated launches, and background push
  best practices.
- [BGTaskScheduler](https://sosumi.ai/documentation/backgroundtasks/bgtaskscheduler)
- [BGAppRefreshTask](https://sosumi.ai/documentation/backgroundtasks/bgapprefreshtask)
- [BGProcessingTask](https://sosumi.ai/documentation/backgroundtasks/bgprocessingtask)
- [BGContinuedProcessingTask](https://sosumi.ai/documentation/backgroundtasks/bgcontinuedprocessingtask) (iOS 26+)
- [BGContinuedProcessingTaskRequest](https://sosumi.ai/documentation/backgroundtasks/bgcontinuedprocessingtaskrequest) (iOS 26+)
- [Using background tasks to update your app](https://sosumi.ai/documentation/uikit/using-background-tasks-to-update-your-app)
- [Performing long-running tasks on iOS and iPadOS](https://sosumi.ai/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados)
