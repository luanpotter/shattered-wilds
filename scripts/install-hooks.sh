#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "🔧 Installing Git hooks..."

# Write pre-commit hook
cat > "$HOOKS_DIR/pre-commit" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
echo "🔍 Running pre-commit linting checks..."
if "$REPO_ROOT/scripts/lint.sh"; then
    echo "✅ Pre-commit checks passed!"
    exit 0
else
    echo ""
    echo "❌ Pre-commit checks failed!"
    echo "Please fix the linting issues before committing."
    echo ""
    echo "You can run the linting script manually with:"
    echo "  ./scripts/lint.sh"
    echo ""
    echo "Or to skip this check (not recommended):"
    echo "  git commit --no-verify"
    exit 1
fi
EOF

chmod +x "$HOOKS_DIR/pre-commit"
echo "✅ pre-commit hook installed"

# Write post-merge hook
cat > "$HOOKS_DIR/post-merge" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
# Only reinstall if scripts/install-hooks.sh or this file changed
if git diff-tree --name-only -r HEAD@{1} HEAD | grep -Eq '^scripts/install-hooks.sh|^\.git/hooks/post-merge'; then
    echo "🔄 Detected updated install-hooks.sh or post-merge hook, reinstalling hooks..."
    "$REPO_ROOT/scripts/install-hooks.sh"
fi
EOF

chmod +x "$HOOKS_DIR/post-merge"
echo "✅ post-merge hook installed"

echo ""
echo "🎉 Git hooks setup complete!"
echo ""
echo "Available hooks:"
ls -la "$HOOKS_DIR" | grep -E "^-.*x" || echo "No executable hooks found"
echo ""
echo "To run this setup again:"
echo "  ./scripts/install-hooks.sh" 