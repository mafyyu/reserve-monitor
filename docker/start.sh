#!/usr/bin/env bash
set -euo pipefail

mkdir -p /app/data
exec node /app/server.js
