#!/usr/bin/env bash

# --- Configuration (edit values if needed) ---
PROTEUS_CONTEXT_PATH=/proteus
PROTEUS_PORT=5053
ACPHOST=10.2.16.22
ACPUSER=applplmu
AGHOME=/u11/agile/agile936/agileDomain

APP=proteus

export PROTEUS_CONTEXT_PATH PROTEUS_PORT ACPHOST ACPUSER AGHOME

# --- Functions ---
start() {
  echo "Starting $APP on port $PROTEUS_PORT..."
  nohup ./$APP >$APP.out 2>&1 &
  echo "Started with PID $!"
}

stop() {
  echo "Stopping $APP on port $PROTEUS_PORT..."
  pid=$(lsof -ti tcp:$PROTEUS_PORT)
  if [ -n "$pid" ]; then
    echo "Killing PID $pid"
    kill -9 $(lsof -ti tcp:$PROTEUS_PORT)
    echo "Stopped."
  else
    echo "No process is running on port $PROTEUS_PORT"
  fi
}

status() {
  pid=$(lsof -ti tcp:$PROTEUS_PORT)
  if [ -n "$pid" ]; then
    echo "$APP is running (PID $pid) on port $PROTEUS_PORT"
  else
    echo "$APP is not running on port $PROTEUS_PORT"
  fi
}

# --- Main dispatcher ---

case "$1" in
  start)   start ;;
  stop)    stop  ;;
  restart) stop; start ;;
  status)  status ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
