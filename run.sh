#!/usr/bin/env bash
# Boons & Curses - one-shot setup & dev runner.
#
# Usage:
#   ./run.sh                 # install + migrate + verify (full bootstrap)
#   ./run.sh install         # same as default
#   ./run.sh test            # run the whole test suite
#   ./run.sh dev             # start server + mobile together (Ctrl-C stops both)
#   ./run.sh server          # start backend only
#   ./run.sh mobile          # start Expo dev server only
#   ./run.sh sim [args...]   # forward to the simulator CLI
#   ./run.sh balance [args]  # forward to the balance matrix CLI
#   ./run.sh db              # (re)start Postgres and ensure bc_dev / bc_test exist
#   ./run.sh clean           # wipe node_modules + dist (nuclear)
#
# Assumes Linux with systemd/SysV Postgres. Adapt ensure_postgres() on macOS.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_BLUE="\033[34m"

log()   { printf "${C_BLUE}[bc]${C_RESET} %s\n" "$*"; }
ok()    { printf "${C_GREEN}[ok]${C_RESET} %s\n" "$*"; }
warn()  { printf "${C_YELLOW}[warn]${C_RESET} %s\n" "$*"; }
fail()  { printf "${C_RED}[fail]${C_RESET} %s\n" "$*" >&2; exit 1; }
step()  { printf "\n${C_BOLD}== %s ==${C_RESET}\n" "$*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

ensure_node() {
  require_cmd node
  local major
  major="$(node -e 'console.log(process.versions.node.split(".")[0])')"
  if [ "$major" -lt 20 ]; then
    fail "Node 20+ required (have $(node -v))"
  fi
  ok "Node $(node -v)"
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    ok "pnpm $(pnpm -v)"
    return
  fi

  log "pnpm not found, attempting install"

  # Strategy 1: corepack (bundled with Node 16.9+). packageManager field in
  # root package.json will drive pnpm version automatically.
  if command -v corepack >/dev/null 2>&1; then
    log "trying corepack enable"
    if corepack enable 2>/dev/null; then
      :
    elif command -v sudo >/dev/null 2>&1 && sudo -n corepack enable 2>/dev/null; then
      :
    else
      warn "corepack enable failed (needs privileges or PATH write access)"
    fi
    hash -r 2>/dev/null || true
  fi

  # Strategy 2: npm install -g pnpm (show errors so user can act)
  if ! command -v pnpm >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    log "trying npm install -g pnpm@10"
    npm install -g pnpm@10 2>&1 | tail -5 || true
    # npm -g may install outside PATH (e.g. /opt/node20/bin); add npm prefix bin
    local npm_prefix
    npm_prefix="$(npm config get prefix 2>/dev/null || true)"
    if [ -n "$npm_prefix" ] && [ -x "$npm_prefix/bin/pnpm" ]; then
      export PATH="$npm_prefix/bin:$PATH"
    fi
    hash -r 2>/dev/null || true

    if ! command -v pnpm >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
      log "npm global install needs elevated permissions; retrying with sudo"
      sudo npm install -g pnpm@10 || true
      hash -r 2>/dev/null || true
    fi
  fi

  # Strategy 3: Homebrew on macOS
  if ! command -v pnpm >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
    log "trying brew install pnpm"
    brew install pnpm >/dev/null 2>&1 || true
    hash -r 2>/dev/null || true
  fi

  # Strategy 4: standalone install script to ~/.local/share/pnpm
  if ! command -v pnpm >/dev/null 2>&1; then
    if command -v curl >/dev/null 2>&1; then
      log "trying standalone installer (curl pnpm.io)"
      curl -fsSL https://get.pnpm.io/install.sh | sh - >/dev/null 2>&1 || true
    elif command -v wget >/dev/null 2>&1; then
      log "trying standalone installer (wget pnpm.io)"
      wget -qO- https://get.pnpm.io/install.sh | sh - >/dev/null 2>&1 || true
    fi
    export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
    export PATH="$PNPM_HOME:$PATH"
    hash -r 2>/dev/null || true
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    printf "\n${C_RED}Could not install pnpm automatically.${C_RESET} Options:\n"
    printf "  ${C_BOLD}corepack enable${C_RESET}                # preferred (ships with Node 16.9+)\n"
    printf "  ${C_BOLD}sudo npm install -g pnpm@10${C_RESET}    # needs sudo for /usr/local\n"
    printf "  ${C_BOLD}brew install pnpm${C_RESET}              # on macOS\n"
    printf "  ${C_BOLD}curl -fsSL https://get.pnpm.io/install.sh | sh -${C_RESET}\n"
    printf "Then re-run: ${C_BOLD}./run.sh${C_RESET}\n"
    exit 1
  fi
  ok "pnpm $(pnpm -v)"
}

postgres_running() {
  pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1
}

ensure_postgres() {
  if postgres_running; then
    ok "Postgres already running"
    return
  fi
  log "starting Postgres"
  if command -v service >/dev/null 2>&1 && service postgresql status >/dev/null 2>&1; then
    sudo -n service postgresql start >/dev/null 2>&1 \
      || service postgresql start >/dev/null 2>&1 \
      || true
  elif command -v pg_ctl >/dev/null 2>&1; then
    pg_ctl -D "${PGDATA:-/usr/local/var/postgres}" start >/dev/null 2>&1 || true
  fi
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if postgres_running; then ok "Postgres up"; return; fi
    sleep 1
  done
  fail "could not start Postgres. Start it manually and re-run."
}

ensure_db() {
  local psql_cmd=""
  if sudo -n -u postgres psql -c '\q' >/dev/null 2>&1; then
    psql_cmd="sudo -n -u postgres psql"
  elif psql -U postgres -c '\q' >/dev/null 2>&1; then
    psql_cmd="psql -U postgres"
  else
    psql_cmd="psql"
  fi
  log "ensuring bc user + databases (via: $psql_cmd)"
  $psql_cmd -tc "SELECT 1 FROM pg_roles WHERE rolname='bc'" 2>/dev/null | grep -q 1 \
    || $psql_cmd -c "CREATE USER bc WITH PASSWORD 'bc' CREATEDB;" >/dev/null
  $psql_cmd -tc "SELECT 1 FROM pg_database WHERE datname='bc_dev'" 2>/dev/null | grep -q 1 \
    || $psql_cmd -c "CREATE DATABASE bc_dev OWNER bc;" >/dev/null
  $psql_cmd -tc "SELECT 1 FROM pg_database WHERE datname='bc_test'" 2>/dev/null | grep -q 1 \
    || $psql_cmd -c "CREATE DATABASE bc_test OWNER bc;" >/dev/null
  ok "Postgres databases ready (bc_dev, bc_test)"
}

ensure_env() {
  if [ ! -f apps/server/.env ]; then
    log "creating apps/server/.env from .env.example"
    cp apps/server/.env.example apps/server/.env
  fi
  ok "server .env present"
}

install_deps() {
  log "pnpm install"
  pnpm install --prefer-offline
  ok "deps installed"
}

prisma_setup() {
  log "applying Prisma migrations (bc_dev)"
  pnpm --filter @bc/server exec prisma migrate deploy

  log "applying Prisma migrations (bc_test)"
  TEST_URL="postgresql://bc:bc@127.0.0.1:5432/bc_test?schema=public"
  DATABASE_URL="$TEST_URL" pnpm --filter @bc/server exec prisma migrate deploy

  log "generating Prisma client"
  pnpm --filter @bc/server exec prisma generate >/dev/null
  ok "Prisma ready"
}

run_verify() {
  log "turbo typecheck + test (this may take a minute)"
  pnpm turbo run typecheck test
  ok "all checks passed"
}

cmd_install() {
  step "Bootstrap Boons & Curses"
  ensure_node
  ensure_pnpm
  ensure_postgres
  ensure_db
  ensure_env
  install_deps
  prisma_setup
  run_verify
  printf "\n${C_GREEN}${C_BOLD}Setup complete.${C_RESET}\n"
  printf "\nNext:\n"
  printf "  ${C_BOLD}./run.sh dev${C_RESET}      # start server + mobile\n"
  printf "  ${C_BOLD}./run.sh sim --games 10000${C_RESET}\n"
  printf "  ${C_BOLD}./run.sh balance --games 500${C_RESET}\n"
}

cmd_test() {
  ensure_postgres
  ensure_db
  pnpm turbo run typecheck test
}

cmd_server() {
  ensure_postgres
  ensure_db
  log "starting server on :5000"
  exec pnpm --filter @bc/server dev
}

cmd_mobile() {
  log "starting Expo dev server"
  exec pnpm --filter @bc/mobile start
}

cmd_sim() {
  shift || true
  pnpm --filter @bc/simulator build >/dev/null
  pnpm --filter @bc/simulator run sim "$@"
}

cmd_balance() {
  shift || true
  pnpm --filter @bc/simulator build >/dev/null
  pnpm --filter @bc/simulator run balance "$@"
}

cmd_db() {
  ensure_postgres
  ensure_db
}

cmd_clean() {
  warn "removing node_modules, dist, .turbo in every workspace"
  read -r -p "proceed? [y/N] " ans
  if [ "${ans:-n}" != "y" ] && [ "${ans:-n}" != "Y" ]; then
    log "aborted"
    return
  fi
  find . -type d \( -name node_modules -o -name dist -o -name .turbo \) \
    -not -path '*/Companion/*' -prune -exec rm -rf {} +
  ok "cleaned. run ./run.sh install to set up again."
}

cmd_dev() {
  ensure_postgres
  ensure_db
  ensure_env

  mkdir -p .logs
  log "starting server (log: .logs/server.log)"
  pnpm --filter @bc/server dev >.logs/server.log 2>&1 &
  SERVER_PID=$!

  log "starting Expo (log: .logs/mobile.log)"
  pnpm --filter @bc/mobile start --non-interactive >.logs/mobile.log 2>&1 &
  MOBILE_PID=$!

  cleanup() {
    printf "\n"
    log "stopping dev servers"
    kill "$SERVER_PID" "$MOBILE_PID" 2>/dev/null || true
    wait "$SERVER_PID" "$MOBILE_PID" 2>/dev/null || true
    ok "stopped"
  }
  trap cleanup EXIT INT TERM

  ok "server pid=$SERVER_PID  mobile pid=$MOBILE_PID"
  log "tailing logs; Ctrl-C to stop"
  tail -F .logs/server.log .logs/mobile.log
}

# ----------------------------------------------------------------------------

main() {
  local cmd="${1:-install}"
  case "$cmd" in
    install|setup|bootstrap) cmd_install ;;
    test)                    cmd_test ;;
    server)                  cmd_server ;;
    mobile)                  cmd_mobile ;;
    sim)                     cmd_sim "$@" ;;
    balance)                 cmd_balance "$@" ;;
    db)                      cmd_db ;;
    dev)                     cmd_dev ;;
    clean)                   cmd_clean ;;
    -h|--help|help)
      awk '/^#!/ {next} /^#/ {sub(/^# ?/, ""); print; next} {exit}' "${BASH_SOURCE[0]}"
      ;;
    *)
      fail "unknown command: $cmd (try: install, dev, test, server, mobile, sim, balance, db, clean)"
      ;;
  esac
}

main "$@"
