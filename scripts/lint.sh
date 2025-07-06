#!/usr/bin/env bash
set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

echo "🔍 Linting projects..."

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    local indent=${3:-0}
    local indent_str=""
    for ((i=0; i<indent; i++)); do
        indent_str+="  "
    done
    echo -e "${indent_str}\033[${color}m${message}\033[0m"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists bun; then
    print_status "31" "❌ Error: bun is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_status "31" "❌ Error: npm is not installed"
    exit 1
fi

# Lint simulator project
print_status "34" "📦 Linting simulator project..."
cd packages/simulator

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "33" "📥 Installing simulator dependencies..." 1
    bun install
fi

# Run simulator linting checks
print_status "36" "🔧 Running lint..." 1
SIMULATOR_OUTPUT=$(bun run check 2>&1)
if [ $? -eq 0 ]; then
    print_status "32" "✅ Simulator lint passed" 1
else
    print_status "31" "❌ Simulator lint failed" 1
    echo "$SIMULATOR_OUTPUT"
    SIMULATOR_LINT_FAILED=true
fi

cd ../..

# Lint site project
print_status "34" "📦 Linting site project..."
cd packages/site

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "33" "📥 Installing site dependencies..." 1
    npm install
fi

# Basic site project checks
print_status "36" "🔧 Checking site package.json..." 1
SITE_BUILD_OUTPUT=$(npm run build 2>&1)
if [ $? -eq 0 ]; then
    print_status "32" "✅ Site build check passed" 1
else
    print_status "31" "❌ Site build check failed" 1
    echo "$SITE_BUILD_OUTPUT"
    SITE_BUILD_FAILED=true
fi

# Check for common issues in site files
print_status "36" "🔧 Checking site files..." 1
SITE_ISSUES=0

# Check for broken links in markdown files (basic check)
if command_exists grep; then
    BROKEN_LINKS=$(find . -name "*.md" -not -path "./node_modules/*" -exec grep -l "\[.*\]()" {} \; 2>/dev/null || true)
    if [ -n "$BROKEN_LINKS" ]; then
        print_status "33" "⚠️  Warning: Found potential broken links in markdown files" 2
        echo "$BROKEN_LINKS"
        SITE_ISSUES=$((SITE_ISSUES + 1))
    else
        print_status "32" "✅ No broken links found" 2
    fi
fi

if [ $SITE_ISSUES -eq 0 ]; then
    print_status "32" "✅ Site checks passed" 1
else
    print_status "31" "❌ Site checks failed ($SITE_ISSUES issues)" 1
    SITE_FAILED=true
fi

cd ../..

# Summary
echo ""
print_status "34" "📊 Linting Summary:"

if [ "${SIMULATOR_LINT_FAILED:-false}" = true ]; then
    print_status "31" "❌ Simulator: Failed"
else
    print_status "32" "✅ Simulator: Passed"
fi

if [ "${SITE_BUILD_FAILED:-false}" = true ] || [ "${SITE_FAILED:-false}" = true ]; then
    print_status "31" "❌ Site: Failed"
else
    print_status "32" "✅ Site: Passed"
fi

# Exit with error if any project failed
if [ "${SIMULATOR_LINT_FAILED:-false}" = true ] || [ "${SITE_BUILD_FAILED:-false}" = true ] || [ "${SITE_FAILED:-false}" = true ]; then
    echo ""
    print_status "31" "❌ Linting failed! Please fix the issues above."
    exit 1
else
    echo ""
    print_status "32" "🎉 All linting checks passed!"
fi