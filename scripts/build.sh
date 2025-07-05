#!/usr/bin/env bash
set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Clean previous build
rm -rf build

# Build the site (Eleventy, via npm)
cd packages/site
npm install
npm run build

# Build the simulator (Vite, via bun)
cd ../simulator
bun install
bun run build

# Create build folder at repo root
cd ../..
mkdir -p build

# Copy site output to build/
cp -r packages/site/_site/* build/

# Copy simulator output to build/simulator/
mkdir -p build/simulator
cp -r packages/simulator/dist/* build/simulator/

echo "Build complete!"
