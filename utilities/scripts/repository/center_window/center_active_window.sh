#!/bin/sh
eval $(xdotool getactivewindow getwindowgeometry --shell)
xpos=$(( $((1200 - WIDTH)) / 2))
ypos=$(( $((1920 - HEIGHT)) / 2))
xdotool getactivewindow windowmove $xpos $ypos
