#!/bin/sh
set -e

# Set/refresh the SSH login user's password from env on every start, so the
# image itself never bakes in a real password - only .env does.
if [ -n "$APP_SSH_USER" ] && [ -n "$APP_SSH_PASSWORD" ]; then
    echo "${APP_SSH_USER}:${APP_SSH_PASSWORD}" | chpasswd
fi

/usr/sbin/sshd

exec "$@"
