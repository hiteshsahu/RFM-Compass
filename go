#!/usr/bin/env bash
# Copyright 2026 Hitesh Kumar Sahu — https://hiteshsahu.com
# SPDX-License-Identifier: Apache-2.0

set -e
set -o pipefail

# -----------------------------
# Config
# -----------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$ROOT_DIR/.venv"
PY="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"
UVICORN="$VENV_DIR/bin/uvicorn"

cd "$ROOT_DIR"

log() { echo -e "$@"; }

# -----------------------------
# HELP / HINT (Interactive)
# -----------------------------
help() {
cat <<HEREDOC
Usage: ./go <command> [options]

Commands:
=== 0. 🛠 PREREQUISITES     ===
=== 1. 💻 LOCAL DEVELOPMENT ===
=== 2. 🧪 BUILD             ===
=== 3. 🧹 CLEANUP           ===

Enter a number to see details:
HEREDOC

read -rn 1 option
echo ""; echo ""

case ${option} in
  0)
    echo "=== 🛠 PREREQUISITES ==="
    echo "⚙️  install_tools     -- Create .venv and upgrade pip"
    echo "📦  setup             -- Install backend (venv) and frontend (npm) dependencies"
    ;;

  1)
    echo "=== 💻 LOCAL DEVELOPMENT ==="
    echo "🌉  backend           -- Run the FastAPI backend on :8000"
    echo "🖥️  frontend          -- Run the Vite dev server on :5173 (proxies /api to :8000)"
    ;;

  2)
    echo "=== 🧪 BUILD ==="
    echo "🏗️  build             -- Type-check and build the frontend for production"
    ;;

  3)
    echo "=== 🧹 CLEANUP ==="
    echo "🧹  clean             -- Remove .venv, node_modules, __pycache__, and build output"
    ;;
  *)
    echo "Section $option does not exist"
    ;;
esac
}

# ---------------------------------------------------------------------------------------
# 0)                  === 🛠 PREREQUISITES ===
# ---------------------------------------------------------------------------------------
function install_tools() {
  log "🛠 Setting up the virtualenv..."
  if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
  fi
  "$PIP" install -q --upgrade pip
  log "✨ Python: $("$PY" --version)"
}

function setup() {
  install_tools

  log "📦 Installing backend (editable)..."
  "$PIP" install -e ./backend

  log "📦 Installing frontend dependencies..."
  (cd frontend && npm install)
}

# ---------------------------------------------------------------------------------------
#  1)                === 💻 LOCAL DEVELOPMENT ===
# ---------------------------------------------------------------------------------------
function backend() {
  log "🌉 Starting the FastAPI backend on :8000 (Ctrl-C to stop)..."
  (cd backend && "$UVICORN" app.main:app --reload --port 8000)
}

function frontend() {
  log "🖥️  Starting the Vite dev server on :5173 (Ctrl-C to stop)..."
  (cd frontend && npm run dev)
}

# ---------------------------------------------------------------------------------------
#  2)                === 🧪 BUILD ===
# ---------------------------------------------------------------------------------------
function build() {
  log "🏗️  Type-checking and building the frontend..."
  (cd frontend && npm run build)
}

# ---------------------------------------------------------------------------------------
#  3)                === 🧹 CLEANUP ===
# ---------------------------------------------------------------------------------------
function clean() {
  log "🧹 Cleaning build artifacts..."
  rm -rf "$VENV_DIR" frontend/node_modules frontend/dist
  find . -name "__pycache__" -exec rm -rf {} + 2>/dev/null
  find . -name "*.egg-info" -exec rm -rf {} + 2>/dev/null
}

# -----------------------------
# Dispatch
# -----------------------------
if [ $# -eq 0 ]; then
  help
else
  "$@"
fi
