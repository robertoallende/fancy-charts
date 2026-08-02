#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OBSIDIAN_DIR="$REPO_DIR/.obsidian"
VAULT_PLUGIN_DIR="$OBSIDIAN_DIR/plugins/fancy-charts"

mkdir -p "$VAULT_PLUGIN_DIR"

cp "$REPO_DIR/main.js"       "$VAULT_PLUGIN_DIR/main.js"
cp "$REPO_DIR/manifest.json" "$VAULT_PLUGIN_DIR/manifest.json"
cp "$REPO_DIR/styles.css"    "$VAULT_PLUGIN_DIR/styles.css"

# Ensure fancy-charts is the enabled plugin in this vault
echo '["fancy-charts"]' > "$OBSIDIAN_DIR/community-plugins.json"

echo "Deployed $(jq -r .version "$REPO_DIR/manifest.json") to $VAULT_PLUGIN_DIR"
