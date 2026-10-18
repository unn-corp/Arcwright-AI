---
name: jetpack-compose
description: "Build and review Jetpack Compose or Compose Multiplatform UI: state, composition, modifiers, navigation, animation, effects, Material 3, accessibility, performance, and styles. Includes source-backed Android and multiplatform references."
---

# Jetpack Compose Expert Skill

Non-opinionated, practical guidance for writing correct, performant Jetpack Compose code.
Focuses on real pitfalls developers encounter daily, backed by analysis of the actual
`androidx/androidx` source code (branch: `androidx-main`).

## Version and scope

This Arcwright skill retains its `jetpack-compose` name and local routing. The reference library is
adapted from aldefy/compose-skill v2.4.0, pinned to commit
`954ef54ea32288fbc90745f012d09d7b791f0d8a`. Check the application's Compose, Kotlin,
Navigation and Material versions before using newer APIs. Experimental/Expressive APIs and Nav 3
are conditional references; preserve existing dependency and plugin choices.
Root `DESIGN.md` remains the canonical visual contract.

## Workflow

When helping with Compose code, follow this checklist:

### 1. Understand the request
- What Compose layer is involved? (Runtime, UI, Foundation, Material3, Navigation)
- Is this a state problem, layout problem, performance problem, or architecture question?

### 2. Consult the right reference
Read the relevant reference file(s) from `references/` before answering:

| Topic | Reference File |
|-------|---------------|
| `@State`, `remember`, `mutableStateOf`, state hoisting, `derivedStateOf`, `snapshotFlow` | `references/state-management.md` |
| Structuring composables, slots, extraction, preview | `references/view-composition.md` |
| Modifier ordering, custom modifiers, `Modifier.Node` | `references/modifiers.md` |
| `LaunchedEffect`, `DisposableEffect`, `SideEffect`, `rememberCoroutineScope` | `references/side-effects.md` |
| `CompositionLocal`, `LocalContext`, `LocalDensity`, custom locals | `references/composition-locals.md` |
| `LazyColumn`, `LazyRow`, `LazyGrid`, `Pager`, keys, content types | `references/lists-scrolling.md` |
| `NavHost`, type-safe routes, deep links, shared element transitions | `references/navigation.md` |
| `animate*AsState`, `AnimatedVisibility`, `Crossfade`, transitions | `references/animation.md` |
| `MaterialTheme`, `ColorScheme`, dynamic color, `Typography`, shapes | `references/theming-material3.md` |
| Recomposition skipping, stability, baseline profiles, benchmarking | `references/performance.md` |
| Semantics, content descriptions, traversal order, testing | `references/accessibility.md` |
| Removed/replaced APIs, migration paths from older Compose versions | `references/deprecated-patterns.md` |
| **Styles API** (experimental): `Style {}`, `MutableStyleState`, `Modifier.styleable()` | `references/styles-experimental.md` |
| Compose Multiplatform and platform boundaries | [multiplatform](references/multiplatform.md), [platform specifics](references/platform-specifics.md) |
| Nav 2 to Nav 3 migration and back stacks | [navigation migration](references/navigation-migration.md) |
| Paging, offline data and testing | [paging](references/paging.md), [offline](references/paging-offline.md), [MVI/testing](references/paging-mvi-testing.md) |
| Material 3 Expressive motion | [Material motion](references/material3-motion.md) |
| Design-to-code and component structure | [design mapping](references/design-to-compose.md), [atomic design](references/atomic-design.md) |
| Android TV and D-pad focus | [TV Compose](references/tv-compose.md) |
| Production crashes | [crash playbook](references/production-crash-playbook.md) |
| Requested PR/code review | [review checklist](references/pr-review.md), scoped to the user's request |


### 3. Apply and verify
- Write code that follows the patterns in the reference
- Flag any anti-patterns you see in the user's existing code
- Suggest the minimal correct solution — don't over-engineer

### 4. Cite the source
When referencing Compose internals, point to the exact source file:
```
// See: compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composer.kt
```

## Key Principles

1. **Compose thinks in three phases**: Composition → Layout → Drawing. State reads in each
   phase only trigger work for that phase and later ones.

2. **Recomposition is frequent and cheap** — but only if you help the compiler skip unchanged
   scopes. Use stable types, avoid allocations in composable bodies.

3. **Modifier order matters**. `Modifier.padding(16.dp).background(Color.Red)` is visually
   different from `Modifier.background(Color.Red).padding(16.dp)`.

4. **State should live as low as possible** and be hoisted only as high as needed. Don't put
   everything in a ViewModel just because you can.

5. **Side effects exist to bridge Compose's declarative world with imperative APIs**. Use the
   right one for the job — misusing them causes bugs that are hard to trace.

## Source Code Receipts

Beyond the guidance docs, this skill bundles the **actual source code** from
`androidx/androidx` (branch: `androidx-main`). When you need to verify how something
works internally, or the user asks "show me the actual implementation", read
the raw source from `references/source-code/`:

| Module | Source Reference | Key Files Inside |
|--------|-----------------|------------------|
| Runtime | `references/source-code/runtime-source.md` | Composer.kt, Recomposer.kt, State.kt, Effects.kt, CompositionLocal.kt, Remember.kt, SlotTable.kt, Snapshot.kt |
| UI | `references/source-code/ui-source.md` | AndroidCompositionLocals.android.kt, Modifier.kt, Layout.kt, LayoutNode.kt, ModifierNodeElement.kt, DrawModifier.kt |
| Foundation | `references/source-code/foundation-source.md` | LazyList.kt, LazyGrid.kt, BasicTextField.kt, Clickable.kt, Scrollable.kt, Pager.kt |
| Material3 | `references/source-code/material3-source.md` | MaterialTheme.kt, ColorScheme.kt, Button.kt, Scaffold.kt, TextField.kt, NavigationBar.kt |
| Navigation | `references/source-code/navigation-source.md` | NavHost.kt, ComposeNavigator.kt, NavGraphBuilder.kt, DialogNavigator.kt |

### Two-layer approach
1. **Start with guidance** — read the topic-specific reference (e.g., `references/state-management.md`)
2. **Go deeper with source** — if the user wants receipts or you need to verify, read from `references/source-code/`

### Source tree map
```
compose/
├── runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/
├── ui/ui/src/androidMain/kotlin/androidx/compose/ui/platform/
├── ui/ui/src/commonMain/kotlin/androidx/compose/ui/
├── foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/
├── material3/material3/src/commonMain/kotlin/androidx/compose/material3/
└── navigation/navigation-compose/src/commonMain/kotlin/androidx/navigation/compose/
```

Source: [aldefy/compose-skill](https://github.com/aldefy/compose-skill/tree/954ef54ea32288fbc90745f012d09d7b791f0d8a/skills/compose-expert). Original guidance is MIT; AndroidX source receipts retain Apache-2.0 notices. See [LICENSE](LICENSE).
