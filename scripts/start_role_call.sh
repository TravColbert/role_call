#!/bin/sh
cd ~/role_call
if [ "$(pidof node)" ]
then
	echo "Node is running..."
	whiptail --defaultno --yes-button "Yes! Restart" --title "App is Running" --backtitle "Program Graphics App Server" --yesno "The Graphics App Server is already running.\nDo you want to restart it?" 10 40
	if [ "$?" -eq 0 ]
	then
		killall node
		~/start_role_call.sh
	else
		echo "Nothing done."
	fi
else
	$(which node) ./app.js
fi
