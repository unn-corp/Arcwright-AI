## 10. Debugging Recipes

### Recipe: Object is invisible

```bash
# 1. Find the draw call that should render the object
rdc draws --json | jq '.[] | select(.name | contains("ObjectName"))'
# or search by pass:
rdc draws --pass "Main Pass" --json

# 2. Check if it's being culled
rdc pipeline EID rs --json   # Look at CullMode, FrontFace

# 3. Check depth state
rdc pipeline EID ds --json   # DepthEnable, DepthFunc, DepthWriteMask

# 4. Check blend state (maybe alpha is 0)
rdc pipeline EID om --json   # BlendEnable, SrcBlend, DestBlend

# 5. Check vertex transform
rdc debug vertex EID 0 --json   # Is the position off-screen or behind camera?

# 6. Check if the draw is even issuing primitives
rdc draw EID --json   # VertexCount, InstanceCount, IndexCount
```

### Recipe: Colors are wrong

```bash
# 1. Export the render target to see what's there
rdc rt EID -o D:/renderdoc/captures/analysis/wrong_color.png

# 2. Pick the problematic pixel
rdc pick-pixel X Y EID --json

# 3. Check texture bindings — is the right texture bound?
rdc bindings EID --json

# 4. Export the bound texture
rdc texture RESID -o D:/renderdoc/captures/analysis/bound_texture.png

# 5. Check shader constants — wrong material colors?
rdc shader EID ps --constants --json

# 6. Check blend state — additive when it should be alpha?
rdc pipeline EID om --json

# 7. Debug the pixel shader to trace the calculation
rdc debug pixel EID X Y --trace
```

### Recipe: Shadows are broken

```bash
# 1. Find the shadow pass
rdc passes --json
rdc draws --pass "Shadow*" --json

# 2. Export the shadow map
SHADOW_EID=$(rdc draws --pass "Shadow*" -q | tail -1)
rdc rt $SHADOW_EID -o D:/renderdoc/captures/analysis/shadow_map.png

# 3. Check shadow map resolution (is it too small?)
rdc bindings $SHADOW_EID --json   # Look at render target dimensions

# 4. Check depth bias
rdc pipeline $SHADOW_EID rs --json   # DepthBias, SlopeScaledDepthBias

# 5. Find the lighting pass that reads the shadow map
rdc draws --pass "Raster*" --json
LIGHT_EID=$(rdc draws --pass "Raster*" -q | head -1)

# 6. Check how the shadow map is sampled
rdc shader $LIGHT_EID ps --source   # Look for shadow sampling code
rdc shader $LIGHT_EID ps --constants --json   # Light matrices, bias values

# 7. Debug a shadowed pixel
rdc debug pixel $LIGHT_EID X Y --trace
```

### Recipe: Performance is bad

```bash
# 1. Get frame overview
rdc stats --json

# 2. Count draws per pass
rdc passes --json   # Look for passes with excessive draw counts

# 3. Look for redundant state changes
rdc events --limit 500 --json | jq 'group_by(.type) | map({type: .[0].type, count: length}) | sort_by(-.count)'

# 4. Check for large resources
rdc resources --sort size --json | jq '.[-10:]'   # Top 10 largest resources

# 5. Look for overdraw (if GPU counters available)
rdc counters --list
rdc counters --name "overdraw" --json

# 6. Export with wireframe overlay to visualize overdraw
rdc rt EID --overlay wireframe -o D:/renderdoc/captures/analysis/wireframe.png
```

### Recipe: What changed between two frames

```bash
# Quick diff
rdc diff before.rdc after.rdc --shortstat

# Detailed diffs
rdc diff before.rdc after.rdc --draws --json
rdc diff before.rdc after.rdc --framebuffer --diff-output D:/renderdoc/captures/analysis/frame_diff.png

# Compare pipeline state at specific draw
rdc diff before.rdc after.rdc --pipeline EID --json
```

### Recipe: Debug this pixel

```bash
# 1. Get pixel history — which draws touched this pixel?
rdc pixel X Y --json

# 2. Pick the draw that produced the final color
# (usually the last non-failing entry in pixel history)

# 3. Get the pixel's current value
rdc pick-pixel X Y EID --json

# 4. Debug the shader at that pixel
rdc debug pixel EID X Y --json

# 5. Get full execution trace if needed
rdc debug pixel EID X Y --trace

# 6. Check variable values at a specific shader line
rdc debug pixel EID X Y --dump-at LINE_NUMBER
```
