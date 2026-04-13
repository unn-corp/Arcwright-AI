#!/bin/bash
read -r total used <<< $(free -m | awk '/^Mem:/{print $2, $3}')
[ "$total" -gt 0 ] && echo "$(( 100 * used / total ))%" || echo "N/A"
