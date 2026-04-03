#!/bin/bash
latest=$(ls -t ~/.claude/projects/*/*.jsonl 2>/dev/null | head -1)
if [ -n "$latest" ]; then
  size=$(wc -c < "$latest")
  pct=$(( size * 100 / 800000 ))
  [ "$pct" -gt 100 ] && pct=100
  filled=$(( pct / 10 ))
  empty=$(( 10 - filled ))
  bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done
  echo "${bar} ${pct}%"
else
  echo "░░░░░░░░░░ --%"
fi
