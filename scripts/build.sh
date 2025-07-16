#!/usr/bin/env bash
set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Clean previous build
rm -rf build
mkdir -p build/

function build_project() {
    cd packages/$1
    bun install
    bun run build
    cd ../..
}

build_project "commons"
build_project "site"
build_project "simulator"

# Copy site output to build/
cp -r packages/site/_site/* build/

# Copy simulator output to build/simulator/
mkdir -p build/simulator
cp -r packages/simulator/dist/* build/simulator/

echo "Build complete!"
