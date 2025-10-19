#!/bin/bash -xe

# Hexagons Module Release Script
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 0.1.0

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version required"
    echo "Usage: $0 <version>"
    echo "Example: $0 0.1.0"
    exit 1
fi

echo "🚀 Releasing Hexagons Module v$VERSION"

# Ensure we're in the Hexagons package directory
cd "$(dirname "$0")/.."

# Update version in module.json
echo "📝 Updating module.json version to $VERSION"
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" module.json
rm module.json.bak

# Update version in package.json
echo "📝 Updating package.json version to $VERSION"
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
rm package.json.bak

# Build the module
echo "🔨 Building module..."
bun run build

# Test that the build was successful
if [ ! -f "dist/hexagons/module.json" ]; then
    echo "❌ Build failed - module.json not found in dist"
    exit 1
fi

echo "✅ Build successful"

# Git operations
echo "📦 Committing version bump..."
git add module.json package.json
git commit -m "Hexagons Module v$VERSION"

echo "🏷️  Creating tag hexagons-v$VERSION"
git tag "hexagons-v$VERSION"

echo "⬆️  Pushing to origin..."
git push origin master
git push origin "hexagons-v$VERSION"

echo ""
echo "🎉 Release initiated!"
echo "📍 Tag: hexagons-v$VERSION"
echo "🔗 Check release progress at: https://github.com/luanpotter/shattered-wilds/actions"
echo "📦 Release will be available at: https://github.com/luanpotter/shattered-wilds/releases"
echo ""
echo "📋 Installation URL for users:"
echo "https://github.com/luanpotter/shattered-wilds/releases/latest/download/hexagons.json"
