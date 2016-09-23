#!/bin/sh
sleep 10 
$(which chromium-browser) --app="http://127.0.0.1:3000/" --window-position=0,0 --window-size=1280,720 --start-fullscreen --start-maximized & 
