#!/usr/bin/env bash
set -uo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Parse command line arguments
PROJECTS_TO_RUN=()
if [ $# -eq 0 ]; then
    # No arguments provided, run all projects
    PROJECTS_TO_RUN=("simulator" "site" "docs")
else
    # Arguments provided, validate and use them
    for project in "$@"; do
        case "$project" in
            "simulator"|"site"|"docs")
                PROJECTS_TO_RUN+=("$project")
                ;;
            *)
                echo "❌ Error: Unknown project '$project'. Valid projects are: simulator, site, docs"
                exit 1
                ;;
        esac
    done
fi

echo "🔍 Linting projects: ${PROJECTS_TO_RUN[*]}..."

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

# Function to check if a project should be run
should_run_project() {
    local project=$1
    for p in "${PROJECTS_TO_RUN[@]}"; do
        if [ "$p" = "$project" ]; then
            return 0
        fi
    done
    return 1
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

# Check for markdownlint (optional but recommended)
if ! command_exists markdownlint; then
    print_status "33" "⚠️  Warning: markdownlint is not installed. Install with: npm install -g markdownlint-cli"
    MARKDOWNLINT_AVAILABLE=false
else
    MARKDOWNLINT_AVAILABLE=true
fi

# Initialize status variables
SIMULATOR_LINT_FAILED=false
SITE_BUILD_FAILED=false
SITE_FAILED=false
DOCS_FAILED=false

# Lint simulator project
if should_run_project "simulator"; then
    print_status "34" "📦 Linting simulator project..."
    cd packages/simulator

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "33" "📥 Installing simulator dependencies..." 1
        SIMULATOR_INSTALL_OUTPUT=$(bun install 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ Simulator dependencies installed" 1
        else
            print_status "31" "❌ Simulator dependencies installation failed" 1
            echo "$SIMULATOR_INSTALL_OUTPUT"
            exit 1
        fi
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
else
    print_status "33" "⏭️  Skipping simulator project"
fi

# Lint site project
if should_run_project "site"; then
    print_status "34" "📦 Linting site project..."
    cd packages/site

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "33" "📥 Installing site dependencies..." 1
        SITE_INSTALL_OUTPUT=$(npm install 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ Site dependencies installed" 1
        else
            print_status "31" "❌ Site dependencies installation failed" 1
            echo "$SITE_INSTALL_OUTPUT"
            exit 1
        fi
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
else
    print_status "33" "⏭️  Skipping site project"
fi

# Lint docs project
if should_run_project "docs"; then
    print_status "34" "📦 Linting docs project..."
    cd docs

    # Check for common issues in docs files
    print_status "36" "🔧 Checking docs files..." 1
    DOCS_ISSUES=0

    # Check for broken links in markdown files (basic check)
    if command_exists grep; then
        BROKEN_LINKS=$(find . -name "*.md" -not -path "./node_modules/*" -exec grep -l "\[.*\]()" {} \; 2>/dev/null || true)
        if [ -n "$BROKEN_LINKS" ]; then
            print_status "33" "⚠️  Warning: Found potential broken links in markdown files" 2
            echo "$BROKEN_LINKS"
            DOCS_ISSUES=$((DOCS_ISSUES + 1))
        else
            print_status "32" "✅ No broken links found" 2
        fi
    fi

    # Check for common markdown issues
    if [ "$MARKDOWNLINT_AVAILABLE" = true ]; then
        print_status "36" "🔧 Running markdownlint..." 1
        MARKDOWNLINT_OUTPUT=$(markdownlint "**/*.md" -c ../.markdownlint.json 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ Docs markdownlint passed" 1
        else
            print_status "31" "❌ Docs markdownlint failed" 1
            echo "$MARKDOWNLINT_OUTPUT"
            DOCS_ISSUES=$((DOCS_ISSUES + 1))
        fi
    else
        print_status "33" "⚠️  markdownlint not installed, skipping markdown checks" 1
    fi

    if [ $DOCS_ISSUES -eq 0 ]; then
        print_status "32" "✅ Docs checks passed" 1
    else
        print_status "31" "❌ Docs checks failed ($DOCS_ISSUES issues)" 1
        DOCS_FAILED=true
    fi

    cd ..
else
    print_status "33" "⏭️  Skipping docs project"
fi

# Summary
echo ""
print_status "34" "📊 Linting Summary:"

if should_run_project "simulator"; then
    if [ "$SIMULATOR_LINT_FAILED" = true ]; then
        print_status "31" "❌ Simulator: Failed"
    else
        print_status "32" "✅ Simulator: Passed"
    fi
else
    print_status "33" "⏭️  Simulator: Skipped"
fi

if should_run_project "site"; then
    if [ "$SITE_BUILD_FAILED" = true ] || [ "$SITE_FAILED" = true ]; then
        print_status "31" "❌ Site: Failed"
    else
        print_status "32" "✅ Site: Passed"
    fi
else
    print_status "33" "⏭️  Site: Skipped"
fi

if should_run_project "docs"; then
    if [ "$DOCS_FAILED" = true ]; then
        print_status "31" "❌ Docs: Failed"
    else
        print_status "32" "✅ Docs: Passed"
    fi
else
    print_status "33" "⏭️  Docs: Skipped"
fi

# Exit with error if any project failed
if [ "$SIMULATOR_LINT_FAILED" = true ] || [ "$SITE_BUILD_FAILED" = true ] || [ "$SITE_FAILED" = true ] || [ "$DOCS_FAILED" = true ]; then
    echo ""
    print_status "31" "❌ Linting failed! Please fix the issues above."
    exit 1
else
    echo ""
    print_status "32" "🎉 All linting checks passed!"
fi