#!/bin/sh
export LD_LIBRARY_PATH=/usr/local/lib/
cd /home/vid/bmd-tools-master
./bmd-streamer -vS hdmi | avconv -i /dev/stdin  http://localhost:8090/feed1.ffm

