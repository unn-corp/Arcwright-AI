#!/bin/bash
read -r _ u1 n1 s1 i1 _ < /proc/stat
sleep 0.3
read -r _ u2 n2 s2 i2 _ < /proc/stat
total=$(( (u2+n2+s2+i2) - (u1+n1+s1+i1) ))
idle=$(( i2 - i1 ))
[ "$total" -gt 0 ] && echo "$(( 100 * (total - idle) / total ))%" || echo "0%"
