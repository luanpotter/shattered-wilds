#!/bin/bash -xe

# Usage: ./release.sh <version>
# Example: ./release.sh 0.1.x

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version is required."
    echo "Usage: $0 <version>"
    exit 1
fi

# Go to repo root
dirname=$(dirname "$0")
cd "$dirname/.."

function sed_in_place() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

version_regex="s/\"version\": \".*\"/\"version\": \"$VERSION\"/"

function shattered_wilds_release() {
    cd packages/vtt

    sed_in_place "$version_regex" system.json
    sed_in_place "$version_regex" package.json

    git add system.json package.json

    cd ../..
}

function hexagons_release() {
    cd packages/hexagons

    sed_in_place "$version_regex" module.json
    sed_in_place "$version_regex" package.json

    git add module.json package.json

    cd ../..
}

function git_operations() {
    if git diff --cached --quiet; then
        echo "No changes to commit."
        exit 1
    else
        git commit -m "Release v$VERSION"
    fi

    git tag "vtt-v$VERSION"
    git push origin master
    git push origin "vtt-v$VERSION"
}

function main() {
    echo "🚀 Releasing Shattered Wilds v$VERSION"

    shattered_wilds_release
    hexagons_release
    git_operations

    echo "✅ Release v$VERSION completed."
}

main
