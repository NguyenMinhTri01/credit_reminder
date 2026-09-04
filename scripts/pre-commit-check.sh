#!/usr/bin/env bash
set -e

echo "🚀 Running pre-commit selective checks..."

# Retrieve all staged files (Added, Copied, Modified, Renamed)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED_FILES" ]; then
  echo "ℹ️  No staged files to check."
  exit 0
fi

CHECK_BACKEND=false
CHECK_FRONTEND=false

# Check if backend files changed
if echo "$STAGED_FILES" | grep -q '^backend/'; then
  CHECK_BACKEND=true
fi

# Check if frontend files changed
if echo "$STAGED_FILES" | grep -q '^frontend/'; then
  CHECK_FRONTEND=true
fi

# Check if root/shared configuration files changed
if echo "$STAGED_FILES" | grep -qE '^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc|scripts/|\.husky/)'; then
  echo "📦 Shared root configuration changed. Triggering both backend and frontend checks."
  CHECK_BACKEND=true
  CHECK_FRONTEND=true
fi

# Run Backend checks
if [ "$CHECK_BACKEND" = true ]; then
  echo ""
  echo "----------------------------------------------------"
  echo "🔍 Checking Backend (Typecheck, Lint, Unit Test)..."
  echo "----------------------------------------------------"
  pnpm --filter backend typecheck
  pnpm --filter backend lint
  pnpm --filter backend test
  echo "✅ Backend checks passed!"
fi

# Run Frontend checks
if [ "$CHECK_FRONTEND" = true ]; then
  echo ""
  echo "----------------------------------------------------"
  echo "🔍 Checking Frontend (Typecheck, Lint, Unit Test)..."
  echo "----------------------------------------------------"
  pnpm --filter frontend typecheck
  pnpm --filter frontend lint
  pnpm --filter frontend test
  echo "✅ Frontend checks passed!"
fi

if [ "$CHECK_BACKEND" = false ] && [ "$CHECK_FRONTEND" = false ]; then
  echo "ℹ️  No backend or frontend changes detected. Skipping checks."
fi

echo ""
echo "🎉 All selective pre-commit checks passed successfully!"
exit 0
