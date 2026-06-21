#!/usr/bin/env bash
# Wait for a TCP service to be available
# Usage: ./wait-for-it.sh host:port [-t timeout] [-- command args...]

TIMEOUT=30
QUIET=0

echoerr() {
  if [ "$QUIET" -ne 1 ]; then printf "%s\n" "$*" 1>&2; fi
}

usage() {
  exitcode="$1"
  cat << USAGE >&2
Usage:
  $0 host:port [-t timeout] [-- command args...]
  -t TIMEOUT | --timeout=TIMEOUT       Timeout in seconds (default 30)
  --quiet                              Don't output status messages
  -- COMMAND ARGS                      Execute command after wait
USAGE
  exit "$exitcode"
}

wait_for() {
  for i in $(seq "$TIMEOUT"); do
    nc -z "$HOST" "$PORT" >/dev/null 2>&1
    result=$?
    if [ $result -eq 0 ]; then
      if [ "$QUIET" -ne 1 ]; then echoerr "Service $HOST:$PORT is available after $i seconds"; fi
      return 0
    fi
    sleep 1
  done
  echoerr "Timeout after $TIMEOUT seconds waiting for $HOST:$PORT"
  return 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    *:* )
    HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
    PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
    shift 1
    ;;
    -t=*|--timeout=*)
    TIMEOUT="${1#*=}"
    shift 1
    ;;
    -t|--timeout)
    TIMEOUT="$2"
    shift 2
    ;;
    --quiet)
    QUIET=1
    shift 1
    ;;
    --)
    shift
    break
    ;;
    --help)
    usage 0
    ;;
    *)
    echoerr "Unknown argument: $1"
    usage 1
    ;;
  esac
done

wait_for
WAIT_RESULT=$?

if [ "$WAIT_RESULT" -ne 0 ]; then
  exit 1
fi

if [ $# -gt 0 ]; then
  exec "$@"
fi
