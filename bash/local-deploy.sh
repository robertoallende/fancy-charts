#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VAULT_PLUGIN_DIR="$REPO_DIR/example/.obsidian/plugins/fancy-charts"

mkdir -p "$VAULT_PLUGIN_DIR"

cp "$REPO_DIR/main.js"       "$VAULT_PLUGIN_DIR/main.js"
cp "$REPO_DIR/manifest.json" "$VAULT_PLUGIN_DIR/manifest.json"
cp "$REPO_DIR/styles.css"    "$VAULT_PLUGIN_DIR/styles.css"

echo "Deployed $(jq -r .version "$REPO_DIR/manifest.json") to $VAULT_PLUGIN_DIR"
