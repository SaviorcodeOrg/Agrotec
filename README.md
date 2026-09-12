# Dockerized dev stack (placeholder project)

This repo had no existing Node.js app, so this is a minimal ESM ("type":
"module") placeholder: Express + `pg`, three routes (`/`, `/health`,
`/db-check`), zero build step, hot reload via `node --watch`. Swap in your
real application code; keep the env-var-driven DB config in `src/db.js` and
the Compose networking as-is.

The database UI is **Supabase Studio** (Studio-only mode: just Studio +
postgres-meta, pointed at this stack's own Postgres) - see "Why Studio-only"
below for what that does and doesn't give you.

## Architecture

```
                              INTERNET
                                 │
                                 ▼
                         Cloudflare Tunnel
                                 │ (outbound-only, cloudflared initiates)
                                 ▼
                    ┌─────────────────────┐
                    │   app (Node.js)     │  networks: edge, internal
                    │   :3000             │  no published ports
                    └──────────┬──────────┘
                               │ internal network
                               ▼
                    ┌─────────────────────┐
                    │   postgres          │  networks: internal only
                    │   :5432             │  no published ports
                    └──────────▲──────────┘
                               │ internal network
                    ┌──────────┴──────────┐
                    │   meta (postgres-   │  networks: internal only
                    │   meta) :8080       │  no published ports
                    └──────────▲──────────┘
                               │ internal network
                    ┌──────────┴──────────┐
                    │   studio            │  networks: internal,
                    │   :3000             │  tailnet_egress
                    └──────────▲──────────┘  no published ports
                               │ shares studio's network namespace
                    ┌──────────┴──────────┐
                    │   tailscale sidecar │  network_mode: service:studio
                    └──────────┬──────────┘
                               │
                          Tailscale VPN
                               │
                        your laptop/phone
                        (tailnet members only)
```

Three Docker networks do the isolation:

- `edge` (not internal): only `app` and `cloudflared` are on it. `cloudflared`
  has no route to postgres, meta, or studio even if its token leaked.
- `internal` (Compose `internal: true`, i.e. Docker adds no route to the
  outside world for it): `app`, `postgres`, `meta`, `studio` sit here so
  app/meta can reach Postgres, and Studio can reach meta, all by service
  name. Cloudflared is never attached to it.
- `tailnet_egress` (not internal): only `studio` is on it, purely so the
  tailscale sidecar sharing its netns has a route to the internet (see
  "Tailscale architecture" below).

`app` is the only service on both `edge` and `internal`, which is what lets
a public request reach it while postgres/meta/studio stay unreachable from
`edge`.

## Why Studio-only (not the full Supabase stack)

Real Supabase self-hosting is ~10 containers: Studio, postgres-meta, Kong
(API gateway), GoTrue (auth), PostgREST (REST API), Realtime, Storage,
imgproxy, and a couple of support services - plus JWT/anon/service-role
key management and a decision about whether to expose that API surface
through Cloudflare too. That's a much bigger thing than "replace pgAdmin."

This setup is the minimal, low-risk swap: **Studio + postgres-meta only**,
pointed at the same Postgres this stack already runs, sitting in exactly
the network slot pgAdmin used to occupy (internal-only, reachable via the
same Tailscale sidecar). You get:

- **Table Editor, SQL Editor, Database (schema/roles/extensions) tabs** -
  fully functional, via `meta`.

You do **not** get, because nothing here provides it:

- Auth, Storage, Realtime, or an actual REST/GraphQL API against your data
  - those tabs will render but show errors, since there's no
    Kong/GoTrue/PostgREST/Storage/Realtime behind them.

If you later want the real thing, say so and I'll build out the full
stack - it's a meaningfully bigger change (more containers, real JWT
secrets, and a call on what if anything gets a public hostname), which is
why it wasn't the default here.

## Tailscale architecture (read this before setting it up)

Direct-to-container Tailscale access is awkward in Compose because each
service normally gets its own network namespace, and Tailscale needs to
either own that namespace (a TUN device, kernel routing) or be told exactly
what to forward. The sidecar pattern here solves it:

```yaml
studio:
  # normal service, no ports published, no Tailscale-specific config
tailscale:
  network_mode: "service:studio"   # <-- shares Studio's netns, not its own
```

`network_mode: "service:studio"` makes the `tailscale` container share
Studio's network stack instead of getting one of its own - from
Tailscale's point of view, `localhost:3000` inside that shared namespace
*is* Studio. `TS_SERVE_CONFIG` (mounted from `tailscale/serve-config.json`)
tells `tailscale serve` to proxy the tailnet on port 443 (HTTPS,
MagicDNS-certified) to `http://127.0.0.1:3000`. The config has no
`AllowFunnel` entry, which means it stays reachable from your tailnet only
- Funnel (public internet exposure) requires an explicit per-hostname
opt-in there, so leaving it out keeps it off. The `tailscale` service has
no `cap_add`, no `devices:`, and no `--privileged`: Tailscale's default
`TS_USERSPACE=true` mode is enough for `serve` to work, so it never
touches host networking or needs `NET_ADMIN`/`/dev/net/tun`.

