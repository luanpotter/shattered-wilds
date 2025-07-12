#!/bin/bash -e

# Get the absolute path to the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
DOCS_DIR="$ROOT_DIR/docs"
CONFIG_FILE="$ROOT_DIR/.markdownlint.json"

# Enable globstar for ** patterns
shopt -s globstar

# Change to docs directory and run markdownlint
cd "$DOCS_DIR"
markdownlint -c "$CONFIG_FILE" --fix **/*.md
