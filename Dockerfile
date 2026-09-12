# Dockerfile - development image for the Node.js app
#
# This targets local/dev use with docker-compose.yml, which bind-mounts the
# source tree over this image and relies on nodemon for hot reload. It
# intentionally installs *all*
# dependencies (including devDependencies) because this image is never
# meant to be deployed as-is.
#
# A production image would differ: multi-stage build, `npm ci --omit=dev`,
# no bind mount, COPY the full source in, and run as a non-root user with a
# process manager / init. Out of scope for this temporary dev stack.

FROM node:22-alpine

# Node's default signal handling in Alpine containers can leave zombie
# processes around; dumb-init/tini keeps `docker compose down` / Ctrl+C fast.
RUN apk add --no-cache tini

# git - lets you `git clone`/`git pull` your real repo over the SSH access
# below instead of relying on an editor's file-sync extension.
RUN apk add --no-cache git

# SSH access for editing ./src remotely (reachable over Tailscale only - see
# tailscale/serve-config.json's TCP forward on :2222 - never published to
# the host or routed through the Cloudflare Tunnel). The login user is
# created here with a disabled password; docker-entrypoint.sh sets the real
# one from $APP_SSH_PASSWORD at container start, so no password is baked
# into the image.
RUN apk add --no-cache openssh \
    && ssh-keygen -A \
    && adduser -D -s /bin/sh server \
    && mkdir -p /var/run/sshd \
    && sed -i \
        -e 's/^#\?PermitRootLogin.*/PermitRootLogin no/' \
        -e 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' \
        -e 's/^#\?PermitEmptyPasswords.*/PermitEmptyPasswords no/' \
        /etc/ssh/sshd_config \
    && echo 'AllowUsers server' >> /etc/ssh/sshd_config

WORKDIR /usr/src/app

# Install dependencies first so this layer is cached unless package*.json
# changes (i.e. editing application source doesn't force a reinstall).
COPY package*.json ./
# No package-lock.json exists yet for this placeholder project, so `npm ci`
# would fail. Once you run `npm install` locally and commit the generated
# package-lock.json, switch this to `npm ci` for reproducible installs.
RUN npm install

# Copy the rest of the source. In dev, docker-compose.yml bind-mounts the
# real source tree over this directory anyway (see the `app` service's
# `volumes:` entry) - this COPY just means `docker build` alone still
# produces a runnable image without Compose.
COPY . .

ENV NODE_ENV=development \
    PORT=3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000 22

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

# `npm run dev` runs `node --watch src/index.js`, restarting on file changes.
CMD ["npm", "run", "dev"]
