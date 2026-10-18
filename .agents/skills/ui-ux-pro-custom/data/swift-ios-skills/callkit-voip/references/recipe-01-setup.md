## Setup

### Project Configuration

1. Enable the **Voice over IP** background mode in Signing & Capabilities
2. Add the **Push Notifications** capability
3. For call directory extensions, add a **Call Directory Extension** target

### Key Types

| Type | Role |
|---|---|
| `CXProvider` | Reports calls to the system, receives call actions |
| `CXCallController` | Requests call actions (start, end, hold, mute) |
| `CXCallUpdate` | Describes call metadata (caller name, video, handle) |
| `CXProviderDelegate` | Handles system call actions and audio session events |
| `PKPushRegistry` | Registers for and receives VoIP push notifications |
