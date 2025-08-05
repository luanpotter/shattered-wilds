#!/usr/bin/env bash
set -uo pipefail

# Go to repo root
cd "$(dirname "$0")/.."

# Parse command line arguments
PROJECTS_TO_RUN=()
FIX_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        simulator|site|commons)
            PROJECTS_TO_RUN+=("$1")
            shift
            ;;
        *)
            echo "❌ Error: Unknown argument '$1'. Valid arguments are: --fix, simulator, site, commons"
            echo "Usage: $0 [--fix] [simulator|site|commons...]"
            exit 1
            ;;
    esac
done

# If no projects specified, run all
if [ ${#PROJECTS_TO_RUN[@]} -eq 0 ]; then
    PROJECTS_TO_RUN=("simulator" "site" "commons")
fi

echo "🔍 Linting projects: ${PROJECTS_TO_RUN[*]}..."
if [ "$FIX_MODE" = true ]; then
    echo "🔧 Fix mode enabled - will attempt to fix issues automatically"
fi

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

# Function to run a project's checks
run_project_checks() {
    local project_name=$1
    local project_path=$2
    local status_var_name=$3

    print_status "34" "📦 Linting $project_name project..."

    cd "$project_path"

    # Run build
    print_status "36" "🔧 Running build..." 1
    BUILD_OUTPUT=$(bun run build 2>&1)
    if [ $? -eq 0 ]; then
        print_status "32" "✅ $project_name build passed" 1
    else
        print_status "31" "❌ $project_name build failed" 1
        echo "$BUILD_OUTPUT"
        eval "$status_var_name=true"
    fi

    # Run tests for commons package
    if [ "$project_name" = "commons" ]; then
        print_status "36" "🧪 Running tests..." 1
        TEST_OUTPUT=$(bun run test 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ $project_name tests passed" 1
        else
            print_status "31" "❌ $project_name tests failed" 1
            echo "$TEST_OUTPUT"
            eval "$status_var_name=true"
        fi
    fi

    # Run check or check:fix based on mode
    if [ "$FIX_MODE" = true ]; then
        print_status "36" "🔧 Running check:fix..." 1
        CHECK_OUTPUT=$(bun run check:fix 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ $project_name check:fix passed" 1
        else
            print_status "31" "❌ $project_name check:fix failed" 1
            echo "$CHECK_OUTPUT"
            eval "$status_var_name=true"
        fi
    else
        print_status "36" "🔧 Running check..." 1
        CHECK_OUTPUT=$(bun run check 2>&1)
        if [ $? -eq 0 ]; then
            print_status "32" "✅ $project_name check passed" 1
        else
            print_status "31" "❌ $project_name check failed" 1
            echo "$CHECK_OUTPUT"
            eval "$status_var_name=true"
        fi
    fi

    cd ../..
}

# Check for required tools
if ! command_exists bun; then
    print_status "31" "❌ Error: bun is not installed"
    exit 1
fi

# Check for markdownlint (optional but recommended)
if ! command_exists markdownlint; then
    print_status "33" "⚠️  Warning: markdownlint is not installed. Install with: npm install -g markdownlint-cli"
    MARKDOWNLINT_AVAILABLE=false
else
    MARKDOWNLINT_AVAILABLE=true
fi

# Install all dependencies at the root level first to ensure workspace dependencies are resolved
print_status "34" "📥 Installing all dependencies at root level..."
INSTALL_OUTPUT=$(bun install 2>&1)
if [ $? -eq 0 ]; then
    print_status "32" "✅ All dependencies installed" 1
else
    print_status "31" "❌ Dependencies installation failed" 1
    echo "$INSTALL_OUTPUT"
    exit 1
fi

# run root prettier
print_status "34" "🔧 Running prettier..."
if [ "$FIX_MODE" = true ]; then
    print_status "36" "🔧 Running prettier with --fix..." 1
    command="prettier:fix"
else
    print_status "36" "🔧 Running prettier..." 1
    command="prettier"
fi

PRETTIER_OUTPUT=$(bun run $command 2>&1)
if [ $? -eq 0 ]; then
    print_status "32" "✅ Prettier passed" 1
else
    print_status "31" "❌ Prettier failed" 1
    echo "$PRETTIER_OUTPUT"
    exit 1
fi

# Initialize status variables
SIMULATOR_FAILED=false
SITE_FAILED=false
COMMONS_FAILED=false

# Run checks for each project
if should_run_project "commons"; then
    run_project_checks "commons" "packages/commons" "COMMONS_FAILED"
else
    print_status "33" "⏭️  Skipping commons project"
fi

if should_run_project "site"; then
    run_project_checks "site" "packages/site" "SITE_FAILED"
else
    print_status "33" "⏭️  Skipping site project"
fi

if should_run_project "simulator"; then
    run_project_checks "simulator" "packages/simulator" "SIMULATOR_FAILED"
else
    print_status "33" "⏭️  Skipping simulator project"
fi

# Run markdown linting on everything
print_status "34" "📝 Running markdown linting..."
MARKDOWN_FAILED=false

if [ "$MARKDOWNLINT_AVAILABLE" = true ]; then
    if [ "$FIX_MODE" = true ]; then
        print_status "36" "🔧 Running markdownlint with --fix..." 1
    else
        print_status "36" "🔧 Running markdownlint..." 1
    fi

    # Find all markdown files in the project
    MARKDOWN_FILES=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./packages/*/node_modules/*" -not -path "./packages/*/dist/*" -not -path "./packages/*/_site/*")

    if [ -n "$MARKDOWN_FILES" ]; then
        if [ "$FIX_MODE" = true ]; then
            MARKDOWNLINT_OUTPUT=$(markdownlint --fix $MARKDOWN_FILES 2>&1)
        else
            MARKDOWNLINT_OUTPUT=$(markdownlint $MARKDOWN_FILES 2>&1)
        fi

        if [ $? -eq 0 ]; then
            if [ "$FIX_MODE" = true ]; then
                print_status "32" "✅ Markdown linting and fixing passed" 1
            else
                print_status "32" "✅ Markdown linting passed" 1
            fi
        else
            if [ "$FIX_MODE" = true ]; then
                print_status "31" "❌ Markdown linting and fixing failed" 1
            else
                print_status "31" "❌ Markdown linting failed" 1
            fi
            echo "$MARKDOWNLINT_OUTPUT"
            MARKDOWN_FAILED=true
        fi
    else
        print_status "33" "⚠️  No markdown files found" 1
    fi
else
    print_status "33" "⚠️  markdownlint not installed, skipping markdown checks" 1
fi

# Summary
echo ""
print_status "34" "📊 Linting Summary:"

if should_run_project "simulator"; then
    if [ "$SIMULATOR_FAILED" = true ]; then
        print_status "31" "❌ Simulator: Failed"
    else
        print_status "32" "✅ Simulator: Passed"
    fi
else
    print_status "33" "⏭️  Simulator: Skipped"
fi

if should_run_project "site"; then
    if [ "$SITE_FAILED" = true ]; then
        print_status "31" "❌ Site: Failed"
    else
        print_status "32" "✅ Site: Passed"
    fi
else
    print_status "33" "⏭️  Site: Skipped"
fi

if should_run_project "commons"; then
    if [ "$COMMONS_FAILED" = true ]; then
        print_status "31" "❌ Commons: Failed"
    else
        print_status "32" "✅ Commons: Passed"
    fi
else
    print_status "33" "⏭️  Commons: Skipped"
fi

if [ "$MARKDOWN_FAILED" = true ]; then
    print_status "31" "❌ Markdown: Failed"
else
    print_status "32" "✅ Markdown: Passed"
fi

# Exit with error if any project failed
if [ "$SIMULATOR_FAILED" = true ] || [ "$SITE_FAILED" = true ] || [ "$COMMONS_FAILED" = true ] || [ "$MARKDOWN_FAILED" = true ]; then
    echo ""
    print_status "31" "❌ Linting failed! Please fix the issues above."
    exit 1
else
    echo ""
    if [ "$FIX_MODE" = true ]; then
        print_status "32" "🎉 All linting and fixing checks passed!"
    else
        print_status "32" "🎉 All linting checks passed!"
    fi
fi
