#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  SafeTransit AI - Transportation Safety Monitoring Platform
#  Startup Script
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}    SafeTransit AI - Safety Monitoring Platform${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}[OK]${NC} Environment variables loaded"
else
  echo -e "${RED}[ERROR]${NC} .env file not found!"
  exit 1
fi

SERVER_PORT=${SERVER_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ── Clean up ports ──────────────────────────────────────────
echo -e "${YELLOW}[CLEANUP]${NC} Freeing ports ${SERVER_PORT} and ${FRONTEND_PORT}..."

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $SERVER_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}[OK]${NC} Ports cleaned"

# ── Check PostgreSQL ────────────────────────────────────────
echo -e "${BLUE}[CHECK]${NC} Verifying PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} PostgreSQL not found. Please install it."
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}[INFO]${NC} Starting PostgreSQL..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi
echo -e "${GREEN}[OK]${NC} PostgreSQL is running"

# ── Create Database ─────────────────────────────────────────
echo -e "${BLUE}[DB]${NC} Creating database '${DB_NAME}'..."
createdb "${DB_NAME}" 2>/dev/null || echo -e "${YELLOW}  Database already exists${NC}"
echo -e "${GREEN}[OK]${NC} Database ready"

# ── Install Dependencies ────────────────────────────────────
echo -e "${BLUE}[NPM]${NC} Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}[OK]${NC} Server dependencies installed"

echo -e "${BLUE}[NPM]${NC} Installing client dependencies..."
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}[OK]${NC} Client dependencies installed"

# ── Seed Database ───────────────────────────────────────────
echo -e "${BLUE}[SEED]${NC} Seeding database with sample data..."
cd "$PROJECT_DIR/server"
node seeds/seed.js
echo -e "${GREEN}[OK]${NC} Database seeded successfully"

# ── Start Services ──────────────────────────────────────────
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}    Starting Services with Hot Reload${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Start backend with nodemon (hot reload) - run from server dir
echo -e "${GREEN}[START]${NC} Backend server on port ${SERVER_PORT} (with hot reload)..."
cd "$PROJECT_DIR/server"
npx nodemon --config nodemon.json index.js &
SERVER_PID=$!
sleep 2

# Start frontend with React dev server (hot reload built-in)
echo -e "${GREEN}[START]${NC} Frontend on port ${FRONTEND_PORT} (with hot reload)..."
cd "$PROJECT_DIR/client"
PORT=$FRONTEND_PORT BROWSER=none npm start &
CLIENT_PID=$!

# ── Trap for cleanup ───────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}[SHUTDOWN]${NC} Stopping services..."
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  cleanup_port $SERVER_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}[OK]${NC} All services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}    SafeTransit AI is running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend:  ${BOLD}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  Backend:   ${BOLD}http://localhost:${SERVER_PORT}${NC}"
echo -e "  API Docs:  ${BOLD}http://localhost:${SERVER_PORT}/api/health${NC}"
echo ""
echo -e "  Login:     ${BOLD}admin@transport.com / password123${NC}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop all services"
echo ""

# Wait for both processes
wait
