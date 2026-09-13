#!/bin/sh
set -e

# gui/ used to be its own separate GitHub repo, cloned/pulled here on every
# start - that's why this used to `git clone`/`git pull`. Since "Unificar
# gui/ en el mismo repo bajo main", ./gui is bind-mounted straight from this
# same monorepo checkout (see docker-compose.yml's `gui` service), so the
# source is already there - no cloning needed or wanted anymore (cloning
# would dump the whole monorepo on top of this bind mount).

cd /app

npm install

exec npm run dev -- --host 0.0.0.0 --port 5173