Net effect: `postgres`, `meta`, and `studio` never appear on `edge` or get
a published port, yet a device on your tailnet can open Studio at
`https://studio-dev.<your-tailnet-name>.ts.net`.

One manual prerequisite this depends on: **HTTPS Certificates** must be
turned on for your tailnet (Admin console → DNS → "Enable HTTPS
Certificates"). It's a free, one-time toggle - without it, `${TS_CERT_DOMAIN}`
has no certificate to serve and `tailscale serve` will fail to bind port
443. If you'd rather not enable that, the alternative is dropping the
`Web`/`TCP:443` block from `serve-config.json` in favor of a plain
`tailscale serve --http=8080 3000`-style config (no TLS, no cert
dependency) - ask and I can swap it in.

**Also needs real internet access to work at all** - the `tailscale`
container has to reach Tailscale's coordination/DERP servers, which is why
`studio` (and therefore its shared-netns sidecar) is on `tailnet_egress` in
addition to `internal`. If you ever see `tailscale` logs full of
`dial tcp ...: network is unreachable`, it means that network got removed
or the sidecar got pointed at a different, internal-only service - it's
not a Tailscale-side problem.

## Files in this repo

| File | Purpose |
|---|---|
| `Dockerfile` | Dev image for `app`: `node:22-alpine`, installs deps, runs `node --watch` |
| `docker-compose.yml` | The full stack: app, postgres, meta, studio, cloudflared, tailscale |
| `.env.example` | Placeholder env values - copy to `.env` and fill in |
| `.gitignore` / `.dockerignore` | Keep `.env`, `node_modules`, etc. out of git and build context |
| `tailscale/serve-config.json` | Tells the tailscale sidecar to proxy Studio over the tailnet |
| `src/index.js`, `src/db.js` | The placeholder app |

## Commands

```bash
cp .env.example .env      # then edit .env with real values
docker compose up -d
docker compose ps
docker compose logs -f app

docker compose down       # stops and removes containers, KEEPS volumes
                           # (do NOT add -v for routine shutdown - that
                           # deletes postgres_data)

docker compose up -d --build   # rebuild after Dockerfile/package.json changes
```

## Required `.env` values

```
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<pick something real>

# Supabase Studio (Studio-only mode - see "Why Studio-only" above)
PG_META_CRYPTO_KEY=<32+ random chars, e.g. `openssl rand -hex 16`>
JWT_SECRET=<32+ random chars - cosmetic here, nothing validates it>
SUPABASE_ANON_KEY=<any string - cosmetic here>
SUPABASE_SERVICE_KEY=<any string - cosmetic here>
STUDIO_DEFAULT_ORGANIZATION=Dev Organization
STUDIO_DEFAULT_PROJECT=app

CLOUDFLARE_TUNNEL_TOKEN=<from the Cloudflare setup below>

TS_AUTHKEY=<from the Tailscale setup below>
TS_HOSTNAME=studio-dev
```

## Cloudflare Tunnel setup

1. In the Cloudflare Zero Trust dashboard: **Networks → Tunnels → Create a
   tunnel** → choose "Cloudflared" → name it (e.g. `dev-stack`).
2. Cloudflare shows a token (a long string, sometimes as part of a
   `cloudflared service install <token>` command) - copy just the token
   into `.env` as `CLOUDFLARE_TUNNEL_TOKEN`. Do not paste it into
   docker-compose.yml.
3. Still in the dashboard, add a **Public Hostname** for the tunnel:
   - Subdomain/domain: whatever you want publicly reachable, e.g.
     `dev.yourdomain.com`
   - Service type: `HTTP`
   - URL: `app:3000` - the Compose service name and port, not `localhost`
     (cloudflared resolves `app` via the `edge` Docker network).
4. `docker compose up -d cloudflared` (or the whole stack) and check
   `docker compose logs -f cloudflared` for a "Registered tunnel connection"
   line. The hostname should be live within a minute or two.

## Tailscale setup

1. https://login.tailscale.com/admin/settings/keys → **Generate auth key**.
   For a temporary dev stack, check **Ephemeral** (node auto-removes itself
   when the container stops) and set a short **Expiry**.
2. Put the key in `.env` as `TS_AUTHKEY`.
3. Admin console → **DNS** → enable **HTTPS Certificates** (see the
   Tailscale architecture section above for why).
4. `docker compose up -d studio tailscale`. Check
   `docker compose logs -f tailscale` for the node registering; it should
   show up in the Tailscale admin console's machine list as `studio-dev`.
5. From any device on your tailnet: `https://studio-dev.<tailnet-name>.ts.net`
   (find your tailnet's exact `.ts.net` domain at
   https://login.tailscale.com/admin/dns, under MagicDNS, or run
   `docker compose exec tailscale tailscale status` and copy the hostname
   it prints).

## Studio connection details

- Studio in this setup has no login screen of its own (that's normally
  Kong's job, via `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`, which isn't
  part of this minimal stack) - whoever reaches the Tailscale URL gets in.
  That's an acceptable tradeoff for a temporary dev stack gated behind your
  tailnet, but don't treat it as a substitute for real access control if
  more than just you will be on that tailnet.
- It comes up already pointed at this stack's Postgres (`STUDIO_PG_META_URL`
  → `meta` → `postgres`) - there's no "Register → Server" step like
  pgAdmin's; open the URL and the Table Editor/SQL Editor should already
  show your `POSTGRES_DB` database.

