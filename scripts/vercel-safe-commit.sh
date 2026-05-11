#!/usr/bin/env bash
set -euo pipefail

# Crea un commit usando el noreply de GitHub (evita bloqueos de Vercel por "commit author").
# Uso:
#   ./scripts/vercel-safe-commit.sh "mensaje del commit"
#   ./scripts/vercel-safe-commit.sh "mensaje" --allow-empty

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 \"mensaje\" [--allow-empty]"
  exit 2
fi

MSG="$1"
shift || true

AUTHOR_NAME="Alberto"
AUTHOR_EMAIL="alberto3019@users.noreply.github.com"

GIT_AUTHOR_NAME="$AUTHOR_NAME" \
GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" \
GIT_COMMITTER_NAME="$AUTHOR_NAME" \
GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
git commit -m "$MSG" "$@"

