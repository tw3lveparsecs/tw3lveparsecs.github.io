#!/usr/bin/env bash
set -euo pipefail

# Ensure the bundle matches Gemfile.lock (helps when using a persistent bundle volume)
bundle check >/dev/null 2>&1 || bundle install

exec "$@"
