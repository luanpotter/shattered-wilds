#!/usr/bin/env bash
set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Clean previous build
rm -rf build
mkdir -p build/

# Install all dependencies at the root level first to ensure workspace dependencies are resolved
echo "Installing dependencies..."
bun install

function build_project() {
    cd packages/$1
    echo " + Building $1..."
    bun install
    bun run build
    echo " + $1 built"
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
