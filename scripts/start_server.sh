#!/bin/sh
export LD_LIBRARY_PATH=/usr/local/lib/
cd /home/vid/bmd-tools-master
#./bmd-streamer -vS hdmi | $encoder -t 30 $1
# The '-t 30' switch records 30 seconds of video for testing
avserver -f ./avserver.conf
#./bmd-streamer -vS hdmi | $encoder http://192.168.10.1:8090/feed1.ffm
#./bmd-streamer -vS hdmi | $encoder -t 30 http://192.168.10.1:8090/feed1.ffm

### RTSP Streaming ###
#./bmd-streamer -S hdmi | cvlc --sout '#rtp{mux=ts,dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' -
### H264 over RTSP ###
#./bmd-streamer -S hdmi | cvlc --sout '#transcode{vcodec=h264,acodec=mp4a,vb=200,ab=16}:rtp{mux=ts,dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' -

#... with 1/4 scaling:
#./bmd-streamer -S hdmi | cvlc --sout '#transcode{scale=0.25,vcodec=h264,acodec=mp4a,vb=200,ab=16}:rtp{mux=ts,dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' -
#./bmd-streamer -S hdmi | cvlc --sout '#transcode{vcodec=h264,acodec=mp4a,vb=160,ab=96,width=320}:rtp{mux=ts,dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' -
#./bmd-streamer -S hdmi | cvlc -vvv --sout '#transcode{width=320}:rtp{dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' --swscale-mode=0 --scale=0.25 -
#./bmd-streamer -S hdmi | cvlc --sout '#transcode{vcodec=h264,acodec=mp4a,vb=200,ab=16}:rtp{mux=ts,dst=192.168.10.1,port=1234,sdp=rtsp://192.168.10.1:8080/test.sdp}' -

### H264 over UDP ###
#./bmd-streamer -S hdmi | cvlc --sout '#transcode{vcodec=h264,acodec=mp4a,vb=200,ab=16}:std{access=udp,mux=ts,dst=192.168.10.254:1234}' -
#./bmd-streamer -S hdmi | cvlc --sout '#standard{access=udp,mux=ts,dst=192.168.10.254:1234}' -

### HTTP Streaming ###
#./bmd-streamer -vS hdmi | cvlc --sout '#standard{access=http,mux=ts,dst=192.168.10.1:8080}' -

###./bmd-streamer -S hdmi | cvlc --swscale-mode 0 --sout-x264-preset fast --sout-x264-profile baseline --sout-x264-tune film --sout-transcode-threads 24 --no-sout-x264-interlaced --sout-x264-keyint 50 --sout-x264-lookahead 100 --sout-x264-vbv-maxrate 4000 --sout-x264-vbv-bufsize 4000 --sout-transcode-scale 0.25 --sout-transcode-hurry-up --sout-transcode-width 320 --sout-transcode-vb 400 --sout '#std{access=udp,mux=ts,dst=192.168.10.254:1234}' -
