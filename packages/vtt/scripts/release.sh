#!/bin/bash -xe

# Shattered Wilds VTT System Release Script
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 0.1.0

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version required"
    echo "Usage: $0 <version>"
    echo "Example: $0 0.1.0"
    exit 1
fi

echo "🚀 Releasing Shattered Wilds VTT System v$VERSION"

# Ensure we're in the VTT package directory
cd "$(dirname "$0")/.."

# Update version in system.json
echo "📝 Updating system.json version to $VERSION"
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" system.json
rm system.json.bak

# Update version in package.json
echo "📝 Updating package.json version to $VERSION"
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
rm package.json.bak

# Build the system
echo "🔨 Building system..."
bun run build

# Test that the build was successful
if [ ! -f "dist/shattered-wilds/system.json" ]; then
    echo "❌ Build failed - system.json not found in dist"
    exit 1
fi

echo "✅ Build successful"

# Git operations
echo "📦 Committing version bump..."
git add system.json package.json
git commit -m "VTT System v$VERSION"

echo "🏷️  Creating tag vtt-v$VERSION"
git tag "vtt-v$VERSION"

echo "⬆️  Pushing to origin..."
git push origin master
git push origin "vtt-v$VERSION"

echo ""
echo "🎉 Release initiated!"
echo "📍 Tag: vtt-v$VERSION"
echo "🔗 Check release progress at: https://github.com/luanpotter/shattered-wilds/actions"
echo "📦 Release will be available at: https://github.com/luanpotter/shattered-wilds/releases"
echo ""
echo "📋 Installation URL for users:"
echo "https://github.com/luanpotter/shattered-wilds/releases/latest/download/system.json"
