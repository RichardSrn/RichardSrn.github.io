#!/usr/bin/env python3

# Author: Serg Kolo
# Date: Oct 3rd, 2016
# Description: Script for aligning the center of 
#     user's active window with the center of the monitor
# Tested on: Ubuntu 16.04
# Written for: http://askubuntu.com/q/832720/295286

from __future__ import print_function
from gi.repository import Gdk
import subprocess

def get_offset(*args):
    command = ['xprop','-notype','_NET_FRAME_EXTENTS',
               '-id',str(args[0])
    ]

    out = subprocess.check_output(command)
    print("\n"*5)
    print(out)
    print("\n"*5)
    return int(out.decode().strip().split(',')[-2])

def main():

    screen = Gdk.Screen.get_default()
    window = screen.get_active_window()
    window.unmaximize()
    window_width = window.get_width()
    window_y = window.get_origin()[-1]
    print(window_y)
    window_monitor = screen.get_monitor_at_window(window)
    monitor_center = screen.get_monitor_geometry(window_monitor).width/2

    # if centers of window and screen are aligned
    # the top left corner will be at screen_center - window_width/2    
    new_position = monitor_center - window_width /2

    # For some reason there is vertical offset necessary
    # Apparently this comes form _NET_FRAME_EXTENTS value
    offset = get_offset(int(window.get_xid()))

    window.move(new_position,window_y-offset)
    print(window.get_origin()) 

if __name__ == '__main__':
    main()