<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Step 2 — Generate the scene stills

One image per section, **all sharing the same style preamble** for cohesion. Default
model **`gpt_image_2`** (crisp, great at isometric illustration; returns a solid/white
background which is perfect for floating diorama "islands"). Use `nano_banana_2` only if
the brief is character/cartoon-heavy (note: `nano_banana_2` is a CLI alias — it resolves
to `nano_banana_pro`; it won't appear under that name in `higgsfield model list`).

Prompt shape (full templates in `references/prompts.md`):

```
<STYLE PREAMBLE, identical every time>. On a plain solid <bg> background with a soft
contact shadow. <PALETTE hexes>. No text, no letters, no logos, centered, 3:2.
Subject: <what is in THIS diorama>.
```

- **Anchor first — never batch all N cold.** Generate ONE anchor still (the most
  representative scene), show it to the user, and iterate the style preamble until they
  approve. Only then batch the remaining N-1 **with the approved anchor passed as
  `--image`** to lock the style. A style miss on the anchor costs 1 gen; after a cold
  batch it costs N. This is a hard gate — do not proceed past an unapproved anchor.
- Batch the rest concurrently, detached. Command per scene:
  `higgsfield generate create gpt_image_2 --prompt "$(cat scene_i.txt)" --image anchor.png --aspect_ratio 3:2 --resolution 2k --quality high --wait --wait-timeout 15m --json > scene_i.json 2>scene_i.err`
- Result URL is `.[]0.result_url` in the `--wait --json` output. `curl` it down.
- A generation may fail transiently (HTTP 503) — re-roll that one individually; don't
  restart the batch.
- **Review the batch before continuing.** It must read as one cohesive world (same
  angle, palette, light). Re-roll any off-style scene individually — the anchor style
  lock stays in force.

See `references/pipeline.md` for the exact batch script (idempotent — re-runs skip
finished assets, so a crash or re-roll never repays for done work).

---
