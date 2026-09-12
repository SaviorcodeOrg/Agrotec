#!/bin/sh
set -e

REPO_URL="https://github.com/SaviorcodeOrg/Agrotec.git"
APP_DIR="/app"

if [ -d "$APP_DIR/.git" ]; then
    echo "Pulling latest changes from $REPO_URL..."
    cd "$APP_DIR"
    git pull
else
    # $APP_DIR is never actually empty here - the node_modules anonymous
    # volume mount already put a (currently empty) node_modules dir in it,
    # which is enough for `git clone` to refuse it as a destination. Clone
    # to a temp dir instead, then copy everything in.
    echo "Cloning $REPO_URL..."
    TMP_DIR=$(mktemp -d)
    git clone "$REPO_URL" "$TMP_DIR"
    cp -a "$TMP_DIR"/. "$APP_DIR"/
    rm -rf "$TMP_DIR"
    cd "$APP_DIR"
fi

npm install

exec npm run dev -- --host 0.0.0.0 --port 5173