## Migrating your existing WSL Postgres data (optional, manual, not automatic)

Nothing here touches your WSL Postgres install or its data automatically.
If/when you want to bring existing data into the Docker instance:

```bash
# From inside WSL, against your existing Postgres:
pg_dump -U <your_wsl_user> -d <your_wsl_db> -F c -f wsl_backup.dump

# Once the Docker stack is up:
docker cp wsl_backup.dump $(docker compose ps -q postgres):/tmp/wsl_backup.dump
docker compose exec postgres pg_restore -U ${POSTGRES_USER} -d ${POSTGRES_DB} --clean --if-exists /tmp/wsl_backup.dump
```

Adjust flags for your actual schema/ownership needs (`--no-owner` is common
if the WSL and Docker Postgres users differ). This is left as a manual,
deliberate step - your WSL data is never read or deleted by anything in
this repo.

## Security notes / known limitations

- Postgres, meta, and Studio publish no host ports at all; the only way to
  reach Studio is through the Tailscale sidecar, and the only way to reach
  the app is through the tunnel (or the commented-out `127.0.0.1:3000` port
  for local debugging).
- `internal: true` on the `internal` network is defense in depth on top of
  "no ports published" - Docker won't route that network to the internet
  even if a container on it were compromised.
- Tailscale runs with default userspace networking: no `NET_ADMIN`, no
  `/dev/net/tun`, no `--privileged`.
- Studio has no auth of its own in this setup (see "Studio connection
  details" above) - access control is entirely "who's on your tailnet."
- Secrets (`CLOUDFLARE_TUNNEL_TOKEN`, `TS_AUTHKEY`, Postgres password,
  `PG_META_CRYPTO_KEY`) live only in `.env`, which is git-ignored;
  `.env.example` has placeholders only. `JWT_SECRET`/`SUPABASE_ANON_KEY`/
  `SUPABASE_SERVICE_KEY` are cosmetic in this stack (nothing validates
  them, since there's no Kong/GoTrue) but keep them out of git anyway.
- No `package-lock.json` exists yet (see "What I could not test" below) -
  run `npm install` once you have real registry access and commit the
  generated lockfile, then switch the Dockerfile's `npm install` to
  `npm ci` for reproducible builds.
- This is a **temporary dev** stack, not a hardened production one: no
  resource limits, no read-only root filesystems, no non-root user in the
  containers, single-replica everything.

## What I could not test, and why

The sandbox this was built in blocks all container registries and the npm
registry at the network level (`Host not in allowlist`) - confirmed by
directly hitting `registry-1.docker.io`, `ghcr.io`, `quay.io`,
`mcr.microsoft.com`, and `registry.npmjs.org` and getting `403
host_not_allowed` from every one. Concretely, that means from *this*
environment I could not `npm install`, pull or build any image in this
stack, start it, or verify connectivity end-to-end myself.

What I *did* verify here: `node --check` passes on both app source files,
and `docker compose config` (via `--format json`) resolves the full
Compose file cleanly - correct network membership per service, `internal:
true` actually applied, and env-var interpolation (including the nested
`${STUDIO_DEFAULT_PROJECT:-${POSTGRES_DB}}` default) all resolve as
intended.

**The Studio/meta env vars are the part I'm least confident about without
a real run.** I pulled the exact image tags, ports, and variable names from
Supabase's own published docker-compose.yml and .env.example, but that
compose file assumes the full stack (Kong, GoTrue, etc.) is present - I
can't confirm from here whether `supabase/studio` degrades gracefully with
those services simply absent, or whether it errors more than expected on
the tabs that need them. The core path (Studio → `STUDIO_PG_META_URL` →
`meta` → `postgres`) is the well-documented, standard wiring, so that part
should work; if Studio behaves oddly beyond the Auth/Storage/API tabs,
send me `docker compose logs studio` and I'll adjust.

Please run `docker compose up -d` on your WSL machine (normal internet
access) and send me `docker compose ps` / `docker compose logs` output, or
just tell me what breaks.

## Remaining manual steps

1. `cp .env.example .env` and fill in real values, including the new
   Studio-related ones.
2. Create the Cloudflare Tunnel and note its token + public hostname (steps
   above).
3. Generate a Tailscale auth key and enable HTTPS Certificates on your
   tailnet (steps above).
4. `docker compose up -d` on a machine with normal internet access (your
   WSL install, not this sandbox).
5. Run `npm install` locally once so a `package-lock.json` gets generated,
   commit it, then switch `RUN npm install` to `RUN npm ci` in the
   Dockerfile.
6. If you want local `curl localhost:3000` access during development,
   uncomment the `ports:` block under `app` in docker-compose.yml.
