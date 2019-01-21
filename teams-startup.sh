#!/bin/bash

cd ./dev/newserver/
screen -dmS web8001 python server.py --port=8001
screen -dmS web8002 python server.py --port=8002
screen -dmS fetcher java -jar fetcher.jar 100

