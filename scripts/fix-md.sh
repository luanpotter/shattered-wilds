#!/usr/bin/env bash
set -euo pipefail

(cd "$(dirname "$0")/../docs" ; markdownlint -c ../.markdownlint.json **/*.md --fix)
